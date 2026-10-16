import shutil
import sqlite3
from datetime import date, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


def test_openapi_groups_endpoints_by_feature() -> None:
    schema = app.openapi()
    operations = [
        operation
        for path_item in schema["paths"].values()
        for operation in path_item.values()
        if isinstance(operation, dict) and "responses" in operation
    ]

    assert operations
    assert all(len(operation.get("tags", [])) == 1 for operation in operations)
    assert {operation["tags"][0] for operation in operations} == {
        "Action Items",
        "Attendance",
        "Authentication",
        "Dashboards",
        "Employees",
        "Health",
        "Learning",
        "Tasks",
        "UI Pages",
    }


@pytest.fixture
def demo_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    backend_root = Path(__file__).resolve().parents[1]
    database_path = tmp_path / "benchflow-test.db"
    shutil.copy2(backend_root / "db" / "capdev_portal.db", database_path)
    connection = sqlite3.connect(database_path)
    try:
        migration_path = backend_root / "db" / "migrations" / "sqlite" / "001_app_owned_data.sql"
        connection.executescript(migration_path.read_text(encoding="utf-8"))
        employee_ids = {
            (first_name, last_name): employee_id
            for employee_id, first_name, last_name in connection.execute(
                "SELECT employee_id, first_name, last_name FROM workers "
                "WHERE (first_name = 'Juan' AND last_name = 'Marcos Garcia') "
                "OR (first_name = 'Karoline' AND last_name = 'Cayetano')"
            )
        }
        employee_id = employee_ids[("Juan", "Marcos Garcia")]
        admin_employee_id = employee_ids[("Karoline", "Cayetano")]
    finally:
        connection.close()

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")
    monkeypatch.setenv("APP_SECRET_KEY", "integration-test-secret-with-more-than-32-chars")
    monkeypatch.setenv("DEMO_ADMIN_PASSWORD", "integration-admin-password")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "integration-user-password")
    monkeypatch.setenv("DEMO_USER_EMPLOYEE_ID", employee_id)
    monkeypatch.setenv("DEMO_ADMIN_EMPLOYEE_ID", admin_employee_id)
    with TestClient(app) as client:
        yield client, employee_id


def test_api_auth_filters_and_user_scoping(demo_client) -> None:
    client, employee_id = demo_client
    admin_login = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "integration-admin-password"},
    )
    user_login = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "integration-user-password"},
    )
    assert admin_login.status_code == 200
    assert user_login.status_code == 200
    assert admin_login.json()["user"]["display_name"] == "Karoline Cayetano"
    assert admin_login.json()["user"]["employee_id"] == "karoline.s.cayetano"
    assert user_login.json()["user"]["display_name"] == "Juan Marcos Garcia"
    assert user_login.json()["user"]["employee_id"] == "juan.marcos.g"
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    user_headers = {"Authorization": f"Bearer {user_login.json()['access_token']}"}
    assert client.get("/api/auth/me", headers=admin_headers).json()["display_name"] == "Karoline Cayetano"
    assert client.get("/api/auth/me", headers=user_headers).json()["display_name"] == "Juan Marcos Garcia"

    employee_response = client.get("/api/employees", headers=admin_headers)
    assert employee_response.status_code == 200
    employee = next(row for row in employee_response.json() if row["employee_id"] == employee_id)
    for key, value in (
        ("capability", employee["capability_area"]),
        ("location", employee["location"]),
        ("career_level", str(employee["management_level"])),
        ("bench_status", employee["activity_type"]),
        ("skill", employee["skills"][0]),
    ):
        response = client.get("/api/employees", params={key: value}, headers=admin_headers)
        assert response.status_code == 200
        assert any(row["employee_id"] == employee_id for row in response.json())
    for readiness_filter in ("eligible", "not_eligible", "missing"):
        response = client.get(
            "/api/employees",
            params={"readiness": readiness_filter},
            headers=admin_headers,
        )
        assert response.status_code == 200

    assert client.get("/api/dashboard/admin", headers=admin_headers).status_code == 200
    assert client.get("/api/learning", headers=admin_headers).status_code == 200
    assert client.get("/api/me/dashboard", headers=user_headers).json()["recommendations"]["status"] == "unavailable"
    assert client.get("/api/me/tasks", headers=admin_headers).status_code == 403


def test_app_owned_writes_and_rto_schedule(demo_client) -> None:
    client, employee_id = demo_client
    admin_token = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "integration-admin-password"},
    ).json()["access_token"]
    user_token = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "integration-user-password"},
    ).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {user_token}"}

    task = client.post(
        "/api/me/tasks", headers=user_headers, json={"title": "Personal integration task"}
    )
    assert task.status_code == 201
    task_id = task.json()["id"]
    assert client.patch(
        f"/api/me/tasks/{task_id}", headers=user_headers, json={"status": "Completed"}
    ).status_code == 200
    assert client.patch(
        f"/api/me/tasks/{task_id}", headers=admin_headers, json={"status": "Completed"}
    ).status_code == 403

    weekday = date.today().strftime("%A")
    schedule = client.put(
        f"/api/employees/{employee_id}/schedule",
        headers=admin_headers,
        json={"weekday": weekday, "work_type": "Onsite"},
    )
    assert schedule.status_code == 200
    check_in = client.post(
        "/api/attendance/check-in",
        headers=user_headers,
        json={"work_type": "Work from home"},
    )
    assert check_in.status_code == 201
    assert check_in.json()["rto_compliant"] == 0
    assert client.post(
        "/api/attendance/check-in",
        headers=user_headers,
        json={"work_type": "Onsite"},
    ).status_code == 409
    attendance = client.get(
        "/api/attendance",
        params={"start_date": date.today().isoformat(), "end_date": date.today().isoformat()},
        headers=admin_headers,
    )
    assert attendance.status_code == 200
    assert attendance.json()[0]["employee_id"] == employee_id

    action = client.post(
        "/api/action-items",
        headers=admin_headers,
        json={"title": "Integration follow-up", "category": "Training", "owner": "Admin"},
    )
    assert action.status_code == 201
    assert client.patch(
        f"/api/action-items/{action.json()['id']}",
        headers=admin_headers,
        json={"status": "Done"},
    ).status_code == 200

    applicability = client.post(
        "/api/learning/applicability",
        headers=admin_headers,
        json={
            "course_id": 1,
            "population_rule": "All employees",
            "effective_from": datetime.now().date().isoformat(),
        },
    )
    assert applicability.status_code == 201
    assert client.get("/api/learning/applicability", headers=admin_headers).status_code == 200
