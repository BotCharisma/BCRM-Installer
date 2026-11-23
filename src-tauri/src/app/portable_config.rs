use crate::app::models::AppSettings;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct StorageContext {
    pub is_portable: bool,
    pub exe_dir: PathBuf,
    pub data_dir: PathBuf,
}

pub fn resolve_storage_context() -> StorageContext {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    resolve_storage_from_exe_dir(exe_dir)
}

pub fn resolve_storage_from_exe_dir(exe_dir: PathBuf) -> StorageContext {
    let marker = exe_dir.join("portable.mode");
    let portable_data = exe_dir.join("data");
    let is_portable = marker.exists() || portable_data.is_dir();

    let data_dir = if is_portable {
        portable_data
    } else {
        std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|| exe_dir.clone())
            .join("BCRMWinget")
    };

    let _ = fs::create_dir_all(&data_dir);

    StorageContext {
        is_portable,
        exe_dir,
        data_dir,
    }
}

pub fn load_settings(ctx: &StorageContext) -> AppSettings {
    let path = ctx.data_dir.join("settings.json");
    match fs::read_to_string(&path) {
        Ok(raw) => serde_json::from_str::<AppSettings>(&raw).unwrap_or_default(),
        Err(_) => AppSettings::default(),
    }
}

pub fn save_settings(ctx: &StorageContext, settings: &AppSettings) -> Result<(), String> {
    fs::create_dir_all(&ctx.data_dir)
        .map_err(|e| format!("Không thể tạo thư mục dữ liệu {}: {e}", ctx.data_dir.display()))?;
    let path = ctx.data_dir.join("settings.json");
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Lỗi serialize settings: {e}"))?;
    fs::write(&path, json)
        .map_err(|e| format!("Không thể ghi file {}: {e}", path.display()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn resolves_portable_when_marker_exists() {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!("bcrm_portable_test_{nanos}"));
        fs::create_dir_all(&temp_dir).unwrap();
        fs::write(temp_dir.join("portable.mode"), "portable=1\n").unwrap();

        let ctx = resolve_storage_from_exe_dir(temp_dir.clone());
        assert!(ctx.is_portable);
        assert_eq!(ctx.data_dir, temp_dir.join("data"));
        assert!(ctx.data_dir.exists());

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
