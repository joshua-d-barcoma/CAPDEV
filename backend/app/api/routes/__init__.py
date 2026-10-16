from fastapi import APIRouter

from backend.app.api.routes.action_items import router as action_items_router
from backend.app.api.routes.attendance import router as attendance_router
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.dashboards import router as dashboards_router
from backend.app.api.routes.employees import router as employees_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.learning import router as learning_router
from backend.app.api.routes.tasks import router as tasks_router
from backend.app.api.routes.ui import router as ui_router


router = APIRouter()
for feature_router in (
    health_router,
    auth_router,
    employees_router,
    dashboards_router,
    attendance_router,
    learning_router,
    action_items_router,
    tasks_router,
    ui_router,
):
    router.include_router(feature_router)
