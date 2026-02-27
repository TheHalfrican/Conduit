use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Script {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub category_id: i64,
    pub color: String,
    pub is_executable: bool,
    pub run_as_admin: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RunRecord {
    pub id: i64,
    pub script_id: i64,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub exit_code: Option<i32>,
    pub output: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: i64,
    pub script_id: i64,
    pub schedule_type: String,
    pub time: Option<String>,
    pub weekday: Option<i32>,
    pub interval_seconds: Option<i64>,
    pub enabled: bool,
    pub plist_label: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewScript {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub category_id: i64,
    pub color: String,
    pub run_as_admin: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateScript {
    pub name: Option<String>,
    pub path: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<i64>,
    pub color: Option<String>,
    pub run_as_admin: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewSchedule {
    pub script_id: i64,
    pub schedule_type: String,
    pub time: Option<String>,
    pub weekday: Option<i32>,
    pub interval_seconds: Option<i64>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub id: i64,
    pub editor_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettings {
    pub editor_path: Option<String>,
}
