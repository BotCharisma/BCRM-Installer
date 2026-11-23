use crate::app::models::{
    AppSettings, AppState, EnqueueItemInput, QueueItem, QueueOperation, QueueStatus,
    QueueStreamEvent,
};
use crate::app::winget_service::create_winget_command;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::ipc::Channel;
use tauri::State;

static STREAM_CANCELS: LazyLock<Mutex<HashMap<String, Arc<AtomicBool>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

static ACTIVE_CHANNELS: LazyLock<Mutex<Vec<(String, Channel<QueueStreamEvent>)>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

fn now_hms() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    format!("{h:02}:{m:02}:{s:02}")
}

fn broadcast_event(event: QueueStreamEvent) {
    let mut channels = ACTIVE_CHANNELS.lock().unwrap();
    let cancels = STREAM_CANCELS.lock().unwrap();

    channels.retain(|(stream_id, ch)| {
        let is_cancelled = cancels
            .get(stream_id)
            .map(|flag| flag.load(Ordering::Relaxed))
            .unwrap_or(false);
        if is_cancelled {
            return false;
        }
        ch.send(event.clone()).is_ok()
    });
}

fn broadcast_log(uid: Option<String>, line: String, level: &str) {
    broadcast_event(QueueStreamEvent::Log {
        uid,
        line,
        level: level.to_string(),
        timestamp: now_hms(),
    });
}

pub fn register_stream(
    stream_id: String,
    channel: Channel<QueueStreamEvent>,
    state: &State<'_, AppState>,
) -> Result<(), String> {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    STREAM_CANCELS
        .lock()
        .unwrap()
        .insert(stream_id.clone(), cancel_flag);

    let snapshot = QueueStreamEvent::Snapshot {
        items: state.queue.lock().unwrap().clone(),
        is_processing: *state.is_processing.lock().unwrap(),
    };
    let _ = channel.send(snapshot);

    ACTIVE_CHANNELS.lock().unwrap().push((stream_id, channel));
    Ok(())
}

pub fn cancel_stream(stream_id: &str) {
    if let Some(flag) = STREAM_CANCELS.lock().unwrap().remove(stream_id) {
        flag.store(true, Ordering::Relaxed);
    }
    ACTIVE_CHANNELS
        .lock()
        .unwrap()
        .retain(|(id, _)| id != stream_id);
}

pub fn enqueue_items(inputs: Vec<EnqueueItemInput>, state: &State<'_, AppState>) -> Vec<QueueItem> {
    let mut added = Vec::new();
    {
        let mut queue = state.queue.lock().unwrap();
        let base_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        for (idx, input) in inputs.into_iter().enumerate() {
            let duplicate_active = queue.iter().any(|q| {
                q.id == input.id
                    && q.operation == input.operation
                    && (q.status == QueueStatus::Pending || q.status == QueueStatus::Running)
            });
            if duplicate_active {
                continue;
            }
            let uid = format!("{base_ms}-{idx}-{}", input.id);
            let store_url = if input.source == "msstore" {
                Some(format!("ms-windows-store://pdp/?ProductId={}", input.id))
            } else {
                None
            };
            let item = QueueItem {
                uid,
                id: input.id,
                name: input.name,
                source: input.source,
                operation: input.operation,
                status: QueueStatus::Pending,
                progress: 0,
                message: "Đang chờ trong hàng đợi...".to_string(),
                store_url,
            };
            queue.push(item.clone());
            added.push(item);
        }
    }

    for item in &added {
        broadcast_event(QueueStreamEvent::ItemUpdated { item: item.clone() });
        broadcast_log(
            Some(item.uid.clone()),
            format!("+ Đã thêm vào hàng đợi: {} ({})", item.name, item.id),
            "muted",
        );
    }

    ensure_worker_running(state);
    state.queue.lock().unwrap().clone()
}

