import csv
import io
from typing import Any

from fastapi import Depends, Request
from fastapi.responses import Response

from backend.app.core.auth import require_role
from backend.app.core.database import Database


ADMIN = Depends(require_role("admin"))
USER = Depends(require_role("user"))


def get_db(request: Request) -> Database:
    return request.app.state.db


def csv_response(
    rows: list[dict[str, Any]], columns: list[tuple[str, str]], filename: str
) -> Response:
    stream = io.StringIO(newline="")
    writer = csv.writer(stream)
    writer.writerow([label for label, _ in columns])
    for row in rows:
        writer.writerow([row.get(key) for _, key in columns])
    return Response(
        content=stream.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
