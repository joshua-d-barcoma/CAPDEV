import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.config import Settings, get_settings


_bearer = HTTPBearer(auto_error=False)
TOKEN_LIFETIME_SECONDS = 60 * 60


@dataclass(frozen=True)
class DemoPrincipal:
    username: str
    role: str
    employee_id: str | None


def _encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _signature(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest()
    return _encode(digest)


def create_token(principal: DemoPrincipal, secret: str, now: int | None = None) -> str:
    issued_at = int(time.time()) if now is None else now
    payload = _encode(
        json.dumps(
            {
                "sub": principal.username,
                "role": principal.role,
                "employee_id": principal.employee_id,
                "exp": issued_at + TOKEN_LIFETIME_SECONDS,
            },
            separators=(",", ":"),
        ).encode("utf-8")
    )
    return f"{payload}.{_signature(payload, secret)}"


def verify_token(token: str, secret: str, now: int | None = None) -> DemoPrincipal:
    try:
        payload, signature = token.split(".", 1)
        expected = _signature(payload, secret)
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid signature.")
        claims = json.loads(_decode(payload))
        current_time = int(time.time()) if now is None else now
        if not isinstance(claims.get("exp"), int) or claims["exp"] <= current_time:
            raise ValueError("Expired token.")
        if claims.get("role") not in {"admin", "user"}:
            raise ValueError("Invalid role.")
        if not isinstance(claims.get("sub"), str) or not claims["sub"]:
            raise ValueError("Invalid subject.")
        employee_id = claims.get("employee_id")
        if employee_id is not None and not isinstance(employee_id, str):
            raise ValueError("Invalid employee identity.")
        return DemoPrincipal(claims["sub"], claims["role"], employee_id)
    except (ValueError, TypeError, KeyError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(status_code=401, detail="Invalid or expired demo access token.") from error


def authenticate_demo_account(username: str, password: str, settings: Settings) -> DemoPrincipal:
    if not settings.app_secret_key:
        raise HTTPException(status_code=503, detail="Demo authentication is not configured.")
    accounts = (
        (
            settings.demo_admin_username,
            settings.demo_admin_password,
            "admin",
            settings.demo_admin_employee_id or None,
        ),
        (
            settings.demo_user_username,
            settings.demo_user_password,
            "user",
            settings.demo_user_employee_id or None,
        ),
    )
    for expected_username, expected_password, role, employee_id in accounts:
        if (
            expected_password
            and hmac.compare_digest(username, expected_username)
            and hmac.compare_digest(password, expected_password)
        ):
            if not employee_id:
                setting_name = (
                    "DEMO_ADMIN_EMPLOYEE_ID" if role == "admin" else "DEMO_USER_EMPLOYEE_ID"
                )
                raise HTTPException(
                    status_code=503,
                    detail=f"{setting_name} must be configured for the demo account.",
                )
            return DemoPrincipal(expected_username, role, employee_id)
    raise HTTPException(status_code=401, detail="Invalid demo username or password.")


async def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> DemoPrincipal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer authentication is required.")
    if not settings.app_secret_key:
        raise HTTPException(status_code=503, detail="Demo authentication is not configured.")
    return verify_token(credentials.credentials, settings.app_secret_key)


def require_role(role: str):
    async def check_role(principal: DemoPrincipal = Depends(current_principal)) -> DemoPrincipal:
        if principal.role != role:
            raise HTTPException(status_code=403, detail="This demo account cannot access this resource.")
        return principal

    return check_role
