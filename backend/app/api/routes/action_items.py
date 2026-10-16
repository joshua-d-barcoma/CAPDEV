from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.routes.common import ADMIN, get_db
from backend.app.core.auth import DemoPrincipal
from backend.app.core.database import Database
from backend.app.models import ActionItemRead
from backend.app.repositories.repositories import (
    create_action_item,
    list_action_items,
    update_action_item_status,
)
from backend.app.schemas import ActionItemCreate, ActionItemStatusUpdate


router = APIRouter()


@router.get("/api/action-items", response_model=list[ActionItemRead])
async def action_items(
    db: Database = Depends(get_db), _: DemoPrincipal = ADMIN
) -> list[ActionItemRead]:
    return await list_action_items(db)


@router.post(
    "/api/action-items",
    response_model=ActionItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_action_item(
    payload: ActionItemCreate,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> ActionItemRead:
    return await create_action_item(
        db,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        owner=payload.owner,
        due_date=payload.due_date,
        priority=payload.priority,
    )


@router.patch("/api/action-items/{item_id}", response_model=ActionItemRead)
async def update_action_item(
    item_id: str,
    payload: ActionItemStatusUpdate,
    db: Database = Depends(get_db),
    _: DemoPrincipal = ADMIN,
) -> ActionItemRead:
    item = await update_action_item_status(db, item_id, payload.status)
    if item is None:
        raise HTTPException(status_code=404, detail="Action item not found.")
    return item