pub fn ensure_worker_running(state: &State<'_, AppState>) {
    {
        let mut running = state.is_processing.lock().unwrap();
        if *running {
            return;
        }
        *running = true;
    }

    broadcast_event(QueueStreamEvent::WorkerState {
        is_processing: true,
    });

    let queue_arc = Arc::clone(&state.queue);
    let processing_arc = Arc::clone(&state.is_processing);
    let skip_arc = Arc::clone(&state.skip_flags);
    let cancel_arc = Arc::clone(&state.cancel_flags);
    let settings_snapshot = state.settings.lock().unwrap().clone();

    std::thread::spawn(move || {
        loop {
            let next_item = {
                let mut q = queue_arc.lock().unwrap();
                let mut found: Option<QueueItem> = None;
                for item in q.iter_mut() {
                    if item.status == QueueStatus::Pending {
                        item.status = QueueStatus::Running;
                        item.progress = 12;
                        item.message = "Đang khởi chạy winget...".to_string();
                        found = Some(item.clone());
                        break;
                    }
                }
                found
            };

            let Some(mut current) = next_item else {
                break;
            };

            broadcast_event(QueueStreamEvent::ItemUpdated {
                item: current.clone(),
            });

            let result = execute_single_item(
                &mut current,
                &settings_snapshot,
                &queue_arc,
                &skip_arc,
                &cancel_arc,
            );

            {
                let mut q = queue_arc.lock().unwrap();
                if let Some(slot) = q.iter_mut().find(|i| i.uid == current.uid) {
                    *slot = result.clone();
                }
            }
            broadcast_event(QueueStreamEvent::ItemUpdated { item: result });
        }

        *processing_arc.lock().unwrap() = false;
        broadcast_event(QueueStreamEvent::WorkerState {
            is_processing: false,
        });
    });
}

fn build_winget_args(item: &QueueItem, settings: &AppSettings) -> Vec<String> {
    let subcmd = match item.operation {
        QueueOperation::Install => "install",
        QueueOperation::Upgrade => "upgrade",
        QueueOperation::Uninstall => "uninstall",
    };

    let mut args = vec![
        subcmd.to_string(),
        "--id".to_string(),
        item.id.clone(),
        "--exact".to_string(),
    ];

    if item.operation != QueueOperation::Uninstall && (item.source == "winget" || item.source == "msstore") {
        args.push("--source".to_string());
        args.push(item.source.clone());
    }

    if settings.silent_mode {
        args.push("--silent".to_string());
    } else {
        args.push("--interactive".to_string());
    }

    if settings.accept_agreements && item.operation != QueueOperation::Uninstall {
        args.push("--accept-package-agreements".to_string());
        args.push("--accept-source-agreements".to_string());
    }

    if item.operation == QueueOperation::Install {
        if settings.scope == "user" || settings.scope == "machine" {
            args.push("--scope".to_string());
            args.push(settings.scope.clone());
        }
        let dir = settings.custom_install_dir.trim();
        if !dir.is_empty() {
            args.push("--location".to_string());
            args.push(dir.to_string());
        }
    }

    args
}

