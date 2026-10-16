import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    database_url: str
    app_secret_key: str
    demo_admin_username: str
    demo_admin_password: str
    demo_user_username: str
    demo_user_password: str
    demo_user_employee_id: str
    cors_origins: tuple[str, ...]
    demo_admin_employee_id: str = ""


def get_settings() -> Settings:
    default_db = (BACKEND_DIR / "db" / "capdev_portal.db").as_posix()
    settings = Settings(
        database_url=os.getenv("DATABASE_URL", f"sqlite:///{default_db}"),
        app_secret_key=os.getenv("APP_SECRET_KEY", ""),
        demo_admin_username=os.getenv("DEMO_ADMIN_USERNAME", "admin"),
        demo_admin_password=os.getenv("DEMO_ADMIN_PASSWORD", ""),
        demo_user_username=os.getenv("DEMO_USER_USERNAME", "user"),
        demo_user_password=os.getenv("DEMO_USER_PASSWORD", ""),
        demo_user_employee_id=os.getenv("DEMO_USER_EMPLOYEE_ID", ""),
        demo_admin_employee_id=os.getenv("DEMO_ADMIN_EMPLOYEE_ID", ""),
        cors_origins=tuple(
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ),
    )
    if settings.app_secret_key and len(settings.app_secret_key) < 32:
        raise ValueError("APP_SECRET_KEY must contain at least 32 characters.")
    return settings
