import asyncpg
import aiosqlite

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse


router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness(request: Request) -> JSONResponse:
    try:
        await request.app.state.db.fetchval("SELECT COUNT(*) FROM workers")
    except (asyncpg.PostgresError, aiosqlite.Error):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "detail": "Database or compatibility views are unavailable."},
        )
    return JSONResponse(content={"status": "ready"})
