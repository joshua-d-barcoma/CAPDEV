from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from backend.app.api.routes.common import ADMIN, csv_response, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.models import TrainingApplicabilityRead
from backend.app.repositories.repositories import (
    create_training_applicability,
    get_training_summary,
    list_training_applicability,
    list_training_report,
)
from backend.app.schemas import TrainingApplicabilityUpdate


router = APIRouter()


@router.get("/api/learning")
async def learning_summary(
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> dict[str, Any]:
    summary = await get_training_summary(db, capability, location)
    total = int(summary["total_assignments"] or 0)
    completed = int(summary["completed"] or 0)
    return {
        "summary": {
            **summary,
            "total_assignments": total,
            "completed": completed,
            "completion_rate": round(completed / total * 100, 1) if total else None,
        },
        "records": await list_training_report(db, capability, location),
        "workday_status_is_read_only": True,
    }


@router.get("/api/learning/export")
async def export_learning(
    capability: str | None = None,
    location: str | None = None,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> Response:
    rows = await list_training_report(db, capability, location)
    return csv_response(
        rows,
        [
            ("Employee ID", "employee_id"),
            ("First name", "first_name"),
            ("Last name", "last_name"),
            ("Capability", "capability_area"),
            ("Location", "location"),
            ("Training", "training_name"),
            ("Category", "category"),
            ("Due date", "due_date"),
            ("Status", "status"),
            ("Progress", "progress_pct"),
            ("Completion date", "completion_date"),
        ],
        "benchflow-learning.csv",
    )


@router.get("/api/learning/applicability", response_model=list[TrainingApplicabilityRead])
async def training_applicability(
    db: Database = Depends(get_db), _: DemoPrincipal = ADMIN
) -> list[TrainingApplicabilityRead]:
    return await list_training_applicability(db)


@router.post(
    "/api/learning/applicability",
    response_model=TrainingApplicabilityRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_training_applicability(
    payload: TrainingApplicabilityUpdate,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> TrainingApplicabilityRead:
    if payload.effective_to and payload.effective_to < payload.effective_from:
        raise HTTPException(status_code=422, detail="effective_to must not be before effective_from.")
    course_key = "CourseKey" if db.is_sqlite else "course_key"
    exists = await db.fetchval(
        f"SELECT EXISTS(SELECT 1 FROM dim_course WHERE {course_key} = $1)", payload.course_id
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Training course not found.")
    return await create_training_applicability(
        db,
        course_id=payload.course_id,
        population_rule=payload.population_rule,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
    )
