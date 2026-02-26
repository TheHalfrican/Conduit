use crate::db::queries;
use crate::db::Database;
use crate::models::{NewSchedule, Schedule};
use plist::Value;
use std::collections::BTreeMap;
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

fn get_launch_agents_dir() -> PathBuf {
    let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("Library");
    path.push("LaunchAgents");
    path
}

fn get_logs_dir() -> PathBuf {
    let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push(".conduit");
    path.push("logs");
    std::fs::create_dir_all(&path).ok();
    path
}

fn get_plist_path(label: &str) -> PathBuf {
    let mut path = get_launch_agents_dir();
    path.push(format!("{}.plist", label));
    path
}

fn generate_plist_label(script_id: i64) -> String {
    let short_uuid = &Uuid::new_v4().to_string()[..8];
    format!("com.conduit.script.{}.{}", script_id, short_uuid)
}

fn build_plist(label: &str, script_path: &str, schedule: &NewSchedule) -> Value {
    let logs_dir = get_logs_dir();
    let stdout_log = logs_dir.join(format!("{}.stdout.log", label));
    let stderr_log = logs_dir.join(format!("{}.stderr.log", label));

    let mut dict = BTreeMap::new();
    dict.insert("Label".to_string(), Value::String(label.to_string()));

    // ProgramArguments
    let args = Value::Array(vec![
        Value::String("/bin/bash".to_string()),
        Value::String(script_path.to_string()),
    ]);
    dict.insert("ProgramArguments".to_string(), args);

    // Environment variables for PATH
    let mut env_dict = BTreeMap::new();
    env_dict.insert(
        "PATH".to_string(),
        Value::String("/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin".to_string()),
    );
    dict.insert(
        "EnvironmentVariables".to_string(),
        Value::Dictionary(env_dict.into_iter().collect()),
    );

    // Log files
    dict.insert(
        "StandardOutPath".to_string(),
        Value::String(stdout_log.to_string_lossy().to_string()),
    );
    dict.insert(
        "StandardErrorPath".to_string(),
        Value::String(stderr_log.to_string_lossy().to_string()),
    );

    // Schedule type
    match schedule.schedule_type.as_str() {
        "daily" => {
            if let Some(ref time_str) = schedule.time {
                let parts: Vec<&str> = time_str.split(':').collect();
                if parts.len() == 2 {
                    let hour: i64 = parts[0].parse().unwrap_or(0);
                    let minute: i64 = parts[1].parse().unwrap_or(0);
                    let mut cal = BTreeMap::new();
                    cal.insert("Hour".to_string(), Value::Integer(hour.into()));
                    cal.insert("Minute".to_string(), Value::Integer(minute.into()));
                    dict.insert(
                        "StartCalendarInterval".to_string(),
                        Value::Dictionary(cal.into_iter().collect()),
                    );
                }
            }
        }
        "weekly" => {
            if let (Some(ref time_str), Some(weekday)) = (&schedule.time, schedule.weekday) {
                let parts: Vec<&str> = time_str.split(':').collect();
                if parts.len() == 2 {
                    let hour: i64 = parts[0].parse().unwrap_or(0);
                    let minute: i64 = parts[1].parse().unwrap_or(0);
                    let mut cal = BTreeMap::new();
                    cal.insert("Weekday".to_string(), Value::Integer((weekday as i64).into()));
                    cal.insert("Hour".to_string(), Value::Integer(hour.into()));
                    cal.insert("Minute".to_string(), Value::Integer(minute.into()));
                    dict.insert(
                        "StartCalendarInterval".to_string(),
                        Value::Dictionary(cal.into_iter().collect()),
                    );
                }
            }
        }
        "interval" => {
            if let Some(seconds) = schedule.interval_seconds {
                dict.insert(
                    "StartInterval".to_string(),
                    Value::Integer(seconds.into()),
                );
            }
        }
        _ => {}
    }

    Value::Dictionary(dict.into_iter().collect())
}

