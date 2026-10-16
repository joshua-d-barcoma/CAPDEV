import asyncio
import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import aiosqlite
import asyncpg


_PARAMETER = re.compile(r"\$(\d+)")


def _sqlite_statement(statement: str, values: tuple[Any, ...]) -> tuple[str, tuple[Any, ...]]:
    indexes = [int(index) for index in _PARAMETER.findall(statement)]
    if any(index < 1 or index > len(values) for index in indexes):
        raise ValueError("SQL parameter index does not match supplied values.")
    return _PARAMETER.sub("?", statement), tuple(values[index - 1] for index in indexes)


class Database:
    def __init__(self, url: str) -> None:
        self.url = url
        self._sqlite: aiosqlite.Connection | None = None
        self._sqlite_lock = asyncio.Lock()
        self._postgres: asyncpg.Pool | None = None

    @property
    def is_sqlite(self) -> bool:
        return self.url.startswith("sqlite:///")

    async def connect(self) -> None:
        if self.is_sqlite:
            raw_path = unquote(self.url.removeprefix("sqlite:///"))
            if len(raw_path) > 2 and raw_path[0] == "/" and raw_path[2] == ":":
                raw_path = raw_path[1:]
            if raw_path == ":memory:":
                path = raw_path
            else:
                path = str(Path(raw_path).resolve())
            self._sqlite = await aiosqlite.connect(path)
            self._sqlite.row_factory = aiosqlite.Row
            await self._sqlite.execute("PRAGMA foreign_keys = ON")
            return
        if self.url.startswith("postgres://"):
            self.url = self.url.replace("postgres://", "postgresql://", 1)
        if not self.url.startswith("postgresql://"):
            raise ValueError("DATABASE_URL must use sqlite:/// or postgresql://.")
        self._postgres = await asyncpg.create_pool(self.url, min_size=1, max_size=10)

    async def close(self) -> None:
        if self._sqlite is not None:
            await self._sqlite.close()
            self._sqlite = None
        if self._postgres is not None:
            await self._postgres.close()
            self._postgres = None

    async def fetch(self, statement: str, *values: Any) -> list[dict[str, Any]]:
        if self._sqlite is not None:
            query, parameters = _sqlite_statement(statement, values)
            async with self._sqlite_lock:
                cursor = await self._sqlite.execute(query, parameters)
                return [dict(row) for row in await cursor.fetchall()]
        if self._postgres is not None:
            async with self._postgres.acquire() as connection:
                return [dict(row) for row in await connection.fetch(statement, *values)]
        raise RuntimeError("Database has not been connected.")

    async def fetchrow(self, statement: str, *values: Any) -> dict[str, Any] | None:
        if self._sqlite is not None:
            query, parameters = _sqlite_statement(statement, values)
            async with self._sqlite_lock:
                cursor = await self._sqlite.execute(query, parameters)
                row = await cursor.fetchone()
                return dict(row) if row is not None else None
        if self._postgres is not None:
            async with self._postgres.acquire() as connection:
                row = await connection.fetchrow(statement, *values)
                return dict(row) if row is not None else None
        raise RuntimeError("Database has not been connected.")

    async def fetchval(self, statement: str, *values: Any) -> Any:
        if self._sqlite is not None:
            query, parameters = _sqlite_statement(statement, values)
            async with self._sqlite_lock:
                cursor = await self._sqlite.execute(query, parameters)
                row = await cursor.fetchone()
                return row[0] if row is not None else None
        if self._postgres is not None:
            async with self._postgres.acquire() as connection:
                return await connection.fetchval(statement, *values)
        raise RuntimeError("Database has not been connected.")
