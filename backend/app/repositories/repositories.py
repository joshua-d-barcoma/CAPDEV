from datetime import date
from typing import Any
from uuid import uuid4

from backend.app.core.database import Database


def _database_date(db: Database, value: date | None) -> date | str | None:
    if value is None or not db.is_sqlite:
        return value
    return value.isoformat()


def _employee_filters(
    db: Database,
    capability: str | None,
    location: str | None,
    career_level: str | None,
    bench_status: str | None,
    skill: str | None,
    readiness: str | None,
) -> tuple[str, list[Any]]:
    filters: list[str] = []
    values: list[Any] = []

    def add(condition: str, value: Any) -> None:
        values.append(value)
        filters.append(condition.replace("{}", f"${len(values)}"))

    if capability:
        add("lower(w.capability_area) LIKE lower({})", f"%{capability}%")
    if location:
        add("lower(w.location) LIKE lower({})", f"%{location}%")
    if career_level:
        add("CAST(w.management_level AS TEXT) = {}", career_level)
    if bench_status:
        add("lower(w.activity_type) = lower({})", bench_status)
    if skill:
        values.append(f"%{skill}%")
        filters.append(
            "EXISTS (SELECT 1 FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id "
            f"WHERE ws.worker_id = w.id AND lower(s.name) LIKE lower(${len(values)}))"
        )
    if readiness == "eligible":
        person_column = "PersonKey" if db.is_sqlite else "person_key"
        date_column = "SnapshotDateKey" if db.is_sqlite else "snapshot_date_key"
        eligible_column = "IsRankingEligible" if db.is_sqlite else "is_ranking_eligible"
        filters.append(
            f"(SELECT rs.{eligible_column} FROM fact_ready_snapshot rs "
            f"WHERE rs.{person_column} = w.id ORDER BY rs.{date_column} DESC LIMIT 1) = TRUE"
        )
    elif readiness == "not_eligible":
        person_column = "PersonKey" if db.is_sqlite else "person_key"
        date_column = "SnapshotDateKey" if db.is_sqlite else "snapshot_date_key"
        eligible_column = "IsRankingEligible" if db.is_sqlite else "is_ranking_eligible"
        filters.append(
            f"(SELECT rs.{eligible_column} FROM fact_ready_snapshot rs "
            f"WHERE rs.{person_column} = w.id ORDER BY rs.{date_column} DESC LIMIT 1) = FALSE"
        )
    elif readiness == "missing":
        person_column = "PersonKey" if db.is_sqlite else "person_key"
        filters.append(
            f"NOT EXISTS (SELECT 1 FROM fact_ready_snapshot rs WHERE rs.{person_column} = w.id)"
        )
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    return where, values


async def list_employees(
    db: Database,
    *,
    capability: str | None = None,
    location: str | None = None,
    career_level: str | None = None,
    bench_status: str | None = None,
    skill: str | None = None,
    readiness: str | None = None,
) -> list[dict[str, Any]]:
    where, values = _employee_filters(
        db, capability, location, career_level, bench_status, skill, readiness
    )
    rows = await db.fetch(
        f"""
        SELECT w.id, w.employee_id, w.first_name, w.last_name, w.preferred_name,
               w.email, w.job_profile, w.management_level, w.capability_area,
               w.location, w.activity_type, w.project, w.client, w.is_active,
               w.hire_date, w.people_lead_id, w.is_people_lead
        FROM workers w
        {where}
        ORDER BY w.last_name, w.first_name, w.id
        """,
        *values,
    )
    if not rows:
        return []
    skill_rows = await db.fetch(
        "SELECT ws.worker_id, s.name FROM worker_skills ws "
        "JOIN skills s ON s.id = ws.skill_id ORDER BY ws.worker_id, s.name"
    )
    skills: dict[Any, list[str]] = {}
    for row in skill_rows:
        skills.setdefault(row["worker_id"], []).append(row["name"])
    for row in rows:
        row["skills"] = skills.get(row["id"], [])
    return rows


