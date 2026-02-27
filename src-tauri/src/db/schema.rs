use rusqlite::Connection;

pub fn initialize(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#00d4aa',
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            description TEXT,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE SET DEFAULT DEFAULT 1,
            color TEXT NOT NULL DEFAULT '#00d4aa',
            is_executable BOOLEAN NOT NULL DEFAULT 0,
            run_as_admin BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
            started_at DATETIME NOT NULL,
            finished_at DATETIME,
            exit_code INTEGER,
            output TEXT,
            status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','success','error','cancelled'))
        );

        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
            schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily','weekly','interval')),
            time TEXT,
            weekday INTEGER,
            interval_seconds INTEGER,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            plist_label TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_scripts_category ON scripts(category_id);
        CREATE INDEX IF NOT EXISTS idx_run_history_script ON run_history(script_id);
        CREATE INDEX IF NOT EXISTS idx_run_history_started ON run_history(started_at);
        CREATE INDEX IF NOT EXISTS idx_schedules_script ON schedules(script_id);

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            editor_path TEXT NOT NULL DEFAULT ''
        );

        INSERT OR IGNORE INTO settings (id) VALUES (1);

        INSERT OR IGNORE INTO categories (id, name, color, sort_order) VALUES (1, 'General', '#00d4aa', 0);
        ",
    )?;

    // Migration: add run_as_admin column for existing databases
    let _ = conn.execute_batch("ALTER TABLE scripts ADD COLUMN run_as_admin BOOLEAN NOT NULL DEFAULT 0");

    Ok(())
}