fn execute_single_item(
    item: &mut QueueItem,
    settings: &AppSettings,
    queue_arc: &Arc<Mutex<Vec<QueueItem>>>,
    skip_arc: &Arc<Mutex<HashMap<String, bool>>>,
    cancel_arc: &Arc<Mutex<HashMap<String, bool>>>,
) -> QueueItem {
    let args = build_winget_args(item, settings);
    broadcast_log(
        Some(item.uid.clone()),
        format!("$ winget {}", args.join(" ")),
        "muted",
    );

    if settings.run_as_admin {
        let escaped_args = args
            .iter()
            .map(|a| format!("'{}'", a.replace('\'', "''")))
            .collect::<Vec<_>>()
            .join(", ");
        let ps_script = format!(
            "$p = Start-Process -FilePath 'winget.exe' -ArgumentList @({escaped_args}) -Verb RunAs -PassThru -Wait; exit $p.ExitCode"
        );
        broadcast_log(
            Some(item.uid.clone()),
            "Đang yêu cầu quyền Administrator (UAC) để thực thi...".to_string(),
            "info",
        );
        let mut cmd = std::process::Command::new("powershell");
        cmd.args(["-NoProfile", "-Command", &ps_script]);
        match cmd.status() {
            Ok(status) if status.success() => {
                item.status = QueueStatus::Completed;
                item.progress = 100;
                item.message = "Hoàn tất (quyền Admin)".to_string();
                broadcast_log(
                    Some(item.uid.clone()),
                    format!("✓ Hoàn tất: {}", item.name),
                    "success",
                );
            }
            Ok(status) => {
                item.status = QueueStatus::Failed;
                item.progress = 100;
                item.message = format!("Thất bại với mã lỗi {:?}", status.code());
                broadcast_log(
                    Some(item.uid.clone()),
                    format!("✕ Lỗi khi xử lý {}: mã {:?}", item.name, status.code()),
                    "error",
                );
            }
            Err(e) => {
                item.status = QueueStatus::Failed;
                item.progress = 100;
                item.message = format!("Không thể khởi chạy UAC: {e}");
                broadcast_log(Some(item.uid.clone()), format!("✕ {e}"), "error");
            }
        }
        return item.clone();
    }

    let mut cmd = create_winget_command(&args);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            item.status = QueueStatus::Failed;
            item.progress = 100;
            item.message = format!("Không thể chạy winget: {e}");
            broadcast_log(Some(item.uid.clone()), format!("✕ {e}"), "error");
            return item.clone();
        }
    };

    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line_res in reader.lines() {
            let should_skip = skip_arc.lock().unwrap().remove(&item.uid).unwrap_or(false);
            let should_cancel = cancel_arc.lock().unwrap().remove(&item.uid).unwrap_or(false);

            if should_skip || should_cancel {
                let _ = child.kill();
                item.status = if should_skip {
                    QueueStatus::Skipped
                } else {
                    QueueStatus::Cancelled
                };
                item.progress = 100;
                item.message = if should_skip {
                    "Đã bỏ qua theo yêu cầu".to_string()
                } else {
                    "Đã hủy cài đặt".to_string()
                };
                broadcast_log(
                    Some(item.uid.clone()),
                    format!("! {}: {}", item.message, item.name),
                    "muted",
                );
                return item.clone();
            }

            if let Ok(raw) = line_res {
                let cleaned = raw
                    .split('\r')
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty() && *s != "-" && *s != "\\" && *s != "|" && *s != "/")
                    .last()
                    .unwrap_or("")
                    .to_string();

                if !cleaned.is_empty() {
                    if cleaned.contains("Downloading") {
                        item.progress = 40;
                        item.message = "Đang tải bộ cài đặt...".to_string();
                    } else if cleaned.contains("Starting package install") || cleaned.contains("Installing") {
                        item.progress = 72;
                        item.message = "Đang tiến hành cài đặt...".to_string();
                    } else if cleaned.contains("Successfully installed") || cleaned.contains("Successfully uninstalled") {
                        item.progress = 98;
                    }

                    {
                        let mut q = queue_arc.lock().unwrap();
                        if let Some(slot) = q.iter_mut().find(|i| i.uid == item.uid) {
                            slot.progress = item.progress;
                            slot.message = item.message.clone();
                        }
                    }

                    broadcast_event(QueueStreamEvent::ItemUpdated { item: item.clone() });
                    broadcast_log(Some(item.uid.clone()), cleaned, "info");
                }
            }
        }
    }

    let status = child.wait();
    match status {
        Ok(s) if s.success() => {
            item.status = QueueStatus::Completed;
            item.progress = 100;
            item.message = match item.operation {
                QueueOperation::Install => "Cài đặt thành công".to_string(),
                QueueOperation::Upgrade => "Cập nhật thành công".to_string(),
                QueueOperation::Uninstall => "Đã gỡ cài đặt".to_string(),
            };
            broadcast_log(
                Some(item.uid.clone()),
                format!("✓ {}: {}", item.message, item.name),
                "success",
            );
        }
        Ok(s) => {
            item.status = QueueStatus::Failed;
            item.progress = 100;
            item.message = format!("Thất bại (mã lỗi {:?})", s.code());
            broadcast_log(
                Some(item.uid.clone()),
                format!("✕ Thất bại {}: mã lỗi {:?}", item.name, s.code()),
                "error",
            );
        }
        Err(e) => {
            item.status = QueueStatus::Failed;
            item.progress = 100;
            item.message = format!("Lỗi tiến trình: {e}");
            broadcast_log(Some(item.uid.clone()), format!("✕ {e}"), "error");
        }
    }

    item.clone()
}
