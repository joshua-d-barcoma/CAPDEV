from fastapi.testclient import TestClient

from backend.app.main import app


def test_all_feature_templates_are_served() -> None:
    pages = (
        "admin-dashboard",
        "employees",
        "attendance",
        "learning",
        "action-items",
        "user-dashboard",
        "tasks",
        "employee-profile",
        "calendar",
        "history",
        "productivity",
        "skill-hub",
        "time-entry",
    )
    with TestClient(app) as client:
        for login_path in ("/", "/login"):
            login_page = client.get(login_path)
            assert login_page.status_code == 200
            assert 'class="login-page"' in login_page.text
            assert 'class="login-card panel"' in login_page.text
            assert login_page.text.count('data-demo-username=') == 2
            assert 'data-demo-username="user"' in login_page.text
            assert 'data-demo-username="admin"' in login_page.text
            assert "<strong>Juan Marcos Garcia</strong>" in login_page.text
            assert "<strong>Karoline Cayetano</strong>" in login_page.text
        assert client.get("/ui/login").status_code == 404
        assert client.get("/ui/employees").status_code == 404
        assert client.get("/u/employees").status_code == 404
        assert client.get("/admin/tasks").status_code == 404
        page_routes = {
            "admin-dashboard": "/admin/dashboard",
            "employees": "/admin/employees",
            "attendance": "/admin/attendance",
            "learning": "/admin/learning",
            "action-items": "/admin/action-items",
            "user-dashboard": "/u/dashboard",
            "tasks": "/u/tasks",
            "employee-profile": "/admin/employee-profile",
            "calendar": "/u/calendar",
            "history": "/u/history",
            "productivity": "/admin/productivity",
            "skill-hub": "/u/skill-hub",
            "time-entry": "/u/time-entry",
        }
        for page in pages:
            response = client.get(page_routes[page])
            assert response.status_code == 200
            assert 'class="app-layout"' in response.text
            assert 'class="sidebar"' in response.text
            assert 'class="page-content"' in response.text
        stylesheet = client.get("/static/app.css")
        assert stylesheet.status_code == 200
        assert "--purple-dark: #32094d" in stylesheet.text
        assert "background: #0d0a12" in stylesheet.text
        assert ".stat-card" in stylesheet.text
        assert client.get("/static/app.js").status_code == 200
