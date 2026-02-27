use crate::db::queries;
use crate::db::Database;
use crate::models::{NewSchedule, Schedule};
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

fn generate_task_label(script_id: i64) -> String {
    let short_uuid = &Uuid::new_v4().to_string()[..8];
    format!("com.conduit.script.{}.{}", script_id, short_uuid)
}

fn get_logs_dir() -> PathBuf {
    let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push(".conduit");
    path.push("logs");
    std::fs::create_dir_all(&path).ok();
    path
}

// ──────────────────────────────────────────────
// macOS: launchd plist helpers
// ──────────────────────────────────────────────

#[cfg(target_os = "macos")]
mod platform {
    use super::*;
    use plist::Value;
    use std::collections::BTreeMap;

    fn get_launch_agents_dir() -> PathBuf {
        let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("Library");
        path.push("LaunchAgents");
        path
    }

    fn get_plist_path(label: &str) -> PathBuf {
        let mut path = get_launch_agents_dir();
        path.push(format!("{}.plist", label));
        path
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

    pub fn create_scheduled_task(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        let plist_value = build_plist(label, script_path, schedule);
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

    pub fn delete_scheduled_task(label: &str) -> Result<(), String> {
        let plist_path = get_plist_path(label);
        if plist_path.exists() {
            std::process::Command::new("launchctl")
                .args(["unload", &plist_path.to_string_lossy()])
                .output()
                .map_err(|e| e.to_string())?;
            std::fs::remove_file(&plist_path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn enable_scheduled_task(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        create_scheduled_task(label, script_path, schedule)
    }

    pub fn disable_scheduled_task(label: &str) -> Result<(), String> {
        let plist_path = get_plist_path(label);
        if plist_path.exists() {
            std::process::Command::new("launchctl")
                .args(["unload", &plist_path.to_string_lossy()])
                .output()
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn task_exists(label: &str) -> bool {
        get_plist_path(label).exists()
    }
}

// ──────────────────────────────────────────────
// Linux: systemd user timers
// ──────────────────────────────────────────────

#[cfg(target_os = "linux")]
mod platform {
    use super::*;

    fn get_systemd_user_dir() -> PathBuf {
        let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push(".config");
        path.push("systemd");
        path.push("user");
        path
    }

    /// Convert label like `com.conduit.script.42.a1b2c3d4` to unit name `conduit-script-42-a1b2c3d4`
    fn label_to_unit_name(label: &str) -> String {
        label
            .strip_prefix("com.")
            .unwrap_or(label)
            .replace('.', "-")
    }

    fn get_service_path(label: &str) -> PathBuf {
        let unit = label_to_unit_name(label);
        get_systemd_user_dir().join(format!("{}.service", unit))
    }

    fn get_timer_path(label: &str) -> PathBuf {
        let unit = label_to_unit_name(label);
        get_systemd_user_dir().join(format!("{}.timer", unit))
    }

    fn build_service_content(label: &str, script_path: &str) -> String {
        let logs_dir = get_logs_dir();
        let unit = label_to_unit_name(label);
        format!(
            "[Unit]\n\
             Description=Conduit scheduled script: {unit}\n\
             \n\
             [Service]\n\
             Type=oneshot\n\
             ExecStart=/bin/bash {script_path}\n\
             Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin\n\
             StandardOutput=append:{stdout}\n\
             StandardError=append:{stderr}\n",
            unit = unit,
            script_path = script_path,
            stdout = logs_dir.join(format!("{}.stdout.log", unit)).to_string_lossy(),
            stderr = logs_dir.join(format!("{}.stderr.log", unit)).to_string_lossy(),
        )
    }

    fn build_timer_content(label: &str, schedule: &NewSchedule) -> String {
        let unit = label_to_unit_name(label);
        let mut timer = format!(
            "[Unit]\n\
             Description=Timer for Conduit scheduled script: {unit}\n\
             \n\
             [Timer]\n",
            unit = unit,
        );

        match schedule.schedule_type.as_str() {
            "daily" => {
                if let Some(ref time_str) = schedule.time {
                    timer.push_str(&format!("OnCalendar=*-*-* {}:00\n", time_str));
                    timer.push_str("Persistent=true\n");
                }
            }
            "weekly" => {
                if let (Some(ref time_str), Some(weekday)) = (&schedule.time, schedule.weekday) {
                    let day = match weekday {
                        0 => "Sun",
                        1 => "Mon",
                        2 => "Tue",
                        3 => "Wed",
                        4 => "Thu",
                        5 => "Fri",
                        6 => "Sat",
                        _ => "Mon",
                    };
                    timer.push_str(&format!("OnCalendar={} *-*-* {}:00\n", day, time_str));
                    timer.push_str("Persistent=true\n");
                }
            }
            "interval" => {
                if let Some(seconds) = schedule.interval_seconds {
                    timer.push_str("OnBootSec=60\n");
                    timer.push_str(&format!("OnUnitActiveSec={}s\n", seconds));
                    timer.push_str("AccuracySec=1\n");
                }
            }
            _ => {}
        }

        timer.push_str("\n[Install]\nWantedBy=timers.target\n");
        timer
    }

    fn systemctl(args: &[&str]) -> Result<(), String> {
        let output = std::process::Command::new("systemctl")
            .arg("--user")
            .args(args)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if !stderr.trim().is_empty() {
                return Err(stderr.to_string());
            }
        }
        Ok(())
    }

    fn write_unit_files(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        let systemd_dir = get_systemd_user_dir();
        std::fs::create_dir_all(&systemd_dir).map_err(|e| e.to_string())?;

        let service_content = build_service_content(label, script_path);
        let timer_content = build_timer_content(label, schedule);

        std::fs::write(get_service_path(label), service_content).map_err(|e| e.to_string())?;
        std::fs::write(get_timer_path(label), timer_content).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn create_scheduled_task(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        write_unit_files(label, script_path, schedule)?;

        let timer_unit = format!("{}.timer", label_to_unit_name(label));
        systemctl(&["daemon-reload"])?;
        systemctl(&["enable", "--now", &timer_unit])?;

        Ok(())
    }

    pub fn delete_scheduled_task(label: &str) -> Result<(), String> {
        let timer_unit = format!("{}.timer", label_to_unit_name(label));

        // Disable and stop (ignore errors if already stopped)
        let _ = systemctl(&["disable", "--now", &timer_unit]);

        // Remove unit files
        let _ = std::fs::remove_file(get_service_path(label));
        let _ = std::fs::remove_file(get_timer_path(label));

        let _ = systemctl(&["daemon-reload"]);

        Ok(())
    }

    pub fn enable_scheduled_task(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        // Re-write files in case they were cleaned up
        if !get_timer_path(label).exists() {
            write_unit_files(label, script_path, schedule)?;
        }

        let timer_unit = format!("{}.timer", label_to_unit_name(label));
        systemctl(&["daemon-reload"])?;
        systemctl(&["enable", "--now", &timer_unit])?;

        Ok(())
    }

    pub fn disable_scheduled_task(label: &str) -> Result<(), String> {
        let timer_unit = format!("{}.timer", label_to_unit_name(label));
        systemctl(&["disable", "--now", &timer_unit])?;
        Ok(())
    }

    pub fn task_exists(label: &str) -> bool {
        get_timer_path(label).exists()
    }
}

// ──────────────────────────────────────────────
// Windows: Task Scheduler (schtasks) helpers
// ──────────────────────────────────────────────

#[cfg(target_os = "windows")]
mod platform {
    use super::*;

    fn build_schtasks_command(label: &str, script_path: &str, schedule: &NewSchedule) -> Vec<String> {
        let logs_dir = get_logs_dir();
        let stdout_log = logs_dir.join(format!("{}.stdout.log", label));

        let ext = std::path::Path::new(script_path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let tr = match ext.as_str() {
            "ps1" => format!(
                "powershell.exe -ExecutionPolicy Bypass -File \"{}\" > \"{}\" 2>&1",
                script_path,
                stdout_log.to_string_lossy()
            ),
            "cmd" | "bat" => format!(
                "cmd.exe /C \"{}\" > \"{}\" 2>&1",
                script_path,
                stdout_log.to_string_lossy()
            ),
            _ => format!(
                "\"{}\" > \"{}\" 2>&1",
                script_path,
                stdout_log.to_string_lossy()
            ),
        };

        let mut args = vec![
            "/Create".to_string(),
            "/TN".to_string(),
            label.to_string(),
            "/TR".to_string(),
            tr,
            "/F".to_string(),
        ];

        match schedule.schedule_type.as_str() {
            "daily" => {
                args.push("/SC".to_string());
                args.push("DAILY".to_string());
                if let Some(ref time_str) = schedule.time {
                    args.push("/ST".to_string());
                    args.push(time_str.clone());
                }
            }
            "weekly" => {
                args.push("/SC".to_string());
                args.push("WEEKLY".to_string());
                if let Some(weekday) = schedule.weekday {
                    let day = match weekday {
                        0 => "SUN",
                        1 => "MON",
                        2 => "TUE",
                        3 => "WED",
                        4 => "THU",
                        5 => "FRI",
                        6 => "SAT",
                        _ => "MON",
                    };
                    args.push("/D".to_string());
                    args.push(day.to_string());
                }
                if let Some(ref time_str) = schedule.time {
                    args.push("/ST".to_string());
                    args.push(time_str.clone());
                }
            }
            "interval" => {
                if let Some(seconds) = schedule.interval_seconds {
                    let minutes = (seconds / 60).max(1);
                    args.push("/SC".to_string());
                    args.push("MINUTE".to_string());
                    args.push("/MO".to_string());
                    args.push(minutes.to_string());
                }
            }
            _ => {}
        }

        args
    }

    pub fn create_scheduled_task(label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        let args = build_schtasks_command(label, script_path, schedule);
        let output = std::process::Command::new("schtasks")
            .args(&args)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }

    pub fn delete_scheduled_task(label: &str) -> Result<(), String> {
        let output = std::process::Command::new("schtasks")
            .args(["/Delete", "/TN", label, "/F"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if !stderr.contains("The system cannot find") {
                return Err(stderr.to_string());
            }
        }
        Ok(())
    }

    pub fn enable_scheduled_task(_label: &str, script_path: &str, schedule: &NewSchedule) -> Result<(), String> {
        // On Windows, re-creating the task effectively enables it
        create_scheduled_task(_label, script_path, schedule)?;
        let output = std::process::Command::new("schtasks")
            .args(["/Change", "/TN", _label, "/ENABLE"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }

    pub fn disable_scheduled_task(label: &str) -> Result<(), String> {
        let output = std::process::Command::new("schtasks")
            .args(["/Change", "/TN", label, "/DISABLE"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }

    pub fn task_exists(label: &str) -> bool {
        std::process::Command::new("schtasks")
            .args(["/Query", "/TN", label])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}

// ──────────────────────────────────────────────
// Tauri commands (platform-agnostic interface)
// ──────────────────────────────────────────────

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

    // Get script path
    let script = queries::get_script_by_id(&conn, script_id).map_err(|e| e.to_string())?;

    let new_schedule = NewSchedule {
        script_id,
        schedule_type,
        time,
        weekday,
        interval_seconds,
    };

    let task_label = generate_task_label(script_id);

    // Create the OS-level scheduled task
    platform::create_scheduled_task(&task_label, &script.path, &new_schedule)?;

    // Insert into DB
    let schedule = queries::insert_schedule(&conn, &new_schedule, &task_label).map_err(|e| e.to_string())?;

    Ok(schedule)
}

#[tauri::command]
pub fn update_schedule(db: State<'_, Database>, schedule_id: i64, enabled: bool) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedule = queries::get_schedule_by_id(&conn, schedule_id).map_err(|e| e.to_string())?;

    if enabled {
        let script = queries::get_script_by_id(&conn, schedule.script_id).map_err(|e| e.to_string())?;
        let new_schedule = NewSchedule {
            script_id: schedule.script_id,
            schedule_type: schedule.schedule_type,
            time: schedule.time,
            weekday: schedule.weekday,
            interval_seconds: schedule.interval_seconds,
        };
        platform::enable_scheduled_task(&schedule.plist_label, &script.path, &new_schedule)?;
    } else {
        platform::disable_scheduled_task(&schedule.plist_label)?;
    }

    queries::update_schedule_enabled(&conn, schedule_id, enabled).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_schedule(db: State<'_, Database>, schedule_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let schedule = queries::get_schedule_by_id(&conn, schedule_id).map_err(|e| e.to_string())?;

    // Remove OS-level scheduled task
    platform::delete_scheduled_task(&schedule.plist_label)?;

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
        platform::enable_scheduled_task(&schedule.plist_label, &script.path, &new_schedule)?;
    } else {
        platform::disable_scheduled_task(&schedule.plist_label)?;
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
        if schedule.enabled {
            // If enabled but task doesn't exist, recreate it
            if !platform::task_exists(&schedule.plist_label) {
                if let Ok(script) = queries::get_script_by_id(&conn, schedule.script_id) {
                    let new_schedule = NewSchedule {
                        script_id: schedule.script_id,
                        schedule_type: schedule.schedule_type,
                        time: schedule.time,
                        weekday: schedule.weekday,
                        interval_seconds: schedule.interval_seconds,
                    };
                    let _ = platform::create_scheduled_task(&schedule.plist_label, &script.path, &new_schedule);
                }
            }
        } else {
            // If disabled but task exists, disable/remove it
            if platform::task_exists(&schedule.plist_label) {
                let _ = platform::disable_scheduled_task(&schedule.plist_label);
            }
        }
    }

    Ok(())
}
