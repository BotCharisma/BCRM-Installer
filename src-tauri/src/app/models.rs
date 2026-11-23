use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PackageItem {
    pub id: String,
    pub name: String,
    pub version: String,
    pub available_version: Option<String>,
    pub source: String,
    pub is_installed: bool,
    pub has_update: bool,
    pub category: Option<String>,
    pub summary: Option<String>,
    pub publisher: Option<String>,
    pub tags: Vec<String>,
    pub store_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageDetails {
    pub id: String,
    pub name: String,
    pub version: String,
    pub publisher: Option<String>,
    pub publisher_url: Option<String>,
    pub homepage: Option<String>,
    pub license: Option<String>,
    pub description: Option<String>,
    pub installer_type: Option<String>,
    pub installer_url: Option<String>,
    pub source: String,
    pub store_url: Option<String>,
    pub raw_output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogItem {
    pub id: String,
    pub name: String,
    pub source: String,
    pub category: String,
    pub summary: String,
    pub publisher: String,
    pub tags: Vec<String>,
    pub popular: bool,
    pub is_installed: bool,
    pub has_update: bool,
    pub installed_version: Option<String>,
    pub available_version: Option<String>,
    pub store_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledRecord {
    pub id: String,
    pub name: String,
    pub version: String,
    pub available_version: Option<String>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum QueueOperation {
    Install,
    Upgrade,
    Uninstall,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum QueueStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueItem {
    pub uid: String,
    pub id: String,
    pub name: String,
    pub source: String,
    pub operation: QueueOperation,
    pub status: QueueStatus,
    pub progress: u8,
    pub message: String,
    pub store_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnqueueItemInput {
    pub id: String,
    pub name: String,
    pub source: String,
    pub operation: QueueOperation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "kind")]
pub enum QueueStreamEvent {
    Snapshot {
        items: Vec<QueueItem>,
        is_processing: bool,
    },
    ItemUpdated {
        item: QueueItem,
    },
    Log {
        uid: Option<String>,
        line: String,
        level: String,
        timestamp: String,
    },
    WorkerState {
        is_processing: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub silent_mode: bool,
    pub accept_agreements: bool,
    pub scope: String,
    pub run_as_admin: bool,
    pub custom_install_dir: String,
    pub default_source: String,
    pub auto_open_queue_on_install: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            silent_mode: true,
            accept_agreements: true,
            scope: "default".to_string(),
            run_as_admin: false,
            custom_install_dir: String::new(),
            default_source: "all".to_string(),
            auto_open_queue_on_install: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvInfo {
    pub winget_available: bool,
    pub winget_version: String,
    pub os_version: String,
    pub is_portable: bool,
    pub data_dir: String,
    pub exe_dir: String,
}

pub struct AppState {
    pub settings: Mutex<AppSettings>,
    pub installed_cache: Mutex<HashMap<String, InstalledRecord>>,
    pub queue: Arc<Mutex<Vec<QueueItem>>>,
    pub is_processing: Arc<Mutex<bool>>,
    pub skip_flags: Arc<Mutex<HashMap<String, bool>>>,
    pub cancel_flags: Arc<Mutex<HashMap<String, bool>>>,
}

impl AppState {
    pub fn new(initial_settings: AppSettings) -> Self {
        Self {
            settings: Mutex::new(initial_settings),
            installed_cache: Mutex::new(HashMap::new()),
            queue: Arc::new(Mutex::new(Vec::new())),
            is_processing: Arc::new(Mutex::new(false)),
            skip_flags: Arc::new(Mutex::new(HashMap::new())),
            cancel_flags: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
