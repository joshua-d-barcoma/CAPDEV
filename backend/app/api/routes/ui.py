from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parents[2] / "templates"))
ADMIN_PAGES = {
    "dashboard": "admin-dashboard",
    "employees": "employees",
    "attendance": "attendance",
    "learning": "learning",
    "action-items": "action-items",
    "productivity": "productivity",
    "employee-profile": "employee-profile",
}
USER_PAGES = {
    "dashboard": "user-dashboard",
    "tasks": "tasks",
    "calendar": "calendar",
    "history": "history",
    "skill-hub": "skill-hub",
    "time-entry": "time-entry",
}


async def render_feature_page(
    request: Request, page_name: str, pages: dict[str, str]
) -> HTMLResponse:
    template_name = pages.get(page_name)
    if template_name is None:
        raise HTTPException(status_code=404, detail="UI feature page not found.")
    return templates.TemplateResponse(
        request=request,
        name=f"{template_name}.html",
        context={"page_name": template_name.replace("-", " ").title()},
    )


@router.get("/admin/{page_name}", response_class=HTMLResponse)
async def admin_page(request: Request, page_name: str) -> HTMLResponse:
    return await render_feature_page(request, page_name, ADMIN_PAGES)


@router.get("/u/{page_name}", response_class=HTMLResponse)
async def user_page(request: Request, page_name: str) -> HTMLResponse:
    return await render_feature_page(request, page_name, USER_PAGES)


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"page_name": "Demo sign in"},
    )


@router.get("/", response_class=HTMLResponse)
async def ui_home(request: Request) -> HTMLResponse:
    return await login_page(request)
