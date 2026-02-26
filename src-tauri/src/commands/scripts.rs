use crate::db::queries;
use crate::db::Database;
use crate::models::{NewScript, Script, UpdateScript};
use tauri::State;

#[tauri::command]
pub fn add_script(db: State<'_, Database>, script: NewScript) -> Result<Script, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::insert_script(&conn, &script).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_scripts(db: State<'_, Database>, category_id: Option<i64>) -> Result<Vec<Script>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    match category_id {
        Some(cid) => queries::get_scripts_by_category(&conn, cid).map_err(|e| e.to_string()),
        None => queries::get_all_scripts(&conn).map_err(|e| e.to_string()),
    }
}

#[tauri::command]
pub fn update_script(db: State<'_, Database>, id: i64, update: UpdateScript) -> Result<Script, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::update_script(&conn, id, &update).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_script(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::delete_script(&conn, id).map_err(|e| e.to_string())
}
