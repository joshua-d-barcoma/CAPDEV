from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.auth import (
    DemoPrincipal,
    authenticate_demo_account,
    create_token,
    current_principal,
)
from backend.app.api.routes.common import get_db
from backend.app.core.config import Settings, get_settings
from backend.app.core.database import Database
from backend.app.repositories.repositories import get_employee
from backend.app.schemas import LoginRequest


router = APIRouter()


async def _display_name(principal: DemoPrincipal, db: Database) -> str:
    employee = await get_employee(db, principal.employee_id or "")
    if employee is None:
        raise HTTPException(
            status_code=503,
            detail=f"The employee record for the {principal.role} demo account was not found.",
        )
    return f"{employee['first_name']} {employee['last_name']}"


@router.post("/api/auth/login")
async def login(
    payload: LoginRequest,
    settings: Settings = Depends(get_settings),
    db: Database = Depends(get_db),
) -> dict[str, Any]:
    principal = authenticate_demo_account(payload.username, payload.password, settings)
    display_name = await _display_name(principal, db)
    return {
        "access_token": create_token(principal, settings.app_secret_key),
        "token_type": "bearer",
        "expires_in": 3600,
        "user": {
            "username": principal.username,
            "role": principal.role,
            "employee_id": principal.employee_id,
            "display_name": display_name,
        },
    }


@router.get("/api/auth/me")
async def who_am_i(
    principal: DemoPrincipal = Depends(current_principal),
    db: Database = Depends(get_db),
) -> dict[str, Any]:
    return {
        "username": principal.username,
        "role": principal.role,
        "employee_id": principal.employee_id,
        "display_name": await _display_name(principal, db),
    }