async def get_employee(db: Database, employee_id: str) -> dict[str, Any] | None:
    employee = await db.fetchrow(
        """
        SELECT w.id, w.employee_id, w.first_name, w.last_name, w.preferred_name,
               w.email, w.job_profile, w.management_level, w.capability_area,
               w.location, w.activity_type, w.project, w.client, w.is_active,
               w.hire_date, w.people_lead_id, w.is_people_lead
        FROM workers w
        WHERE w.employee_id = $1 OR CAST(w.id AS TEXT) = $1
        """,
        employee_id,
    )
    if employee is None:
        return None
    skills = await db.fetch(
        "SELECT s.name FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id "
        "WHERE ws.worker_id = $1 ORDER BY s.name",
        employee["id"],
    )
    employee["skills"] = [row["name"] for row in skills]
    return employee


async def get_attendance(
    db: Database,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    capability: str | None = None,
    location: str | None = None,
    employee_id: str | None = None,
) -> list[dict[str, Any]]:
    filters: list[str] = []
    values: list[Any] = []
    for field, value in (
        ("a.attendance_date >= {}", _database_date(db, start_date)),
        ("a.attendance_date <= {}", _database_date(db, end_date)),
        ("lower(w.capability_area) LIKE lower({})", f"%{capability}%" if capability else None),
        ("lower(COALESCE(a.location, w.location)) LIKE lower({})", f"%{location}%" if location else None),
        ("a.employee_id = {}", employee_id),
    ):
        if value is not None:
            values.append(value)
            filters.append(field.replace("{}", f"${len(values)}"))
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    return await db.fetch(
        f"""
        SELECT a.id, a.employee_id, w.id AS worker_id, w.first_name, w.last_name,
               w.capability_area AS capability, a.attendance_date AS date,
               a.time_in, a.work_type, COALESCE(a.location, w.location) AS location,
               a.status, a.rto_compliant, a.follow_up, a.created_at
        FROM app_attendance_records a
        LEFT JOIN workers w ON w.employee_id = a.employee_id
        {where}
        ORDER BY a.attendance_date DESC, w.last_name, w.first_name
        """,
        *values,
    )


async def get_scheduled_work_type(
    db: Database, employee_id: str, weekday: str
) -> dict[str, Any] | None:
    return await db.fetchrow(
        "SELECT work_type, location FROM app_employee_schedules "
        "WHERE employee_id = $1 AND weekday = $2",
        employee_id,
        weekday,
    )


async def create_attendance(
    db: Database,
    *,
    employee_id: str,
    attendance_date: date,
    time_in: str,
    work_type: str,
    location: str | None,
    rto_compliant: bool | None,
) -> dict[str, Any]:
    return await db.fetchrow(
        """
        INSERT INTO app_attendance_records
            (id, employee_id, attendance_date, time_in, work_type, location,
             status, rto_compliant, follow_up)
        VALUES ($1, $2, $3, $4, $5, $6, 'Present', $7, $8)
        RETURNING *
        """,
        str(uuid4()),
        employee_id,
        _database_date(db, attendance_date),
        time_in,
        work_type,
        location,
        rto_compliant,
        rto_compliant is False,
    )


async def save_schedule(
    db: Database,
    *,
    employee_id: str,
    weekday: str,
    work_type: str,
    location: str | None,
) -> dict[str, Any]:
    return await db.fetchrow(
        """
        INSERT INTO app_employee_schedules (employee_id, weekday, work_type, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (employee_id, weekday) DO UPDATE
            SET work_type = excluded.work_type, location = excluded.location
        RETURNING *
        """,
        employee_id,
        weekday,
        work_type,
        location,
    )


async def get_training_summary(
    db: Database, capability: str | None = None, location: str | None = None
) -> dict[str, Any]:
    filters: list[str] = []
    values: list[Any] = []
    for field, value in (
        ("lower(w.capability_area) LIKE lower({})", f"%{capability}%" if capability else None),
        ("lower(w.location) LIKE lower({})", f"%{location}%" if location else None),
    ):
        if value is not None:
            values.append(value)
            filters.append(field.replace("{}", f"${len(values)}"))
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    return await db.fetchrow(
        f"""
        SELECT COUNT(*) AS total_assignments,
               SUM(CASE WHEN lower(wt.status) = 'completed' THEN 1 ELSE 0 END) AS completed,
               SUM(CASE WHEN lower(wt.status) IN ('in_progress', 'enrolled') THEN 1 ELSE 0 END) AS in_progress,
               SUM(CASE WHEN lower(wt.status) IN ('not_started', 'not_enrolled') THEN 1 ELSE 0 END) AS not_started,
               COUNT(DISTINCT wt.worker_id) AS employees_with_training
        FROM worker_trainings wt
        JOIN workers w ON w.id = wt.worker_id
        {where}
        """,
        *values,
    )


