from datetime import date, timedelta
from typing import Any

from backend.app.core.database import Database
from backend.app.repositories.repositories import (
    count_action_items,
    get_attendance,
    get_employee,
    get_readiness_snapshots,
    get_training_summary,
    list_employees,
)


def summarize_attendance(records: list[dict[str, Any]]) -> dict[str, Any]:
    present = sum(record["status"] == "Present" for record in records)
    absences = sum(record["status"] == "Absent" for record in records)
    rto_records = [record for record in records if record["rto_compliant"] is not None]
    compliant = sum(bool(record["rto_compliant"]) for record in rto_records)
    return {
        "records": len(records),
        "present": present,
        "absences": absences,
        "tardy": None,
        "rto_compliant": compliant,
        "rto_non_compliant": len(rto_records) - compliant,
        "rto_compliance_rate": (
            round(compliant / len(rto_records) * 100, 1) if rto_records else None
        ),
        "follow_up": sum(bool(record["follow_up"]) for record in records),
        "limitations": [
            "Tardiness and absences are not available because no validated time policy or absence source is configured."
        ],
    }


def summarize_readiness(
    employees: list[dict[str, Any]], snapshots: list[dict[str, Any]], today: date | None = None
) -> dict[str, Any]:
    current_day = today or date.today()
    latest: dict[Any, dict[str, Any]] = {}
    for snapshot in snapshots:
        worker_id = snapshot["worker_id"]
        if worker_id not in latest or snapshot["snapshot_date_key"] > latest[worker_id]["snapshot_date_key"]:
            latest[worker_id] = snapshot
    stale_cutoff = current_day - timedelta(days=90)
    stale = sum(
        date.fromisoformat(str(snapshot["full_date"])[:10]) < stale_cutoff
        for snapshot in latest.values()
    )
    eligible = sum(bool(snapshot["is_ranking_eligible"]) for snapshot in latest.values())
    snapshot_count = len(latest)
    return {
        "eligible": eligible,
        "snapshot_count": snapshot_count,
        "missing_snapshots": max(len(employees) - snapshot_count, 0),
        "stale_snapshots": stale,
        "latest_snapshot_date": max(
            (str(snapshot["full_date"])[:10] for snapshot in latest.values()), default=None
        ),
        "eligible_rate": round(eligible / snapshot_count * 100, 1) if snapshot_count else None,
        "stale_after_days": 90,
    }


async def get_admin_dashboard(
    db: Database, capability: str | None = None, location: str | None = None
) -> dict[str, Any]:
    employees = await list_employees(db, capability=capability, location=location)
    records = await get_attendance(db, capability=capability, location=location)
    training = await get_training_summary(db, capability, location)
    snapshots = await get_readiness_snapshots(db, capability, location)
    attendance = summarize_attendance(records)
    readiness = summarize_readiness(employees, snapshots)
    total_assignments = int(training["total_assignments"] or 0)
    completed = int(training["completed"] or 0)
    return {
        "headcount": len(employees),
        "attendance": attendance,
        "training": {
            **training,
            "total_assignments": total_assignments,
            "completed": completed,
            "completion_rate": (
                round(completed / total_assignments * 100, 1) if total_assignments else None
            ),
        },
        "deployment_readiness": readiness,
        "action_items": {
            "total": await count_action_items(db),
            "open": await count_action_items(db, "Open"),
        },
        "filters": {"capability": capability, "location": location},
    }


async def get_employee_profile(db: Database, employee_id: str) -> dict[str, Any] | None:
    return await get_employee(db, employee_id)
