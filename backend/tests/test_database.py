import asyncio

from backend.app.core.database import Database, _sqlite_statement


def test_sqlite_parameter_adapter_preserves_index_order_and_reuse() -> None:
    statement, values = _sqlite_statement(
        "SELECT $2, $1, $2",
        ("first", "second"),
    )
    assert statement == "SELECT ?, ?, ?"
    assert values == ("second", "first", "second")


def test_sqlite_database_runs_parameterized_queries() -> None:
    async def query() -> int:
        database = Database("sqlite:///:memory:")
        await database.connect()
        try:
            return await database.fetchval("SELECT $1 + $2", 20, 22)
        finally:
            await database.close()

    assert asyncio.run(query()) == 42
