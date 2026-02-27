use crate::db::queries;
use crate::db::Database;
use base64::Engine;
use portable_pty::{CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

pub(crate) struct PtyProcess {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child_pid: u32,
}

pub struct RunnerState {
    pub active_processes: Arc<Mutex<HashMap<i64, PtyProcess>>>,
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
    data: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScriptFinishedEvent {
    script_id: i64,
    exit_code: i32,
    record_id: i64,
}

fn build_script_command(script_path: &str, run_as_admin: bool) -> CommandBuilder {
    #[cfg(unix)]
    {
        let path_env = if cfg!(target_os = "macos") {
            "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        } else {
            "/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin"
        };
        let mut cmd = if run_as_admin {
            let mut c = CommandBuilder::new("sudo");
            c.args(["/bin/bash", script_path]);
            c
        } else {
            let mut c = CommandBuilder::new("/bin/bash");
            c.arg(script_path);
            c
        };
        cmd.env("PATH", path_env);
        cmd.env("TERM", "xterm-256color");
        cmd
    }
    #[cfg(target_os = "windows")]
    {
        let mut cmd = if run_as_admin {
            let mut c = CommandBuilder::new("powershell.exe");
            c.args([
                "-Command",
                &format!(
                    "Start-Process -FilePath '{}' -Verb RunAs -Wait",
                    script_path.replace("'", "''")
                ),
            ]);
            c
        } else {
            let ext = std::path::Path::new(script_path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            match ext.as_str() {
                "ps1" => {
                    let mut c = CommandBuilder::new("powershell.exe");
                    c.args(["-ExecutionPolicy", "Bypass", "-File", script_path]);
                    c
                }
                "cmd" | "bat" => {
                    let mut c = CommandBuilder::new("cmd.exe");
                    c.args(["/C", script_path]);
                    c
                }
                _ => CommandBuilder::new(script_path),
            }
        };
        cmd.env("TERM", "xterm-256color");
        cmd
    }
}

#[tauri::command]
pub async fn run_script(
    app: AppHandle,
    db: State<'_, Database>,
    runner: State<'_, RunnerState>,
    script_id: i64,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<i64, String> {
    let pty_cols = cols.unwrap_or(80);
    let pty_rows = rows.unwrap_or(24);

    // Get script from DB
    let (script_path, run_as_admin) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let script = queries::get_script_by_id(&conn, script_id).map_err(|e| e.to_string())?;
        (script.path, script.run_as_admin)
    };

    // Create run record
    let started_at = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let record = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        queries::insert_run_record(&conn, script_id, &started_at).map_err(|e| e.to_string())?
    };
    let record_id = record.id;

    // Open PTY pair
    let pty_system = NativePtySystem::default();
    let pair = pty_system
        .openpty(PtySize {
            rows: pty_rows,
            cols: pty_cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    // Spawn child on the slave
    let cmd = build_script_command(&script_path, run_as_admin);
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let child_pid = child.process_id().unwrap_or(0);

    // Drop slave — the child owns its end now
    drop(pair.slave);

    // Get a reader from the master and a writer for stdin
    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Store PtyProcess in active_processes
    {
        let mut procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
        procs.insert(
            script_id,
            PtyProcess {
                writer,
                master: pair.master,
                child_pid,
            },
        );
    }

    let active_procs = Arc::clone(&runner.active_processes);
    let cancelled = Arc::clone(&runner.cancelled_scripts);
    let app_handle = app.clone();

    // Spawn a std::thread for blocking PTY reads
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut child = child;
        let mut buf = [0u8; 4096];
        let mut output_acc = String::new();
        let max_output_bytes: usize = 50 * 1024;
        let b64 = base64::engine::general_purpose::STANDARD;

        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let chunk = &buf[..n];

                    // Emit base64-encoded chunk
                    let encoded = b64.encode(chunk);
                    let _ = app_handle.emit(
                        "script-output",
                        ScriptOutputEvent {
                            script_id,
                            data: encoded,
                        },
                    );

                    // Accumulate ANSI-stripped text for DB
                    if output_acc.len() < max_output_bytes {
                        let stripped = strip_ansi_escapes::strip(chunk);
                        if let Ok(text) = String::from_utf8(stripped) {
                            let remaining = max_output_bytes - output_acc.len();
                            if text.len() <= remaining {
                                output_acc.push_str(&text);
                            } else {
                                output_acc.push_str(&text[..remaining]);
                            }
                        }
                    }
                }
                Err(_) => break,
            }
        }

        // Wait for child exit
        let exit_code = match child.wait() {
            Ok(status) => {
                if status.success() {
                    0
                } else {
                    // portable-pty ExitStatus doesn't expose the raw code on all platforms,
                    // but we can check success. Use 1 for generic failure.
                    1
                }
            }
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

        // Update run record
        let db_state = app_handle.state::<Database>();
        if let Ok(conn) = db_state.conn.lock() {
            let _ = queries::update_run_record(
                &conn,
                record_id,
                &finished_at,
                Some(exit_code),
                Some(&output_acc),
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
pub fn write_script_input(
    runner: State<'_, RunnerState>,
    script_id: i64,
    data: String,
) -> Result<(), String> {
    let mut procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
    if let Some(pty) = procs.get_mut(&script_id) {
        pty.writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        pty.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Script is not running".to_string())
    }
}

#[tauri::command]
pub fn resize_script_pty(
    runner: State<'_, RunnerState>,
    script_id: i64,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
    if let Some(pty) = procs.get(&script_id) {
        pty.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Script is not running".to_string())
    }
}

#[tauri::command]
pub fn cancel_script(runner: State<'_, RunnerState>, script_id: i64) -> Result<(), String> {
    let procs = runner.active_processes.lock().map_err(|e| e.to_string())?;
    if let Some(pty) = procs.get(&script_id) {
        // Mark as cancelled before killing so the reader thread can detect it
        if let Ok(mut set) = runner.cancelled_scripts.lock() {
            set.insert(script_id);
        }

        let pid = pty.child_pid;

        #[cfg(unix)]
        unsafe {
            // Kill the entire process group (negative PID) so child processes are also terminated
            libc::kill(-(pid as i32), libc::SIGTERM);
        }

        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/T", "/F", "/PID", &pid.to_string()])
                .output();
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
