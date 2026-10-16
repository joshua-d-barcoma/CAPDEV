import pytest
from fastapi import HTTPException

from backend.app.core.auth import (
    DemoPrincipal,
    authenticate_demo_account,
    create_token,
    verify_token,
)
from backend.app.core.config import Settings


def test_token_round_trip_and_expiration() -> None:
    principal = DemoPrincipal("demo-user", "user", "EMP-1")
    token = create_token(principal, "x" * 32, now=1000)

    assert verify_token(token, "x" * 32, now=1001) == principal
    with pytest.raises(HTTPException) as error:
        verify_token(token, "x" * 32, now=1000 + 3600)
    assert error.value.status_code == 401


def test_token_signature_cannot_be_changed() -> None:
    token = create_token(DemoPrincipal("demo-admin", "admin", None), "x" * 32, now=1000)
    payload, signature = token.split(".", 1)

    with pytest.raises(HTTPException):
        verify_token(f"{payload}.{signature[:-1]}x", "x" * 32, now=1001)


def test_login_role_is_bound_to_configured_account() -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        app_secret_key="s" * 32,
        demo_admin_username="admin",
        demo_admin_password="admin-secret",
        demo_user_username="user",
        demo_user_password="user-secret",
        demo_user_employee_id="EMP-1",
        cors_origins=(),
        demo_admin_employee_id="EMP-2",
    )

    admin = authenticate_demo_account("admin", "admin-secret", settings)
    user = authenticate_demo_account("user", "user-secret", settings)
    assert (admin.role, admin.employee_id) == ("admin", "EMP-2")
    assert (user.role, user.employee_id) == ("user", "EMP-1")
    with pytest.raises(HTTPException) as error:
        authenticate_demo_account("admin", "user-secret", settings)
    assert error.value.status_code == 401


def test_user_login_requires_employee_mapping() -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        app_secret_key="s" * 32,
        demo_admin_username="admin",
        demo_admin_password="admin-secret",
        demo_user_username="user",
        demo_user_password="user-secret",
        demo_user_employee_id="",
        cors_origins=(),
        demo_admin_employee_id="EMP-2",
    )

    with pytest.raises(HTTPException) as error:
        authenticate_demo_account("user", "user-secret", settings)
    assert error.value.status_code == 503


def test_admin_login_requires_employee_mapping() -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        app_secret_key="s" * 32,
        demo_admin_username="admin",
        demo_admin_password="admin-secret",
        demo_user_username="user",
        demo_user_password="user-secret",
        demo_user_employee_id="EMP-1",
        cors_origins=(),
    )

    with pytest.raises(HTTPException) as error:
        authenticate_demo_account("admin", "admin-secret", settings)
    assert error.value.status_code == 503
