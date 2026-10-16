from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from backend.app.api.routes.common import ADMIN, csv_response, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.models import EmployeeRead
from backend.app.repositories.repositories import get_employee, list_employees, save_schedule
from backend.app.schemas import ScheduleUpdate


router = APIRouter()


@router.get("/api/employees", response_model=list[EmployeeRead])
async def employees(
    capability: str | None = None,
    bench_status: str | None = None,
    career_level: str | None = None,
    location: str | None = None,
    skill: str | None = None,
    readiness_filter: Literal["eligible", "not_eligible", "missing"] | None = Query(
        default=None, alias="readiness"
    ),
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> list[EmployeeRead]:
    return await list_employees(
        db,
        capability=capability,
        bench_status=bench_status,
        career_level=career_level,
        location=location,
        skill=skill,
        readiness=readiness_filter,
    )


@router.get("/api/employees/export")
async def export_employees(
    capability: str | None = None,
    bench_status: str | None = None,
    career_level: str | None = None,
    location: str | None = None,
    skill: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> Response:
    rows = await list_employees(
        db,
        capability=capability,
        bench_status=bench_status,
        career_level=career_level,
        location=location,
        skill=skill,
    )
    return csv_response(
        rows,
        [
            ("Employee ID", "employee_id"),
            ("First name", "first_name"),
            ("Last name", "last_name"),
            ("Career level", "management_level"),
            ("Capability", "capability_area"),
            ("Location", "location"),
            ("Status", "activity_type"),
            ("Skills", "skills"),
        ],
        "benchflow-employees.csv",
    )


@router.get("/api/employees/{employee_id}", response_model=EmployeeRead)
async def employee_detail(
    employee_id: str,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> EmployeeRead:
    employee = await get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return employee


@router.put("/api/employees/{employee_id}/schedule")
async def update_schedule(
    employee_id: str,
    payload: ScheduleUpdate,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> dict:
    employee = await get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return await save_schedule(
        db,
        employee_id=employee["employee_id"],
        weekday=payload.weekday,
        work_type=payload.work_type,
        location=payload.location,
    )
