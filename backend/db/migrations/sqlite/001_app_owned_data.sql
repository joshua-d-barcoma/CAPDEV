PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_user_tasks (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    category TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_user_tasks_employee
    ON app_user_tasks (employee_id, due_date);

CREATE TABLE IF NOT EXISTS app_action_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    owner TEXT NOT NULL,
    due_date TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Done')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_action_items_status
    ON app_action_items (status, due_date);

CREATE TABLE IF NOT EXISTS app_employee_schedules (
    employee_id TEXT NOT NULL,
    weekday TEXT NOT NULL CHECK (
        weekday IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    ),
    work_type TEXT NOT NULL CHECK (work_type IN ('Onsite', 'Work from home')),
    location TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, weekday)
);

CREATE TABLE IF NOT EXISTS app_attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    attendance_date TEXT NOT NULL,
    time_in TEXT NOT NULL,
    work_type TEXT NOT NULL CHECK (work_type IN ('Onsite', 'Work from home')),
    location TEXT,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
    rto_compliant INTEGER CHECK (rto_compliant IN (0, 1) OR rto_compliant IS NULL),
    follow_up INTEGER NOT NULL DEFAULT 0 CHECK (follow_up IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_app_attendance_date
    ON app_attendance_records (attendance_date, employee_id);
