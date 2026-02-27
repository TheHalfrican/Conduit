use crate::db::queries;
use crate::db::Database;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub struct RunnerState {
    pub active_processes: Arc<Mutex<HashMap<i64, u32>>>,
    pub cancelled_scripts: Arc<Mutex<HashSet<i64>>>,
}

impl RunnerState {
    pub fn new() -> Self {
        RunnerState {
            active_processes: Arc::new(Mutex::new(HashMap::new())),
            cancelled_scripts: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScriptOutputEvent {
    script_id: i64,
    line: String,
    stream: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScriptFinishedEvent {
    script_id: i64,
    exit_code: i32,
    record_id: i64,
}

fn build_script_command(script_path: &str) -> Command {
    #[cfg(target_os = "macos")]
    {
        let mut cmd = Command::new("/bin/bash");
        cmd.arg(script_path)
            .env(
                "PATH",
                "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
            )
            .process_group(0);
        cmd
    }
    #[cfg(target_os = "windows")]
    {
        let ext = std::path::Path::new(script_path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        let mut cmd = match ext.as_str() {
            "ps1" => {
                let mut c = Command::new("powershell.exe");
                c.args(["-ExecutionPolicy", "Bypass", "-File", script_path]);
                c
            }
            "cmd" | "bat" => {
                let mut c = Command::new("cmd.exe");
                c.args(["/C", script_path]);
                c
            }
            _ => {
                let c = Command::new(script_path);
                c
            }
        };
        // CREATE_NEW_PROCESS_GROUP
        cmd.creation_flags(0x00000200);
        cmd
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let mut cmd = Command::new("/bin/bash");
        cmd.arg(script_path).process_group(0);
        cmd
    }
}

#[tauri::command]
pub async fn run_script(
    app: AppHandle,
    db: State<'_, Database>,
    runner: State<'_, RunnerState>,
    script_id: i64,
) -> Result<i64, String> {
    // Get script path from DB
    let script_path = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let script = queries::get_script_by_id(&conn, script_id).map_err(|e| e.to_string())?;
        script.path
    };

    // Create run record
    let started_at = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let record = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        queries::insert_run_record(&conn, script_id, &started_at).map_err(|e| e.to_string())?
    };
    let record_id = record.id;

    // Spawn the script process in its own process group so we can kill the whole tree
    let mut cmd = build_script_command(&script_path);
    let mut child = cmd
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    // Store PID in active processes
    let pid = child.id().unwrap_or(0);
    {
        let mut procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
        procs.insert(script_id, pid);
    }

    // Take stdout and stderr handles
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    // Clone Arc references for the spawned task
    let active_procs = Arc::clone(&runner.active_processes);
    let cancelled = Arc::clone(&runner.cancelled_scripts);
    let app_handle = app.clone();

    // Spawn async task to read output and wait for completion
    tokio::spawn(async move {
        let output = Arc::new(Mutex::new(String::new()));
        let max_output_bytes = 50 * 1024; // ~50KB

        // Read stdout in a separate task
        let stdout_handle = if let Some(stdout) = stdout {
            let app_ref = app_handle.clone();
            let output_ref = Arc::clone(&output);
            Some(tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = app_ref.emit(
                        "script-output",
                        ScriptOutputEvent {
                            script_id,
                            line: line.clone(),
                            stream: "stdout".to_string(),
                        },
                    );
                    if let Ok(mut out) = output_ref.lock() {
                        if out.len() < max_output_bytes {
                            if !out.is_empty() {
                                out.push('\n');
                            }
                            out.push_str(&line);
                        }
                    }
                }
            }))
        } else {
            None
        };

        // Read stderr in a separate task
        let stderr_handle = if let Some(stderr) = stderr {
            let app_ref = app_handle.clone();
            let output_ref = Arc::clone(&output);
            Some(tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = app_ref.emit(
                        "script-output",
                        ScriptOutputEvent {
                            script_id,
                            line: line.clone(),
                            stream: "stderr".to_string(),
                        },
                    );
                    if let Ok(mut out) = output_ref.lock() {
                        if out.len() < max_output_bytes {
                            if !out.is_empty() {
                                out.push('\n');
                            }
                            out.push_str(&format!("[stderr] {}", line));
                        }
                    }
                }
            }))
        } else {
            None
        };

        // Wait for both readers to finish
        if let Some(h) = stdout_handle {
            let _ = h.await;
        }
        if let Some(h) = stderr_handle {
            let _ = h.await;
        }

        // Wait for process to finish
        let wait_result = child.wait().await;
        let exit_code = match &wait_result {
            Ok(status) => status.code().unwrap_or(-1),
            Err(_) => -1,
        };

        // Check if this script was explicitly cancelled
        let was_cancelled = cancelled
            .lock()
            .map(|mut set| set.remove(&script_id))
            .unwrap_or(false);

        let status = if exit_code == 0 {
            "success"
        } else if was_cancelled {
            "cancelled"
        } else {
            "error"
        };
        let finished_at = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // Update run record via AppHandle state
        let full_output = output.lock().map(|o| o.clone()).unwrap_or_default();
        let db_state = app_handle.state::<Database>();
        if let Ok(conn) = db_state.conn.lock() {
            let _ = queries::update_run_record(
                &conn,
                record_id,
                &finished_at,
                Some(exit_code),
                Some(&full_output),
                status,
            );
        }

        // Remove from active processes
        if let Ok(mut procs) = active_procs.lock() {
            procs.remove(&script_id);
        }

        // Emit finished event
        let _ = app_handle.emit(
            "script-finished",
            ScriptFinishedEvent {
                script_id,
                exit_code,
                record_id,
            },
        );
    });

    Ok(record_id)
}

#[tauri::command]
pub fn cancel_script(runner: State<'_, RunnerState>, script_id: i64) -> Result<(), String> {
    let procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
    if let Some(&pid) = procs.get(&script_id) {
        // Mark as cancelled before killing so the async task can detect it
        if let Ok(mut set) = runner.cancelled_scripts.lock() {
            set.insert(script_id);
        }

        #[cfg(target_os = "macos")]
        unsafe {
            // Kill the entire process group (negative PID) so child processes
            // like rsync and piped commands are also terminated
            libc::kill(-(pid as i32), libc::SIGTERM);
        }

        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/T", "/F", "/PID", &pid.to_string()])
                .output();
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        unsafe {
            libc::kill(-(pid as i32), libc::SIGTERM);
        }

        Ok(())
    } else {
        Err("Script is not running".to_string())
    }
}

#[tauri::command]
pub fn is_script_running(runner: State<'_, RunnerState>, script_id: i64) -> Result<bool, String> {
    let procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
    Ok(procs.contains_key(&script_id))
}