async def list_personal_training(db: Database, worker_id: int) -> list[dict[str, Any]]:
    return await db.fetch(
        """
        SELECT wt.id, wt.worker_id, t.id AS training_id, t.name, t.short_code,
               t.category, t.due_date, wt.status, wt.progress_pct, wt.completion_date
        FROM worker_trainings wt
        JOIN training_catalog t ON t.id = wt.training_id
        WHERE wt.worker_id = $1
        ORDER BY t.name
        """,
        worker_id,
    )


async def list_training_report(
    db: Database, capability: str | None = None, location: str | None = None
) -> list[dict[str, Any]]:
    filters: list[str] = []
    values: list[Any] = []
    for field, value in (
        ("lower(w.capability_area) LIKE lower({})", f"%{capability}%" if capability else None),
        ("lower(w.location) LIKE lower({})", f"%{location}%" if location else None),
    ):
        if value is not None:
            values.append(value)
            filters.append(field.replace("{}", f"${len(values)}"))
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    return await db.fetch(
        f"""
        SELECT w.employee_id, w.first_name, w.last_name, w.capability_area,
               w.location, t.name AS training_name, t.category, t.due_date,
               wt.status, wt.progress_pct, wt.completion_date
        FROM worker_trainings wt
        JOIN workers w ON w.id = wt.worker_id
        JOIN training_catalog t ON t.id = wt.training_id
        {where}
        ORDER BY w.last_name, w.first_name, t.name
        """,
        *values,
    )


async def get_readiness_snapshots(
    db: Database, capability: str | None = None, location: str | None = None
) -> list[dict[str, Any]]:
    filters: list[str] = []
    values: list[Any] = []
    for field, value in (
        ("lower(w.capability_area) LIKE lower({})", f"%{capability}%" if capability else None),
        ("lower(w.location) LIKE lower({})", f"%{location}%" if location else None),
    ):
        if value is not None:
            values.append(value)
            filters.append(field.replace("{}", f"${len(values)}"))
    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    if db.is_sqlite:
        query = f"""
        SELECT w.id AS worker_id, rs.SnapshotDateKey AS snapshot_date_key,
               rs.ReadyScore AS ready_score,
               rs.IsRankingEligible AS is_ranking_eligible,
               rs.DataCompletenessPercent AS data_completeness_percent,
               d.FullDate AS full_date
        FROM fact_ready_snapshot rs
        JOIN dim_person p ON p.PersonKey = rs.PersonKey AND p.IsCurrent = 1
        JOIN workers w ON w.id = p.PersonKey
        JOIN dim_date d ON d.DateKey = rs.SnapshotDateKey
        {where}
        ORDER BY rs.SnapshotDateKey DESC
        """
    else:
        query = f"""
        SELECT w.id AS worker_id, rs.snapshot_date_key, rs.ready_score,
               rs.is_ranking_eligible, rs.data_completeness_percent, d.full_date
        FROM fact_ready_snapshot rs
        JOIN dim_person p ON p.person_key = rs.person_key AND p.is_current = TRUE
        JOIN workers w ON w.id = p.person_key
        JOIN dim_date d ON d.date_key = rs.snapshot_date_key
        {where}
        ORDER BY rs.snapshot_date_key DESC
        """
    return await db.fetch(
        query,
        *values,
    )


async def count_action_items(db: Database, status: str | None = None) -> int:
    if status:
        return await db.fetchval(
            "SELECT COUNT(*) FROM app_action_items WHERE status = $1", status
        )
    return await db.fetchval("SELECT COUNT(*) FROM app_action_items")


async def list_action_items(db: Database) -> list[dict[str, Any]]:
    return await db.fetch(
        "SELECT id, title, description, category, owner, due_date, priority, status "
        "FROM app_action_items ORDER BY CASE priority WHEN 'High' THEN 0 "
        "WHEN 'Medium' THEN 1 ELSE 2 END, due_date, title"
    )


