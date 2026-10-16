# BenchFlow backend

This folder contains the FastAPI API and a standalone UI example. It does not modify or serve files from `frontend/`.

## Run locally (Windows PowerShell)

Run these commands from the repository root (the folder containing `backend` and `frontend`). The app entry point is `backend/app/main.py`, so the Uvicorn target is `backend.app.main:app`, not `main:app`.

1. Create and activate a virtual environment. Python 3.13 is recommended:

   ```powershell
   py -3.13 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal and activate again. Alternatively, skip activation and use `.venv\Scripts\python.exe` instead of `python` in the commands below.

2. Install the backend runtime packages:

   ```powershell
   python -m pip install -r backend\requirements.txt
   ```

3. Create the backend environment file if you have not already:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Generate an `APP_SECRET_KEY` and put it in `backend\.env`:

   ```powershell
   $secret = python -c "import secrets; print(secrets.token_urlsafe(48))"
   Add-Content -Path backend\.env -Value "APP_SECRET_KEY=$secret"
   ```

   If `APP_SECRET_KEY` is already present in the file, edit that line instead of adding a duplicate. The demo users are `user` (Juan Marcos Garcia) and `admin` (Karoline Cayetano); both demo cards sign in with the local demo password `bench-flow-portal`.

4. Apply the SQLite app-owned migration once (and again after adding future migrations). This creates tables for demo tasks, attendance, schedules, and action items. It does not create or seed the existing employee database:

   ```powershell
   python -c "import sqlite3; from pathlib import Path; db=sqlite3.connect('backend/db/capdev_portal.db'); db.executescript(Path('backend/db/migrations/sqlite/001_app_owned_data.sql').read_text(encoding='utf-8')); db.close()"
   ```

   If using PostgreSQL instead, set `DATABASE_URL` in `backend\.env` to your PostgreSQL DSN and apply `backend/db/migrations/postgres/001_app_owned_data.sql` with `psql`. The existing schema and compatibility views must already be installed for either database. Migrations are not run automatically at application startup.

5. Start the development server with automatic reload:

   ```powershell
   python -m uvicorn backend.app.main:app --reload
   ```

6. Browse to:
   - Sign in: <http://127.0.0.1:8000/login>
   - API documentation: <http://127.0.0.1:8000/docs>

   Stop the server with **Ctrl+C** in the terminal.

The two local demo accounts have fixed roles and employee mappings: `user` uses Juan Marcos Garcia (`DEMO_USER_EMPLOYEE_ID=juan.marcos.g`) and `admin` uses Karoline Cayetano (`DEMO_ADMIN_EMPLOYEE_ID=karoline.s.cayetano`). Both use the shared demo-only password `bench-flow-portal`, which is also prefilled by the account buttons and must match the configured `DEMO_ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` values. Each employee ID must match the `employee_id` exposed by the `workers` compatibility view. Change the password and secret, or disable the demo accounts, before exposing the service beyond a trusted local environment. The signed bearer token is a local demonstration mechanism, not a substitute for an identity provider in production.

## UI example pages

Runtime code follows a package layout: `backend/app/api/routes/` contains feature-specific route modules for authentication, employees, dashboards, attendance, learning, action items, personal tasks, health, and UI pages. Shared API helpers live alongside them in `common.py`; `backend/app/core/`, `models/`, `repositories/`, `schemas/`, and `services/` keep their respective responsibilities. Templates and static assets live in `backend/app/templates/` and `backend/app/static/`; database assets and migrations stay in `backend/db/`, and tests remain in `backend/tests/`. API response models live under `models/`, request validation models under `schemas/`, and application startup under `backend/app/main.py`.

Pages are rendered from `backend/app/templates/` and share CSS/JavaScript in `backend/app/static/`. Their navigation, colors, header, page headings, stat cards, panels, status badges, and responsive layout follow the frontend prototype styling. Sign in at `/login`; after signing in, feature pages use role-specific paths:

Admin pages use `/admin/<page>` (`/admin/dashboard`, `/admin/employees`, `/admin/attendance`, `/admin/learning`, `/admin/action-items`, `/admin/productivity`, and `/admin/employee-profile`). User pages use `/u/<page>` (`/u/dashboard`, `/u/tasks`, `/u/calendar`, `/u/history`, `/u/skill-hub`, and `/u/time-entry`).

The examples call the backend APIs and require the demo bearer token. API authorization comes from the token role; navigating to another page or changing a client-side role does not grant permissions.

## API behavior and data limitations

- Employee and training reads use the existing `workers`, `worker_skills`, `training_catalog`, and `worker_trainings` compatibility views.
- Workday-sourced training status is read-only. Training applicability administration writes to `cfg_training_applicability`.
- Generic user tasks, admin action items, employee schedules, and attendance are application-owned tables created by the explicit migration.
- Attendance is a self-reported demo check-in, not proof of presence or a validated time policy. Tardy and absence metrics remain `null`/unavailable because the supplied schema has no validated time-in threshold or absence source. RTO compliance is counted only on scheduled onsite days; schedules for work-from-home days are excluded.
- Readiness uses the latest persisted `fact_ready_snapshot` per employee. A snapshot older than 90 days is reported as stale but remains in the latest-snapshot eligible-rate denominator; missing snapshots are excluded from the rate and counted separately. The API does not synthesize readiness.
- Recommendations return an explicit `unavailable` status until an approved provider and credentials are configured.
- The role/identity setup is intended for local demo use. Configure a production identity provider, authorization mappings, secrets, CORS, and deployment controls before exposing this service.

## Tests

From the repository root, install development dependencies with `python -m pip install -r backend/requirements-dev.txt`, then run `python -m pytest backend/tests`.
