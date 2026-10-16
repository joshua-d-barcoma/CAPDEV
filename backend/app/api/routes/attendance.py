import asyncpg
import aiosqlite
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from backend.app.api.routes.common import ADMIN, USER, csv_response, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.models import AttendanceRead
from backend.app.repositories.repositories import (
    create_attendance,
    get_attendance,
    get_scheduled_work_type,
)
from backend.app.schemas import AttendanceSubmission
from backend.app.services.services import summarize_attendance


router = APIRouter()


@router.get("/api/attendance", response_model=list[AttendanceRead])
async def attendance(
    start_date: date | None = None,
    end_date: date | None = None,
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> list[AttendanceRead]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must not be after end_date.")
    return await get_attendance(
        db, start_date=start_date, end_date=end_date, capability=capability, location=location
    )


@router.get("/api/attendance/summary")
async def attendance_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> dict[str, Any]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must not be after end_date.")
    records = await get_attendance(
        db, start_date=start_date, end_date=end_date, capability=capability, location=location
    )
    return summarize_attendance(records)


@router.get("/api/attendance/export")
async def export_attendance(
    start_date: date | None = None,
    end_date: date | None = None,
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> Response:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must not be after end_date.")
    rows = await get_attendance(
        db, start_date=start_date, end_date=end_date, capability=capability, location=location
    )
    return csv_response(
        rows,
        [
            ("Date", "date"),
            ("Employee ID", "employee_id"),
            ("Name", "first_name"),
            ("Capability", "capability"),
            ("Time in", "time_in"),
            ("Work type", "work_type"),
            ("Location", "location"),
            ("Status", "status"),
            ("RTO compliant", "rto_compliant"),
            ("Follow-up", "follow_up"),
        ],
        "benchflow-attendance.csv",
    )


@router.post("/api/attendance/check-in", status_code=status.HTTP_201_CREATED)
async def submit_check_in(
    payload: AttendanceSubmission,
    db: Database = Depends(get_db),
    principal: DemoPrincipal = USER,
) -> dict[str, Any]:
    if not principal.employee_id:
        raise HTTPException(status_code=403, detail="This account is not mapped to an employee.")
    now = datetime.now().astimezone()
    schedule = await get_scheduled_work_type(db, principal.employee_id, now.strftime("%A"))
    rto_compliant = (
        payload.work_type == "Onsite"
        if schedule is not None and schedule["work_type"] == "Onsite"
        else None
    )
    try:
        record = await create_attendance(
            db,
            employee_id=principal.employee_id,
            attendance_date=now.date(),
            time_in=now.isoformat(timespec="seconds"),
            work_type=payload.work_type,
            location=payload.location or (schedule["location"] if schedule else None),
            rto_compliant=rto_compliant,
        )
    except (aiosqlite.IntegrityError, asyncpg.UniqueViolationError) as error:
        raise HTTPException(
            status_code=409, detail="A check-in already exists for this employee and date."
        ) from error
    return record
