from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes import router
from backend.app.core.config import get_settings
from backend.app.core.database import Database


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    database = Database(get_settings().database_url)
    await database.connect()
    application.state.db = database
    try:
        yield
    finally:
        await database.close()


app = FastAPI(
    title="BenchFlow API",
    version="0.1.0",
    description="Demo API and server-rendered feature templates for BenchFlow.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_settings().cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
app.mount(
    "/static",
    StaticFiles(directory=str(Path(__file__).parent / "static")),
    name="static",
)
app.include_router(router)
