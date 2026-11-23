use crate::app::catalog::build_catalog;
use crate::app::models::{
    AppSettings, AppState, EnqueueItemInput, EnvInfo, QueueStatus, QueueStreamEvent,
};
use crate::app::portable_config::{resolve_storage_context, save_settings};
use crate::app::queue_runner::{cancel_stream, enqueue_items, ensure_worker_running, register_stream};
use crate::app::winget_service::{
    get_winget_version, list_installed_packages, search_packages, show_package_details,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::process::Command;
use tauri::ipc::Channel;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchPayload {
    query: String,
    source: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DetailsPayload {
    id: String,
    source: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnqueuePayload {
    items: Vec<EnqueueItemInput>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UidPayload {
    uid: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UrlPayload {
    url: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StorePayload {
    product_id: String,
}

#[tauri::command]
pub async fn package_command(
    action: String,
    payload: Value,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    match action.as_str() {
        "search_packages" => {
            let p: SearchPayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid search payload: {e}"))?;
            let source = p.source.unwrap_or_else(|| "all".to_string());
            let installed_snapshot = state.installed_cache.lock().unwrap().clone();
            let items = tokio::task::spawn_blocking(move || {
                search_packages(&p.query, &source, &installed_snapshot)
            })
            .await
            .map_err(|e| format!("Search task join error: {e}"))??;
            serde_json::to_value(items).map_err(|e| e.to_string())
        }
        "get_package_details" => {
            let p: DetailsPayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid details payload: {e}"))?;
            let source = p.source.unwrap_or_else(|| "winget".to_string());
            let details =
                tokio::task::spawn_blocking(move || show_package_details(&p.id, &source))
                    .await
                    .map_err(|e| format!("Details task join error: {e}"))??;
            serde_json::to_value(details).map_err(|e| e.to_string())
        }
        "list_installed" => {
            let records = tokio::task::spawn_blocking(list_installed_packages)
                .await
                .map_err(|e| format!("List installed join error: {e}"))??;
            {
                let mut cache = state.installed_cache.lock().unwrap();
                cache.clear();
                for rec in &records {
                    cache.insert(rec.id.clone(), rec.clone());
                    cache.insert(rec.id.to_lowercase(), rec.clone());
                }
            }
            serde_json::to_value(records).map_err(|e| e.to_string())
        }
        "get_curated_catalog" => {
            let installed_snapshot = state.installed_cache.lock().unwrap().clone();
            let catalog = build_catalog(&installed_snapshot);
            serde_json::to_value(catalog).map_err(|e| e.to_string())
        }
        _ => Err(format!("Unknown package_command action: {action}")),
    }
}

#[tauri::command]
pub async fn queue_command(
    action: String,
    payload: Value,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    match action.as_str() {
        "get_queue" => {
            let items = state.queue.lock().unwrap().clone();
            let is_processing = *state.is_processing.lock().unwrap();
            Ok(json!({ "items": items, "isProcessing": is_processing }))
        }
        "enqueue_batch" => {
            let p: EnqueuePayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid enqueue payload: {e}"))?;
            let items = enqueue_items(p.items, &state);
            serde_json::to_value(items).map_err(|e| e.to_string())
        }
        "skip_item" => {
            let p: UidPayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid skip payload: {e}"))?;
            let mut q = state.queue.lock().unwrap();
            if let Some(item) = q.iter_mut().find(|i| i.uid == p.uid) {
                if item.status == QueueStatus::Pending {
                    item.status = QueueStatus::Skipped;
                    item.progress = 100;
                    item.message = "Đã bỏ qua".to_string();
                } else if item.status == QueueStatus::Running {
                    state.skip_flags.lock().unwrap().insert(p.uid, true);
                }
            }
            serde_json::to_value(&*q).map_err(|e| e.to_string())
        }
        "cancel_item" => {
            let p: UidPayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid cancel payload: {e}"))?;
            let mut q = state.queue.lock().unwrap();
            if let Some(item) = q.iter_mut().find(|i| i.uid == p.uid) {
                if item.status == QueueStatus::Pending {
                    item.status = QueueStatus::Cancelled;
                    item.progress = 100;
                    item.message = "Đã hủy".to_string();
                } else if item.status == QueueStatus::Running {
                    state.cancel_flags.lock().unwrap().insert(p.uid, true);
                }
            }
            serde_json::to_value(&*q).map_err(|e| e.to_string())
        }
        "retry_failed" => {
            {
                let mut q = state.queue.lock().unwrap();
                for item in q.iter_mut() {
                    if item.status == QueueStatus::Failed
                        || item.status == QueueStatus::Cancelled
                        || item.status == QueueStatus::Skipped
                    {
                        item.status = QueueStatus::Pending;
                        item.progress = 0;
                        item.message = "Đang chờ thử lại...".to_string();
                    }
                }
            }
            ensure_worker_running(&state);
            let items = state.queue.lock().unwrap().clone();
            serde_json::to_value(items).map_err(|e| e.to_string())
        }
        "clear_completed" => {
            let mut q = state.queue.lock().unwrap();
            q.retain(|item| {
                item.status == QueueStatus::Pending || item.status == QueueStatus::Running
            });
            serde_json::to_value(&*q).map_err(|e| e.to_string())
        }
        _ => Err(format!("Unknown queue_command action: {action}")),
    }
}

#[tauri::command]
pub async fn settings_command(
    action: String,
    payload: Value,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    match action.as_str() {
        "get_settings" => {
            let settings = state.settings.lock().unwrap().clone();
            serde_json::to_value(settings).map_err(|e| e.to_string())
        }
        "patch_settings" => {
            let next: AppSettings = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid settings payload: {e}"))?;
            let ctx = resolve_storage_context();
            save_settings(&ctx, &next)?;
            *state.settings.lock().unwrap() = next.clone();
            serde_json::to_value(next).map_err(|e| e.to_string())
        }
        _ => Err(format!("Unknown settings_command action: {action}")),
    }
}

#[tauri::command]
pub async fn system_command(action: String, payload: Value) -> Result<Value, String> {
    match action.as_str() {
        "get_env_info" => {
            let ctx = resolve_storage_context();
            let (winget_available, winget_version) = match get_winget_version() {
                Ok(v) if !v.is_empty() => (true, v),
                Ok(_) => (true, "Installed".to_string()),
                Err(_) => (false, "Not detected".to_string()),
            };
            let info = EnvInfo {
                winget_available,
                winget_version,
                os_version: format!("Windows ({})", std::env::consts::ARCH),
                is_portable: ctx.is_portable,
                data_dir: ctx.data_dir.to_string_lossy().to_string(),
                exe_dir: ctx.exe_dir.to_string_lossy().to_string(),
            };
            serde_json::to_value(info).map_err(|e| e.to_string())
        }
        "open_ms_store" => {
            let p: StorePayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid store payload: {e}"))?;
            let clean_id: String = p
                .product_id
                .chars()
                .filter(|c| c.is_ascii_alphanumeric())
                .collect();
            if clean_id.is_empty() {
                return Err("ProductId không hợp lệ".to_string());
            }
            let uri = format!("ms-windows-store://pdp/?ProductId={clean_id}");
            Command::new("cmd")
                .args(["/C", "start", "", &uri])
                .spawn()
                .map_err(|e| format!("Không thể mở Microsoft Store: {e}"))?;
            Ok(json!({ "opened": uri }))
        }
        "open_data_dir" => {
            let ctx = resolve_storage_context();
            Command::new("explorer")
                .arg(&ctx.data_dir)
                .spawn()
                .map_err(|e| format!("Không thể mở thư mục dữ liệu: {e}"))?;
            Ok(json!({ "path": ctx.data_dir.to_string_lossy() }))
        }
        "open_external_url" => {
            let p: UrlPayload = serde_json::from_value(payload)
                .map_err(|e| format!("Invalid url payload: {e}"))?;
            let valid = p.url.starts_with("https://")
                || p.url.starts_with("http://")
                || p.url.starts_with("ms-windows-store://");
            if !valid {
                return Err("Chỉ cho phép mở URL http/https hoặc ms-windows-store://".to_string());
            }
            Command::new("cmd")
                .args(["/C", "start", "", &p.url])
                .spawn()
                .map_err(|e| format!("Không thể mở liên kết: {e}"))?;
            Ok(json!({ "opened": p.url }))
        }
        _ => Err(format!("Unknown system_command action: {action}")),
    }
}

#[tauri::command]
pub fn start_queue_stream(
    stream_id: String,
    on_event: Channel<QueueStreamEvent>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    register_stream(stream_id, on_event, &state)
}

#[tauri::command]
pub fn cancel_queue_stream(stream_id: String) -> Result<(), String> {
    cancel_stream(&stream_id);
    Ok(())
}
