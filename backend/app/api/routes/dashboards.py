from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from backend.app.api.routes.common import ADMIN, USER, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.repositories.repositories import (
    get_attendance,
    get_employee,
    list_personal_training,
    list_user_tasks,
)
from backend.app.services.services import get_admin_dashboard, summarize_attendance


router = APIRouter()


@router.get("/api/dashboard/admin")
async def admin_dashboard(
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> dict[str, Any]:
    return await get_admin_dashboard(db, capability, location)


@router.get("/api/me/dashboard")
async def personal_dashboard(
    db: Database = Depends(get_db), principal: DemoPrincipal = USER
) -> dict[str, Any]:
    employee = await get_employee(db, principal.employee_id or "")
    if employee is None:
        raise HTTPException(status_code=404, detail="The demo account is not mapped to an employee.")
    training = await list_personal_training(db, employee["id"])
    tasks = await list_user_tasks(db, principal.employee_id or "")
    attendance = await get_attendance(db, employee_id=principal.employee_id)
    return {
        "employee": employee,
        "tasks": tasks,
        "training": training,
        "attendance": summarize_attendance(attendance),
        "recommendations": {
            "status": "unavailable",
            "items": [],
            "reason": "No AI recommendation provider is configured.",
        },
    }
