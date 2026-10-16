CREATE TABLE IF NOT EXISTS app_user_tasks (
    id TEXT PRIMARY KEY,
    employee_id VARCHAR(150) NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date DATE,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_user_tasks_employee
    ON app_user_tasks (employee_id, due_date);

CREATE TABLE IF NOT EXISTS app_action_items (
    id TEXT PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL,
    owner VARCHAR(150) NOT NULL,
    due_date DATE,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_action_items_status
    ON app_action_items (status, due_date);

CREATE TABLE IF NOT EXISTS app_employee_schedules (
    employee_id VARCHAR(150) NOT NULL,
    weekday VARCHAR(10) NOT NULL CHECK (
        weekday IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    ),
    work_type VARCHAR(20) NOT NULL CHECK (work_type IN ('Onsite', 'Work from home')),
    location VARCHAR(250),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, weekday)
);

CREATE TABLE IF NOT EXISTS app_attendance_records (
    id TEXT PRIMARY KEY,
    employee_id VARCHAR(150) NOT NULL,
    attendance_date DATE NOT NULL,
    time_in VARCHAR(50) NOT NULL,
    work_type VARCHAR(20) NOT NULL CHECK (work_type IN ('Onsite', 'Work from home')),
    location VARCHAR(250),
    status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent')),
    rto_compliant BOOLEAN,
    follow_up BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_app_attendance_date
    ON app_attendance_records (attendance_date, employee_id);
