from datetime import date

from backend.app.services.services import summarize_attendance, summarize_readiness


def test_attendance_summary_keeps_unsupported_signals_unavailable() -> None:
    result = summarize_attendance(
        [
            {"status": "Present", "rto_compliant": 1, "follow_up": 0},
            {"status": "Present", "rto_compliant": None, "follow_up": 0},
            {"status": "Absent", "rto_compliant": 0, "follow_up": 1},
        ]
    )

    assert result["records"] == 3
    assert result["present"] == 2
    assert result["absences"] == 1
    assert result["tardy"] is None
    assert result["rto_compliant"] == 1
    assert result["rto_non_compliant"] == 1
    assert result["rto_compliance_rate"] == 50.0
    assert result["follow_up"] == 1


def test_readiness_uses_latest_snapshot_and_counts_missing_and_stale() -> None:
    employees = [{"id": 1}, {"id": 2}, {"id": 3}]
    snapshots = [
        {
            "worker_id": 1,
            "snapshot_date_key": 20260101,
            "is_ranking_eligible": True,
            "full_date": "2026-01-01",
        },
        {
            "worker_id": 1,
            "snapshot_date_key": 20261001,
            "is_ranking_eligible": False,
            "full_date": "2026-10-01",
        },
        {
            "worker_id": 2,
            "snapshot_date_key": 20260101,
            "is_ranking_eligible": True,
            "full_date": "2026-01-01",
        },
    ]

    result = summarize_readiness(employees, snapshots, today=date(2026, 10, 16))

    assert result["eligible"] == 1
    assert result["snapshot_count"] == 2
    assert result["missing_snapshots"] == 1
    assert result["stale_snapshots"] == 1
    assert result["latest_snapshot_date"] == "2026-10-01"
