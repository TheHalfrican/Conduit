use crate::db::queries;
use crate::db::Database;
use crate::models::RunRecord;
use tauri::State;

#[tauri::command]
pub fn get_run_history(db: State<'_, Database>, script_id: i64, limit: Option<i64>) -> Result<Vec<RunRecord>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_run_history(&conn, script_id, limit.unwrap_or(50)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_latest_run(db: State<'_, Database>, script_id: i64) -> Result<Option<RunRecord>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_latest_run(&conn, script_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_history(db: State<'_, Database>, script_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::clear_run_history(&conn, script_id).map_err(|e| e.to_string())
}