async def create_action_item(
    db: Database,
    *,
    title: str,
    description: str,
    category: str,
    owner: str,
    due_date: date | None,
    priority: str,
) -> dict[str, Any]:
    return await db.fetchrow(
        """
        INSERT INTO app_action_items
            (id, title, description, category, owner, due_date, priority, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open')
        RETURNING id, title, description, category, owner, due_date, priority, status
        """,
        str(uuid4()),
        title,
        description,
        category,
        owner,
        _database_date(db, due_date),
        priority,
    )


async def update_action_item_status(
    db: Database, item_id: str, status: str
) -> dict[str, Any] | None:
    return await db.fetchrow(
        "UPDATE app_action_items SET status = $2, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = $1 RETURNING id, title, description, category, owner, due_date, priority, status",
        item_id,
        status,
    )


async def list_user_tasks(db: Database, employee_id: str) -> list[dict[str, Any]]:
    return await db.fetch(
        "SELECT id, employee_id, title, description, due_date, priority, status, category "
        "FROM app_user_tasks WHERE employee_id = $1 ORDER BY due_date, title",
        employee_id,
    )


async def create_user_task(
    db: Database,
    *,
    employee_id: str,
    title: str,
    description: str,
    due_date: date | None,
    priority: str,
    category: str,
) -> dict[str, Any]:
    return await db.fetchrow(
        """
        INSERT INTO app_user_tasks
            (id, employee_id, title, description, due_date, priority, status, category)
        VALUES ($1, $2, $3, $4, $5, $6, 'Not Started', $7)
        RETURNING id, employee_id, title, description, due_date, priority, status, category
        """,
        str(uuid4()),
        employee_id,
        title,
        description,
        _database_date(db, due_date),
        priority,
        category,
    )


async def update_user_task_status(
    db: Database, task_id: str, employee_id: str, status: str
) -> dict[str, Any] | None:
    return await db.fetchrow(
        """
        UPDATE app_user_tasks SET status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND employee_id = $2
        RETURNING id, employee_id, title, description, due_date, priority, status, category
        """,
        task_id,
        employee_id,
        status,
    )


async def list_training_applicability(db: Database) -> list[dict[str, Any]]:
    if db.is_sqlite:
        return await db.fetch(
            """
            SELECT a.ApplicabilityKey AS id, a.CourseKey AS course_id,
                   c.CourseName AS course_name, a.PopulationRule AS population_rule,
                   a.EffectiveFrom AS effective_from, a.EffectiveTo AS effective_to
            FROM cfg_training_applicability a
            JOIN dim_course c ON c.CourseKey = a.CourseKey
            ORDER BY a.EffectiveFrom DESC, c.CourseName
            """
        )
    return await db.fetch(
        """
        SELECT a.applicability_key AS id, a.course_key AS course_id,
               c.course_name AS course_name, a.population_rule,
               a.effective_from, a.effective_to
        FROM cfg_training_applicability a
        JOIN dim_course c ON c.course_key = a.course_key
        ORDER BY a.effective_from DESC, c.course_name
        """
    )


async def create_training_applicability(
    db: Database,
    *,
    course_id: int,
    population_rule: str,
    effective_from: date,
    effective_to: date | None,
) -> dict[str, Any]:
    if db.is_sqlite:
        return await db.fetchrow(
            """
            INSERT INTO cfg_training_applicability
                (CourseKey, PopulationRule, EffectiveFrom, EffectiveTo)
            VALUES ($1, $2, $3, $4)
            RETURNING ApplicabilityKey AS id, CourseKey AS course_id,
                      PopulationRule AS population_rule,
                      EffectiveFrom AS effective_from, EffectiveTo AS effective_to
            """,
            course_id,
            population_rule,
            _database_date(db, effective_from),
            _database_date(db, effective_to),
        )
    return await db.fetchrow(
        """
        INSERT INTO cfg_training_applicability
            (course_key, population_rule, effective_from, effective_to)
        VALUES ($1, $2, $3, $4)
        RETURNING applicability_key AS id, course_key AS course_id,
                  population_rule, effective_from, effective_to
        """,
        course_id,
        population_rule,
        _database_date(db, effective_from),
        _database_date(db, effective_to),
    )
