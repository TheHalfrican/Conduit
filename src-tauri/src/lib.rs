mod commands;
mod db;
mod models;

use commands::runner::RunnerState;
use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let database = Database::new().expect("Failed to initialize database");
    let runner_state = RunnerState::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(database)
        .manage(runner_state)
        .invoke_handler(tauri::generate_handler![
            commands::scripts::add_script,
            commands::scripts::get_scripts,
            commands::scripts::update_script,
            commands::scripts::delete_script,
            commands::categories::get_categories,
            commands::categories::add_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::categories::reorder_categories,
            commands::runner::run_script,
            commands::runner::cancel_script,
            commands::runner::is_script_running,
            commands::runner::write_script_input,
            commands::runner::resize_script_pty,
            commands::history::get_run_history,
            commands::history::get_latest_run,
            commands::history::clear_history,
            commands::scheduler::create_schedule,
            commands::scheduler::update_schedule,
            commands::scheduler::delete_schedule,
            commands::scheduler::toggle_schedule,
            commands::scheduler::get_schedules,
            commands::scheduler::sync_schedules,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::open_in_editor,
        ])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
