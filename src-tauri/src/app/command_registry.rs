use crate::app::command_routers;
use tauri::Builder;

pub fn register_commands(builder: Builder<tauri::Wry>) -> Builder<tauri::Wry> {
    builder.invoke_handler(tauri::generate_handler![
        command_routers::package_command,
        command_routers::queue_command,
        command_routers::settings_command,
        command_routers::system_command,
        command_routers::start_queue_stream,
        command_routers::cancel_queue_stream,
    ])
}
