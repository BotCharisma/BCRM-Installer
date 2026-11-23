use crate::app::command_registry::register_commands;
use crate::app::models::AppState;
use crate::app::portable_config::{load_settings, resolve_storage_context};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ctx = resolve_storage_context();
    let initial_settings = load_settings(&ctx);
    let state = AppState::new(initial_settings);

    let builder = tauri::Builder::default().manage(state);
    let builder = register_commands(builder);

    builder
        .run(tauri::generate_context!())
        .expect("error while running BCRM Winget application");
}
