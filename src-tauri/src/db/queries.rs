use rusqlite::{params, Connection};

use crate::models::*;

// --- Script queries ---

pub fn insert_script(conn: &Connection, new: &NewScript) -> Result<Script, rusqlite::Error> {
    // Check if path is executable
    let is_exec = std::fs::metadata(&new.path)
        .map(|m| {
            use std::os::unix::fs::PermissionsExt;
            m.permissions().mode() & 0o111 != 0
        })
        .unwrap_or(false);

    conn.execute(
        "INSERT INTO scripts (name, path, description, category_id, color, is_executable) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![new.name, new.path, new.description, new.category_id, new.color, is_exec],
    )?;
    let id = conn.last_insert_rowid();

    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, category_id, color, is_executable, created_at, updated_at FROM scripts WHERE id = ?1",
    )?;
    stmt.query_row(params![id], |row| {
        Ok(Script {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            category_id: row.get(4)?,
            color: row.get(5)?,
            is_executable: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })
}

pub fn get_all_scripts(conn: &Connection) -> Result<Vec<Script>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, category_id, color, is_executable, created_at, updated_at FROM scripts ORDER BY name",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Script {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            category_id: row.get(4)?,
            color: row.get(5)?,
            is_executable: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    rows.collect()
}

pub fn get_scripts_by_category(conn: &Connection, category_id: i64) -> Result<Vec<Script>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, category_id, color, is_executable, created_at, updated_at FROM scripts WHERE category_id = ?1 ORDER BY name",
    )?;
    let rows = stmt.query_map(params![category_id], |row| {
        Ok(Script {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            category_id: row.get(4)?,
            color: row.get(5)?,
            is_executable: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    rows.collect()
}

pub fn update_script(conn: &Connection, id: i64, update: &UpdateScript) -> Result<Script, rusqlite::Error> {
    if let Some(ref name) = update.name {
        conn.execute("UPDATE scripts SET name = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2", params![name, id])?;
    }
    if let Some(ref path) = update.path {
        let is_exec = std::fs::metadata(path)
            .map(|m| {
                use std::os::unix::fs::PermissionsExt;
                m.permissions().mode() & 0o111 != 0
            })
            .unwrap_or(false);
        conn.execute("UPDATE scripts SET path = ?1, is_executable = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3", params![path, is_exec, id])?;
    }
    if let Some(ref description) = update.description {
        conn.execute("UPDATE scripts SET description = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2", params![description, id])?;
    }
    if let Some(category_id) = update.category_id {
        conn.execute("UPDATE scripts SET category_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2", params![category_id, id])?;
    }
    if let Some(ref color) = update.color {
        conn.execute("UPDATE scripts SET color = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2", params![color, id])?;
    }

    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, category_id, color, is_executable, created_at, updated_at FROM scripts WHERE id = ?1",
    )?;
    stmt.query_row(params![id], |row| {
        Ok(Script {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            category_id: row.get(4)?,
            color: row.get(5)?,
            is_executable: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })
}

pub fn delete_script(conn: &Connection, id: i64) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM scripts WHERE id = ?1", params![id])?;
    Ok(())
}

// --- Category queries ---

pub fn get_all_categories(conn: &Connection) -> Result<Vec<Category>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT id, name, color, sort_order FROM categories ORDER BY sort_order, name")?;
    let rows = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            sort_order: row.get(3)?,
        })
    })?;
    rows.collect()
}

pub fn insert_category(conn: &Connection, name: &str, color: &str) -> Result<Category, rusqlite::Error> {
    let max_order: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), -1) FROM categories", [], |row| row.get(0))
        .unwrap_or(0);
    conn.execute(
        "INSERT INTO categories (name, color, sort_order) VALUES (?1, ?2, ?3)",
        params![name, color, max_order + 1],
    )?;
    let id = conn.last_insert_rowid();
    Ok(Category {
        id,
        name: name.to_string(),
        color: color.to_string(),
        sort_order: max_order + 1,
    })
}

pub fn update_category(conn: &Connection, id: i64, name: &str, color: &str) -> Result<Category, rusqlite::Error> {
    conn.execute(
        "UPDATE categories SET name = ?1, color = ?2 WHERE id = ?3",
        params![name, color, id],
    )?;
    let mut stmt = conn.prepare("SELECT id, name, color, sort_order FROM categories WHERE id = ?1")?;
    stmt.query_row(params![id], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            sort_order: row.get(3)?,
        })
    })
}

pub fn delete_category(conn: &Connection, id: i64) -> Result<(), rusqlite::Error> {
    // Reassign scripts from deleted category to General (id=1)
    conn.execute(
        "UPDATE scripts SET category_id = 1 WHERE category_id = ?1",
        params![id],
    )?;
    conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn reorder_categories(conn: &Connection, ids: &[i64]) -> Result<(), rusqlite::Error> {
    for (index, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE categories SET sort_order = ?1 WHERE id = ?2",
            params![index as i64, id],
        )?;
    }
    Ok(())
}

// --- Run history queries ---

pub fn insert_run_record(conn: &Connection, script_id: i64, started_at: &str) -> Result<RunRecord, rusqlite::Error> {
    conn.execute(
        "INSERT INTO run_history (script_id, started_at, status) VALUES (?1, ?2, 'running')",
        params![script_id, started_at],
    )?;
    let id = conn.last_insert_rowid();
    Ok(RunRecord {
        id,
        script_id,
        started_at: started_at.to_string(),
        finished_at: None,
        exit_code: None,
        output: None,
        status: "running".to_string(),
    })
}

