use crate::db::queries;
use crate::db::Database;
use crate::models::{Settings, UpdateSettings};
use tauri::State;

#[tauri::command]
pub fn get_settings(db: State<'_, Database>) -> Result<Settings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_settings(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_settings(db: State<'_, Database>, update: UpdateSettings) -> Result<Settings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::upsert_settings(&conn, &update).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_in_editor(db: State<'_, Database>, script_path: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = queries::get_settings(&conn).map_err(|e| e.to_string())?;

    if settings.editor_path.is_empty() {
        return Err("No editor configured. Set an editor path in Settings.".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        if settings.editor_path.ends_with(".app") {
            std::process::Command::new("open")
                .args(["-a", &settings.editor_path, &script_path])
                .spawn()
                .map_err(|e| format!("Failed to open editor: {}", e))?;
        } else {
            std::process::Command::new(&settings.editor_path)
                .arg(&script_path)
                .spawn()
                .map_err(|e| format!("Failed to open editor: {}", e))?;
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        std::process::Command::new(&settings.editor_path)
            .arg(&script_path)
            .spawn()
            .map_err(|e| format!("Failed to open editor: {}", e))?;
    }

    Ok(())
}