fn write_and_load_plist(label: &str, plist_value: &Value) -> Result<(), String> {
    let plist_path = get_plist_path(label);

    // Ensure LaunchAgents dir exists
    if let Some(parent) = plist_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Write plist file
    let file = std::fs::File::create(&plist_path).map_err(|e| e.to_string())?;
    plist_value.to_writer_xml(file).map_err(|e| e.to_string())?;

    // Load with launchctl
    std::process::Command::new("launchctl")
        .args(["load", &plist_path.to_string_lossy()])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn unload_plist(label: &str) -> Result<(), String> {
    let plist_path = get_plist_path(label);
    if plist_path.exists() {
        std::process::Command::new("launchctl")
            .args(["unload", &plist_path.to_string_lossy()])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn remove_plist_file(label: &str) -> Result<(), String> {
    let plist_path = get_plist_path(label);
    if plist_path.exists() {
        std::fs::remove_file(&plist_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn create_schedule(
    db: State<'_, Database>,
    script_id: i64,
    schedule_type: String,
    time: Option<String>,
    weekday: Option<i32>,
    interval_seconds: Option<i64>,
) -> Result<Schedule, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get script path for plist
    let script = queries::get_script_by_id(&conn, script_id).map_err(|e| e.to_string())?;

    let new_schedule = NewSchedule {
        script_id,
        schedule_type,
        time,
        weekday,
        interval_seconds,
    };

    let plist_label = generate_plist_label(script_id);

    // Build and write plist
    let plist_value = build_plist(&plist_label, &script.path, &new_schedule);
    write_and_load_plist(&plist_label, &plist_value)?;

    // Insert into DB
    let schedule = queries::insert_schedule(&conn, &new_schedule, &plist_label).map_err(|e| e.to_string())?;

    Ok(schedule)
}

#[tauri::command]
pub fn update_schedule(db: State<'_, Database>, schedule_id: i64, enabled: bool) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedule = queries::get_schedule_by_id(&conn, schedule_id).map_err(|e| e.to_string())?;

    if enabled {
        // Re-create and load plist
        let script = queries::get_script_by_id(&conn, schedule.script_id).map_err(|e| e.to_string())?;
        let new_schedule = NewSchedule {
            script_id: schedule.script_id,
            schedule_type: schedule.schedule_type,
            time: schedule.time,
            weekday: schedule.weekday,
            interval_seconds: schedule.interval_seconds,
        };
        let plist_value = build_plist(&schedule.plist_label, &script.path, &new_schedule);
        write_and_load_plist(&schedule.plist_label, &plist_value)?;
    } else {
        unload_plist(&schedule.plist_label)?;
    }

    queries::update_schedule_enabled(&conn, schedule_id, enabled).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_schedule(db: State<'_, Database>, schedule_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedule = queries::get_schedule_by_id(&conn, schedule_id).map_err(|e| e.to_string())?;

    // Unload and remove plist file
    unload_plist(&schedule.plist_label)?;
    remove_plist_file(&schedule.plist_label)?;

    // Remove from DB
    queries::delete_schedule(&conn, schedule_id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_schedule(db: State<'_, Database>, schedule_id: i64) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedule = queries::get_schedule_by_id(&conn, schedule_id).map_err(|e| e.to_string())?;
    let new_enabled = !schedule.enabled;

    if new_enabled {
        let script = queries::get_script_by_id(&conn, schedule.script_id).map_err(|e| e.to_string())?;
        let new_schedule = NewSchedule {
            script_id: schedule.script_id,
            schedule_type: schedule.schedule_type,
            time: schedule.time,
            weekday: schedule.weekday,
            interval_seconds: schedule.interval_seconds,
        };
        let plist_value = build_plist(&schedule.plist_label, &script.path, &new_schedule);
        write_and_load_plist(&schedule.plist_label, &plist_value)?;
    } else {
        unload_plist(&schedule.plist_label)?;
    }

    queries::update_schedule_enabled(&conn, schedule_id, new_enabled).map_err(|e| e.to_string())?;
    Ok(new_enabled)
}

#[tauri::command]
pub fn get_schedules(db: State<'_, Database>, script_id: i64) -> Result<Vec<Schedule>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_schedules_for_script(&conn, script_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn sync_schedules(db: State<'_, Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedules = queries::get_all_schedules(&conn).map_err(|e| e.to_string())?;

    for schedule in schedules {
        let plist_path = get_plist_path(&schedule.plist_label);

        if schedule.enabled {
            // If enabled but plist doesn't exist, recreate it
            if !plist_path.exists() {
                if let Ok(script) = queries::get_script_by_id(&conn, schedule.script_id) {
                    let new_schedule = NewSchedule {
                        script_id: schedule.script_id,
                        schedule_type: schedule.schedule_type,
                        time: schedule.time,
                        weekday: schedule.weekday,
                        interval_seconds: schedule.interval_seconds,
                    };
                    let plist_value = build_plist(&schedule.plist_label, &script.path, &new_schedule);
                    let _ = write_and_load_plist(&schedule.plist_label, &plist_value);
                }
            }
        } else {
            // If disabled but plist exists, unload it
            if plist_path.exists() {
                let _ = unload_plist(&schedule.plist_label);
            }
        }
    }

    Ok(())
}