pub fn update_run_record(
    conn: &Connection,
    id: i64,
    finished_at: &str,
    exit_code: Option<i32>,
    output: Option<&str>,
    status: &str,
) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE run_history SET finished_at = ?1, exit_code = ?2, output = ?3, status = ?4 WHERE id = ?5",
        params![finished_at, exit_code, output, status, id],
    )?;
    Ok(())
}

pub fn get_run_history(conn: &Connection, script_id: i64, limit: i64) -> Result<Vec<RunRecord>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, script_id, started_at, finished_at, exit_code, output, status FROM run_history WHERE script_id = ?1 ORDER BY started_at DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![script_id, limit], |row| {
        Ok(RunRecord {
            id: row.get(0)?,
            script_id: row.get(1)?,
            started_at: row.get(2)?,
            finished_at: row.get(3)?,
            exit_code: row.get(4)?,
            output: row.get(5)?,
            status: row.get(6)?,
        })
    })?;
    rows.collect()
}

pub fn get_latest_run(conn: &Connection, script_id: i64) -> Result<Option<RunRecord>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, script_id, started_at, finished_at, exit_code, output, status FROM run_history WHERE script_id = ?1 ORDER BY started_at DESC LIMIT 1",
    )?;
    let mut rows = stmt.query_map(params![script_id], |row| {
        Ok(RunRecord {
            id: row.get(0)?,
            script_id: row.get(1)?,
            started_at: row.get(2)?,
            finished_at: row.get(3)?,
            exit_code: row.get(4)?,
            output: row.get(5)?,
            status: row.get(6)?,
        })
    })?;
    Ok(rows.next().transpose()?)
}

pub fn clear_run_history(conn: &Connection, script_id: i64) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM run_history WHERE script_id = ?1", params![script_id])?;
    Ok(())
}

// --- Schedule queries ---

pub fn insert_schedule(conn: &Connection, new: &NewSchedule, plist_label: &str) -> Result<Schedule, rusqlite::Error> {
    conn.execute(
        "INSERT INTO schedules (script_id, schedule_type, time, weekday, interval_seconds, plist_label) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![new.script_id, new.schedule_type, new.time, new.weekday, new.interval_seconds, plist_label],
    )?;
    let id = conn.last_insert_rowid();

    let mut stmt = conn.prepare(
        "SELECT id, script_id, schedule_type, time, weekday, interval_seconds, enabled, plist_label, created_at FROM schedules WHERE id = ?1",
    )?;
    stmt.query_row(params![id], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            script_id: row.get(1)?,
            schedule_type: row.get(2)?,
            time: row.get(3)?,
            weekday: row.get(4)?,
            interval_seconds: row.get(5)?,
            enabled: row.get(6)?,
            plist_label: row.get(7)?,
            created_at: row.get(8)?,
        })
    })
}

pub fn update_schedule_enabled(conn: &Connection, id: i64, enabled: bool) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE schedules SET enabled = ?1 WHERE id = ?2",
        params![enabled, id],
    )?;
    Ok(())
}

pub fn delete_schedule(conn: &Connection, id: i64) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM schedules WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_schedules_for_script(conn: &Connection, script_id: i64) -> Result<Vec<Schedule>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, script_id, schedule_type, time, weekday, interval_seconds, enabled, plist_label, created_at FROM schedules WHERE script_id = ?1 ORDER BY created_at",
    )?;
    let rows = stmt.query_map(params![script_id], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            script_id: row.get(1)?,
            schedule_type: row.get(2)?,
            time: row.get(3)?,
            weekday: row.get(4)?,
            interval_seconds: row.get(5)?,
            enabled: row.get(6)?,
            plist_label: row.get(7)?,
            created_at: row.get(8)?,
        })
    })?;
    rows.collect()
}

pub fn get_all_schedules(conn: &Connection) -> Result<Vec<Schedule>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, script_id, schedule_type, time, weekday, interval_seconds, enabled, plist_label, created_at FROM schedules ORDER BY created_at",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            script_id: row.get(1)?,
            schedule_type: row.get(2)?,
            time: row.get(3)?,
            weekday: row.get(4)?,
            interval_seconds: row.get(5)?,
            enabled: row.get(6)?,
            plist_label: row.get(7)?,
            created_at: row.get(8)?,
        })
    })?;
    rows.collect()
}

pub fn get_schedule_by_id(conn: &Connection, id: i64) -> Result<Schedule, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, script_id, schedule_type, time, weekday, interval_seconds, enabled, plist_label, created_at FROM schedules WHERE id = ?1",
    )?;
    stmt.query_row(params![id], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            script_id: row.get(1)?,
            schedule_type: row.get(2)?,
            time: row.get(3)?,
            weekday: row.get(4)?,
            interval_seconds: row.get(5)?,
            enabled: row.get(6)?,
            plist_label: row.get(7)?,
            created_at: row.get(8)?,
        })
    })
}

pub fn get_script_by_id(conn: &Connection, id: i64) -> Result<Script, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, name, path, description, category_id, color, is_executable, created_at, updated_at FROM scripts WHERE id = ?1",
    )?;
    stmt.query_row(params![id], |row| {
        Ok(Script {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            description: row.get(3)?,
            category_id: row.get(4)?,
            color: row.get(5)?,
            is_executable: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })
}
