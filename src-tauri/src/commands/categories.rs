use crate::db::queries;
use crate::db::Database;
use crate::models::Category;
use tauri::State;

#[tauri::command]
pub fn get_categories(db: State<'_, Database>) -> Result<Vec<Category>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_all_categories(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_category(db: State<'_, Database>, name: String, color: String) -> Result<Category, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::insert_category(&conn, &name, &color).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_category(db: State<'_, Database>, id: i64, name: String, color: String) -> Result<Category, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::update_category(&conn, id, &name, &color).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_category(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::delete_category(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_categories(db: State<'_, Database>, ids: Vec<i64>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::reorder_categories(&conn, &ids).map_err(|e| e.to_string())
}
