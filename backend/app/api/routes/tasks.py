from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.routes.common import USER, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.models import TaskRead
from backend.app.repositories.repositories import (
    create_user_task,
    list_user_tasks,
    update_user_task_status,
)
from backend.app.schemas import TaskCreate, TaskStatusUpdate


router = APIRouter()


@router.get("/api/me/tasks", response_model=list[TaskRead])
async def personal_tasks(
    db: Database = Depends(get_db), principal: DemoPrincipal = USER
) -> list[TaskRead]:
    return await list_user_tasks(db, principal.employee_id or "")


@router.post("/api/me/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def add_personal_task(
    payload: TaskCreate,
    db: Database = Depends(get_db),
    principal: DemoPrincipal = USER,
) -> TaskRead:
    return await create_user_task(
        db,
        employee_id=principal.employee_id or "",
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority,
        category=payload.category,
    )


@router.patch("/api/me/tasks/{task_id}", response_model=TaskRead)
async def update_personal_task(
    task_id: str,
    payload: TaskStatusUpdate,
    db: Database = Depends(get_db),
    principal: DemoPrincipal = USER,
) -> TaskRead:
    task = await update_user_task_status(
        db, task_id, principal.employee_id or "", payload.status
    )
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found for the authenticated employee.")
    return task
