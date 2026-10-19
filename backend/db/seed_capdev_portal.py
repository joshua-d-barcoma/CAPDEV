#!/usr/bin/env python3
"""CapDev Portal — dummy-data seeder for the target star schema.

Populates ready-portal/db/capdev_portal.db (built by build_capdev_portal_db.py)
with realistic dummy data across every layer:

    staging  →  dims  →  bridges  →  facts  →  config  →  ui compat tables

Run:
    python db/build_capdev_portal_db.py     # once, to (re)create schema + views
    python db/seed_capdev_portal.py         # anytime — idempotent

Idempotent: existing rows are cleared in FK-safe order before insert.

PEOPLE ordering is deliberate — PersonKey 1/2/3 must be Juan/Karoline/Oscar
because the portal's demo-user switcher hardcodes those IDs.
"""
from __future__ import annotations

import sqlite3
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

HERE      = Path(__file__).resolve().parent
DB_PATH   = HERE / "capdev_portal.db"

NOW_UTC   = datetime.now(timezone.utc).isoformat(timespec="seconds")
SNAPSHOT  = "2026-09-01"

RULE_VERSION = "READY-v0.1-dummy"


# ═════════════════════════════════════════════════════════════════════════════
#  REFERENCE POOLS
# ═════════════════════════════════════════════════════════════════════════════

CAPABILITIES = [
    "Cloud Transformation",
    "Service Management",
    "SRE",
    "Digital Workplace",
    "FinOps",
    "Hybrid Cloud Ops",
]

SKILLS = [
    ("SK-001", "Microsoft Azure PaaS",             "Cloud"),
    ("SK-002", "Azure DevOps",                     "DevOps"),
    ("SK-003", "IT Service Management (ITSM)",     "Service Management"),
    ("SK-004", "Infrastructure Service Management","Service Management"),
    ("SK-005", "SRE / Observability",              "Engineering"),
    ("SK-006", "FinOps / TEM",                     "Finance"),
    ("SK-007", "Digital Workplace",                "Workplace"),
    ("SK-008", "Network Operations",               "Infrastructure"),
    ("SK-009", "Agentic AI",                       "AI"),
    ("SK-010", "Gen AI Foundations",               "AI"),
    ("SK-011", "Service Integration (SIAM)",       "Service Management"),
    ("SK-012", "IT Portfolio Management",          "Service Management"),
]

COURSES = [
    # code,           name,                       category,    provider,   duration, url,                                        due,          icon
    ("GENAI",       "Gen AI Foundations",         "mandatory","Accenture",4, "https://mylearning.accenture.com/genai",       "2026-08-31","🤖"),
    ("AGENTIC_L3A", "Agentic AI L3A",             "mandatory","Accenture",8, "https://mylearning.accenture.com/agentic-l3a", "2026-08-31","⚡"),
    ("TQ",          "Technology Quotient (TQ)",   "mandatory","Accenture",2, "https://mylearning.accenture.com/tq",          "2026-09-30","📊"),
    ("ETHICS",      "Ethics & Compliance",        "mandatory","Accenture",3, "https://mylearning.accenture.com/ethics",      "2026-08-31","⚖️"),
    ("AZ-900",      "Azure Fundamentals",         "elective", "Microsoft",6, "https://learn.microsoft.com/certifications/azure-fundamentals/", None,         "☁️"),
    ("ITIL4-F",     "ITIL 4 Foundation",          "elective", "Axelos",   8, None,                                           None,         "📋"),
]
MANDATORY_COURSES = ("GENAI", "AGENTIC_L3A", "TQ", "ETHICS")

CERTIFICATIONS = [
    # code,      name,                                     provider,   level,        study_url,                                                                practice_url,                                                     badge
    ("AZ-900",   "Azure Fundamentals",                     "Microsoft","Foundation", "https://learn.microsoft.com/certifications/azure-fundamentals/",         None,                                                              "☁️"),
    ("AZ-204",   "Azure Developer Associate",              "Microsoft","Associate",  "https://learn.microsoft.com/certifications/azure-developer/",            "https://learn.microsoft.com/practice-assessments/az-204",         "⚙️"),
    ("AZ-305",   "Azure Solutions Architect Expert",       "Microsoft","Expert",     "https://learn.microsoft.com/certifications/azure-solutions-architect/",  None,                                                              "🏗️"),
    ("AZ-400",   "Azure DevOps Engineer Expert",           "Microsoft","Expert",     None,                                                                     None,                                                              "🔧"),
    ("ITIL4-F",  "ITIL 4 Foundation",                      "Axelos",   "Foundation", None,                                                                     None,                                                              "📋"),
    ("ITIL4-SL", "ITIL 4 Strategic Leader",                "Axelos",   "Strategic",  None,                                                                     None,                                                              "🎯"),
    ("PMP",      "Project Management Professional",        "PMI",      "Professional",None,                                                                    None,                                                              "📊"),
    ("CKAD",     "Certified Kubernetes App Developer",     "CNCF",     "Professional",None,                                                                    None,                                                              "🐳"),
    ("AWS-SAA",  "AWS Solutions Architect Associate",      "Amazon",   "Associate",  None,                                                                     None,                                                              "☁️"),
    ("PL-900",   "Microsoft Power Platform Fundamentals",  "Microsoft","Foundation", None,                                                                     None,                                                              "⚡"),
]

PROGRAMS_CATALOG = [
    ("FDE_CORE",     "Functional Domain Expert",     "Deep-domain program for senior individuals"),
    ("RDE_WORKSHOP", "Reinvention Domain Expert",    "MAGS/IIS RDE Workshop"),
    ("GENAI",        "Gen AI Program",               "Gen AI training program"),
    ("AGENTIC_AI",   "Agentic AI Program",           "Agentic AI upskilling track"),
]
PROGRAM_CODES = tuple(p[0] for p in PROGRAMS_CATALOG)

PROJECTS = [
    # id,               name,                         engagement,        client,             industry
    ("PRJ-MS-AVA-CORE", "MS-AVA-Core Services",       "MS-AVA-Core-Eng", "Avanade",          "Software & Platforms"),
    ("PRJ-CHEV-CFOPS",  "Chevron Cloud First Ops",    "CHEV-CFOPS",      "Chevron",          "Energy"),
    ("PRJ-BP-CLDOPS",   "BP Cloud Operations",        "BP-CLDOPS",       "BP Energy",        "Energy"),
    ("PRJ-PPL-INFRA",   "PPL Infra Modernization",    "PPL-INFRA",       "PPL Corporation",  "Utilities"),
    ("PRJ-INT-CAPDEV",  "Internal — CapDev Portal",   "INT-CAPDEV",      "Internal",         "Professional Services"),
    ("PRJ-INT-BENCH",   "Bench Pool",                 "INT-BENCH",       "Internal",         "Professional Services"),
]

# Full org profile per client (used to build stg_headcount + dim_organization)
ORG_BY_CLIENT = {
    "Avanade":         ("Cloud First Platforms",       "Cloud First Platforms MS", "Cloud Transformation", "Tech_Microsoft Platform", "Cloud",       "APAC", "Philippines"),
    "Chevron":         ("Cloud First Platforms",       "Cloud First Platforms MS", "Service Management",   "Tech_Microsoft Platform", "Service Mgmt","APAC", "Philippines"),
    "BP Energy":       ("Cloud First Platforms",       "Cloud First Platforms MS", "Service Management",   "Tech_Microsoft Platform", "Service Mgmt","APAC", "Philippines"),
    "PPL Corporation": ("Cloud First Platforms",       "Cloud First Platforms MS", "Service Management",   "Tech_Microsoft Platform", "Service Mgmt","APAC", "Philippines"),
    "Internal":        ("Infrastructure & Cloud Svcs", "IIS Philippines",          "Leadership",           "Technology",              "Internal",    "APAC", "Philippines"),
}

# ── PEOPLE — insert order matters ────────────────────────────────────────────
# Juan=1, Karoline=2, Oscar=3 to match the demo-user switcher in app.py.
# (EID, PersonnelNo, FullName, ManagementLevel, JobProfile, ProjectRole,
#  ActivityType, JoinDate, Capability, ProjectID, AvatarColor)
PEOPLE = [
    ("juan.marcos.g",        "P-000042", "Juan Marcos Garcia",   "L6", "Azure PaaS Specialist",  "Cloud Engineer",  "Deployed","2018-01-26","Cloud Transformation",  "PRJ-MS-AVA-CORE","pu"),
    ("karoline.s.cayetano",  "P-000010", "Karoline Cayetano",    "L8", "Cloud Ops Manager",      "People Lead",     "Deployed","2015-03-10","Cloud Transformation",  "PRJ-INT-CAPDEV", "te"),
    ("oscar.r.punsalan",     "P-000003", "Oscar Punsalan",       "L10","Managing Director",      "Leadership",      "Deployed","2010-06-01","Leadership",            "PRJ-INT-CAPDEV", "dk"),
    ("maria.s.cruz",         "P-000015", "Maria Cruz",           "L8", "Service Mgmt Lead",      "People Lead",     "Deployed","2014-08-20","Service Management",    "PRJ-CHEV-CFOPS", "bl"),
    ("gerald.s.carlos",      "P-000018", "Gerald Carlos",        "L9", "Delivery Lead",          "Delivery Lead",   "Deployed","2012-05-15","Service Management",    "PRJ-BP-CLDOPS",  "am"),
    ("julie.san.jose",       "P-000007", "Julie San Jose",       "L7", "CapDev POC",             "CapDev POC",      "Deployed","2016-03-10","Service Management",    "PRJ-INT-CAPDEV", "pu"),
    ("sofia.reyes",          "P-000021", "Sofia Reyes",          "L9", "IT Portfolio Mgmt",      "Portfolio Analyst","Deployed","2013-04-15","Service Management",   "PRJ-CHEV-CFOPS", "pu"),
    ("marco.aquino",         "P-000025", "Marco Aquino",         "L7", "Infra Service Mgr",      "ISM Lead",        "Deployed","2016-07-11","Service Management",    "PRJ-PPL-INFRA",  "te"),
    ("lea.torres",           "P-000029", "Lea Torres",           "L6", "ITSM Analyst",           "Analyst",         "Deployed","2019-02-20","Service Management",    "PRJ-INT-CAPDEV", "bl"),
    ("diego.evangelista",    "P-000033", "Diego Evangelista",    "L5", "SIAM Analyst",           "SIAM",            "Deployed","2021-08-01","Service Management",    "PRJ-BP-CLDOPS",  "co"),
    ("ines.perez",           "P-000037", "Ines Perez",           "L6", "SRE Engineer",           "SRE",             "Deployed","2020-05-18","SRE",                   "PRJ-MS-AVA-CORE","am"),
    ("noel.villanueva",      "P-000041", "Noel Villanueva",      "L5", "Azure DevOps Eng",       "DevOps",          "Deployed","2022-11-03","Cloud Transformation",  "PRJ-MS-AVA-CORE","co"),
    ("bianca.lopez",         "P-000044", "Bianca Lopez",         "L5", "Cloud Ops Analyst",      "Analyst",         "Deployed","2023-03-15","Cloud Transformation",  "PRJ-MS-AVA-CORE","pi"),
    ("felix.garcia",         "P-000048", "Felix Garcia",         "L6", "ITSM Analyst",           "Analyst",         "Deployed","2020-09-07","Service Management",    "PRJ-CHEV-CFOPS", "te"),
    ("paolo.bautista",       "P-000051", "Paolo Bautista",       "L5", "Digital Workplace",      "Specialist",      "Deployed","2022-02-14","Digital Workplace",     "PRJ-MS-AVA-CORE","bl"),
    ("regina.mendoza",       "P-000055", "Regina Mendoza",       "L5", "FinOps Analyst",         "FinOps",          "Deployed","2021-01-12","FinOps",                "PRJ-PPL-INFRA",  "am"),
    ("arjay.torres",         "P-000058", "Arjay Torres",         "L4", "Service Desk",           "Support",         "Deployed","2024-06-01","Service Management",    "PRJ-BP-CLDOPS",  "co"),
    ("cheska.rivera",        "P-000061", "Cheska Rivera",        "L4", "Network Ops Eng",        "NetOps",          "Deployed","2023-09-22","Hybrid Cloud Ops",      "PRJ-PPL-INFRA",  "pi"),
    ("dennis.aquino",        "P-000064", "Dennis Aquino",        "L5", "Cloud Ops Analyst",      "Analyst",         "Bench",   "2022-05-04","Cloud Transformation",  "PRJ-INT-BENCH",  "pu"),
    ("faith.castillo",       "P-000067", "Faith Castillo",       "L4", "Junior Analyst",         "Analyst",         "Bench",   "2024-11-10","Service Management",    "PRJ-INT-BENCH",  "bl"),
]

# People-Lead relationships (subordinate EID → PL EID). Oscar (L10) has no PL.
PL_MAP: dict[str, str | None] = {
    "juan.marcos.g":       "karoline.s.cayetano",
    "karoline.s.cayetano": "oscar.r.punsalan",
    "oscar.r.punsalan":    None,
    "maria.s.cruz":        "oscar.r.punsalan",
    "gerald.s.carlos":     "oscar.r.punsalan",
    "julie.san.jose":      "karoline.s.cayetano",
    "sofia.reyes":         "maria.s.cruz",
    "marco.aquino":        "maria.s.cruz",
    "lea.torres":          "karoline.s.cayetano",
    "diego.evangelista":   "gerald.s.carlos",
    "ines.perez":          "karoline.s.cayetano",
    "noel.villanueva":     "karoline.s.cayetano",
    "bianca.lopez":        "karoline.s.cayetano",
    "felix.garcia":        "maria.s.cruz",
    "paolo.bautista":      "karoline.s.cayetano",
    "regina.mendoza":      "maria.s.cruz",
    "arjay.torres":        "gerald.s.carlos",
    "cheska.rivera":       "maria.s.cruz",
    "dennis.aquino":       "karoline.s.cayetano",
    "faith.castillo":      "maria.s.cruz",
}

# Mandatory-course status per person
COMPLETED_COURSES: dict[str, tuple[str, ...]] = {
    "juan.marcos.g":       ("GENAI","TQ"),
    "karoline.s.cayetano": ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "oscar.r.punsalan":    ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "maria.s.cruz":        ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "gerald.s.carlos":     ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "julie.san.jose":      ("GENAI","TQ","ETHICS"),
    "sofia.reyes":         ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "marco.aquino":        ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "lea.torres":          ("GENAI","AGENTIC_L3A","TQ","ETHICS"),
    "diego.evangelista":   ("GENAI","AGENTIC_L3A","TQ"),
    "ines.perez":          ("GENAI","AGENTIC_L3A","TQ"),
    "noel.villanueva":     (),                              # HIGH RISK
    "bianca.lopez":        ("GENAI",),
    "felix.garcia":        ("GENAI","TQ"),
    "paolo.bautista":      ("GENAI","TQ"),
    "regina.mendoza":      ("GENAI","TQ","ETHICS"),
    "arjay.torres":        ("GENAI",),
    "cheska.rivera":       ("GENAI","TQ"),
    "dennis.aquino":       ("GENAI","TQ"),
    "faith.castillo":      ("GENAI",),
}

IN_PROGRESS_COURSES: dict[str, tuple[str, ...]] = {
    "juan.marcos.g":       ("AGENTIC_L3A",),
    "julie.san.jose":      ("AGENTIC_L3A",),
    "diego.evangelista":   ("ETHICS",),
    "ines.perez":          ("ETHICS",),
    "bianca.lopez":        ("TQ",),
    "felix.garcia":        ("AGENTIC_L3A",),
    "regina.mendoza":      ("AGENTIC_L3A",),
    "cheska.rivera":       ("AGENTIC_L3A",),
    "dennis.aquino":       ("ETHICS",),
    "faith.castillo":      ("TQ",),
}

# Program status (values: Nominated | In Progress | Completed | Not Started)
PROGRAM_STATUS: dict[str, dict[str, str]] = {
    "juan.marcos.g":       {"FDE_CORE": "Nominated"},
    "sofia.reyes":         {"FDE_CORE": "Completed", "RDE_WORKSHOP": "Completed"},
    "marco.aquino":        {"FDE_CORE": "In Progress"},
    "lea.torres":          {"RDE_WORKSHOP": "Completed"},
    "diego.evangelista":   {"RDE_WORKSHOP": "In Progress"},
    "ines.perez":          {"AGENTIC_AI": "In Progress"},
    "felix.garcia":        {"FDE_CORE": "Nominated", "RDE_WORKSHOP": "In Progress"},
    "paolo.bautista":      {"RDE_WORKSHOP": "In Progress"},
    "regina.mendoza":      {"GENAI": "Completed"},
    "julie.san.jose":      {"FDE_CORE": "Completed"},
}

# Certifications: (code, GoalStatus, TargetDate, CompletionDate, ExpiryDate)
CERTS: dict[str, list[tuple[str, str, str | None, str | None, str | None]]] = {
    "juan.marcos.g":       [("AZ-900","Earned",None,"2026-04-10","2028-04-10"),
                            ("AZ-204","In Progress","2026-09-30",None,None)],
    "sofia.reyes":         [("ITIL4-F","Earned",None,"2022-01-10","2025-01-10"),
                            ("ITIL4-SL","In Progress","2026-09-15",None,None)],
    "marco.aquino":        [("AZ-900","Earned",None,"2022-05-20","2025-05-20"),
                            ("AWS-SAA","In Progress","2026-11-30",None,None)],
    "lea.torres":          [("ITIL4-F","Earned",None,"2023-05-20","2026-05-20")],
    "diego.evangelista":   [("ITIL4-F","Earned",None,"2024-03-10","2027-03-10")],
    "ines.perez":          [("CKAD","Earned",None,"2025-01-15","2028-01-15")],
    "bianca.lopez":        [("AZ-900","Planned",None,None,None)],
    "felix.garcia":        [("ITIL4-F","Earned",None,"2024-01-15","2027-01-15")],
    "paolo.bautista":      [("PMP","In Progress","2026-12-31",None,None)],
    "regina.mendoza":      [("AZ-900","Earned",None,"2024-08-01","2027-08-01")],
}

# Skills — assessment cycles are stored as ISO dates so the UI can parse them
SKILL_ASSIGN: dict[str, list[tuple[str, str, str, str]]] = {
    "juan.marcos.g":       [("SK-001","Primary","P3","2026-01-10"), ("SK-002","Secondary","P2","2026-01-10"), ("SK-009","Secondary","P1","2026-06-15")],
    "karoline.s.cayetano": [("SK-001","Primary","P4","2025-06-01"), ("SK-003","Secondary","P3","2025-06-01")],
    "oscar.r.punsalan":    [("SK-004","Primary","P5","2025-01-15")],
    "maria.s.cruz":        [("SK-003","Primary","P4","2025-08-20")],
    "gerald.s.carlos":     [("SK-004","Primary","P4","2025-05-15")],
    "julie.san.jose":      [("SK-003","Primary","P3","2025-09-10")],
    "sofia.reyes":         [("SK-012","Primary","P4","2025-10-01"), ("SK-003","Secondary","P3","2025-10-01")],
    "marco.aquino":        [("SK-004","Primary","P3","2025-11-15"), ("SK-002","Secondary","P2","2025-11-15")],
    "lea.torres":          [("SK-003","Primary","P2","2025-09-10"), ("SK-007","Secondary","P1","2025-09-10")],
    "diego.evangelista":   [("SK-011","Primary","P2","2025-12-01")],
    "ines.perez":          [("SK-005","Primary","P3","2025-10-20"), ("SK-002","Secondary","P2","2025-10-20")],
    "noel.villanueva":     [("SK-002","Primary","P1","2025-08-01")],
    "bianca.lopez":        [("SK-001","Primary","P1","2026-04-01")],
    "felix.garcia":        [("SK-003","Primary","P2","2025-11-07")],
    "paolo.bautista":      [("SK-007","Primary","P2","2025-12-14")],
    "regina.mendoza":      [("SK-006","Primary","P2","2025-11-20")],
    "arjay.torres":        [("SK-003","Primary","P1","2026-02-15")],
    "cheska.rivera":       [("SK-008","Primary","P1","2026-01-25")],
    "dennis.aquino":       [("SK-001","Primary","P1","2026-03-01")],
    "faith.castillo":      [("SK-003","Primary","P1","2026-03-15")],
}

# Check-ins (worker_eid, pl_eid, type, notes, sentiment, ISO date)
CHECKINS = [
    ("juan.marcos.g", "karoline.s.cayetano", "Career coaching",
     "Discussed AZ-204 study plan. Juan is targeting September exam. Blocked study time on Fridays.",
     "positive",      "2026-05-15"),
    ("juan.marcos.g", "karoline.s.cayetano", "1:1 Note",
     "Gen AI Foundations completed. Great progress on mandatory training.",
     "positive",      "2026-06-10"),
    ("juan.marcos.g", "karoline.s.cayetano", "Pulse check",
     "Ethics training not yet started. Committed to completing before Aug 31.",
     "neutral",       "2026-07-08"),
    ("juan.marcos.g", "karoline.s.cayetano", "1:1 Note",
     "Agentic AI L3A progress at 60%. On track.",
     "positive",      "2026-07-22"),
    ("juan.marcos.g", "karoline.s.cayetano", "Performance",
     "Mid-year review. Strong technical delivery at Avanade. Recommended for Cloud Elite next cycle.",
     "positive",      "2026-08-05"),
    ("noel.villanueva", "karoline.s.cayetano", "Pulse check",
     "No mandatory training started. Flagged HIGH RISK — immediate follow-up required before Aug 31 deadline.",
     "needs_support", "2026-08-10"),
    ("bianca.lopez",  "karoline.s.cayetano", "1:1 Note",
     "Skill assessment overdue (P1 on Azure PaaS since April). Discussed upskilling plan — needs action.",
     "needs_support", "2026-08-12"),
]

# Deterministic proficiency-to-score used to synthesize a READY score.
PROF_SCORE = {"P1": 20, "P2": 40, "P3": 60, "P4": 80, "P5": 100}


# ═════════════════════════════════════════════════════════════════════════════
#  Helpers
# ═════════════════════════════════════════════════════════════════════════════

def dk(iso: str | None) -> int | None:
    return int(iso.replace("-", "")[:8]) if iso else None


def truncate_all(cn: sqlite3.Connection) -> None:
    """Delete rows in FK-safe order and reset AUTOINCREMENT counters."""
    tables = [
        # RBAC
        "rbac_authorization_audit", "rbac_user_role_scopes",
        "rbac_user_role_assignments", "rbac_portal_users",
        "rbac_role_permissions", "rbac_roles", "rbac_permissions",
        # ui-facing physical
        "checkins",
        # facts
        "fact_team_snapshot", "fact_ready_snapshot", "fact_achievement",
        "fact_certification", "fact_program_status", "fact_training_status",
        # bridges
        "bridge_person_skill", "bridge_person_project",
        # config
        "cfg_helpful_link", "cfg_ready_rule", "cfg_proficiency_rule",
        "cfg_training_applicability", "cfg_portal_contact",
        # dims
        "dim_program", "dim_certification",
        "dim_project", "dim_course", "dim_skill", "dim_capability",
        "dim_organization", "dim_date", "dim_person",
        # staging
        "stg_rde", "stg_learning_enrollment",
        "stg_training_consolidated", "stg_headcount",
    ]
    for tbl in tables:
        cn.execute(f"DELETE FROM {tbl}")
        cn.execute("DELETE FROM sqlite_sequence WHERE name = ?", (tbl,))


def seed_dim_date_range(cn: sqlite3.Connection, start: date, end: date) -> None:
    """Materialize a continuous calendar so fact-date FKs never miss."""
    cur = start
    rows = []
    while cur <= end:
        rows.append((
            int(cur.strftime("%Y%m%d")),
            cur.isoformat(),
            cur.isoweekday(),
            cur.strftime("%A"),
            cur.month,
            cur.strftime("%B"),
            (cur.month - 1) // 3 + 1,
            cur.year,
            1 if cur.isoweekday() >= 6 else 0,
        ))
        cur += timedelta(days=1)
    cn.executemany("""
        INSERT OR IGNORE INTO dim_date (
            DateKey, FullDate, DayOfWeek, DayName,
            MonthNumber, MonthName, Quarter, Year, IsWeekend
        ) VALUES (?,?,?,?,?,?,?,?,?)
    """, rows)


# ═════════════════════════════════════════════════════════════════════════════
#  Seeders
# ═════════════════════════════════════════════════════════════════════════════

def seed_reference_dims(cn: sqlite3.Connection) -> dict[str, dict]:
    cap_key: dict[str, int] = {}
    for cap in CAPABILITIES + ["Leadership"]:
        cur = cn.execute(
            "INSERT INTO dim_capability (CapabilityName) VALUES (?)", (cap,)
        )
        cap_key[cap] = cur.lastrowid

    sk_key: dict[str, int] = {}
    for sid, name, family in SKILLS:
        cur = cn.execute(
            "INSERT INTO dim_skill (SkillID, SkillName, SkillFamily) VALUES (?,?,?)",
            (sid, name, family),
        )
        sk_key[sid] = cur.lastrowid

    co_key: dict[str, int] = {}
    for code, name, cat, provider, duration, url, due, icon in COURSES:
        cur = cn.execute("""
            INSERT INTO dim_course (
                CourseCode, CourseName, Category, Provider,
                DurationHours, URL, DueDate, Icon
            ) VALUES (?,?,?,?,?,?,?,?)
        """, (code, name, cat, provider, duration, url, due, icon))
        co_key[code] = cur.lastrowid

    cert_key: dict[str, int] = {}
    for code, name, prov, lvl, study, practice, badge in CERTIFICATIONS:
        cur = cn.execute("""
            INSERT INTO dim_certification (
                CertificationCode, CertificationName, Provider, Level,
                StudyURL, PracticeURL, Badge
            ) VALUES (?,?,?,?,?,?,?)
        """, (code, name, prov, lvl, study, practice, badge))
        cert_key[code] = cur.lastrowid

    prg_key: dict[str, int] = {}
    for code, name, desc in PROGRAMS_CATALOG:
        cur = cn.execute(
            "INSERT INTO dim_program (ProgramCode, ProgramName, Description) VALUES (?,?,?)",
            (code, name, desc),
        )
        prg_key[code] = cur.lastrowid

    pr_key: dict[str, int] = {}
    for pid, name, eng, client, industry in PROJECTS:
        cur = cn.execute("""
            INSERT INTO dim_project (
                ProjectID, ProjectName, EngagementName, ClientName, Industry
            ) VALUES (?,?,?,?,?)
        """, (pid, name, eng, client, industry))
        pr_key[pid] = cur.lastrowid

    return {
        "cap": cap_key, "skill": sk_key, "course": co_key,
        "cert": cert_key, "program": prg_key, "project": pr_key,
    }


def seed_org_and_staging(cn: sqlite3.Connection) -> None:
    project_client = {p[0]: p[3] for p in PROJECTS}

    org_seen: set[tuple] = set()
    for client in project_client.values():
        org = ORG_BY_CLIENT[client]
        if org in org_seen:
            continue
        org_seen.add(org)
        cn.execute("""
            INSERT INTO dim_organization (
                OrgLevel5, OrgLevel6, OrgLevel7, OrgLevel8,
                BusinessGroup, Practice, Market, MarketUnit
            ) VALUES (?,?,?,NULL,?,?,?,?)
        """, org)

    for (eid, pn, name, lvl, jp, role,
         activity, join_date, capability, project_id, _av) in PEOPLE:
        client = project_client[project_id]
        org5, org6, org7, bg, practice, market, _country = ORG_BY_CLIENT[client]
        cn.execute("""
            INSERT INTO stg_headcount (
                SourceFile, PersonnelNo, EnterpriseID, EmailAddress, Name,
                Level, JobProfile, ProjectRole,
                EmploymentStatus, ResourceType, ActivityType, JoinDate,
                HomeLoc, CurrLoc, Country,
                OrgLevel5, OrgLevel6, OrgLevel7,
                BusinessGroup, Practice, Market, MarketUnit,
                CapabilityMapping,
                Project, Client, Engagement,
                FTE, FTEPercent, ProjectStartDate
            ) VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?, ?, ?,?,?, ?,?,?)
        """, (
            "dummy-seed", pn, eid, f"{eid}@accenture.com", name,
            lvl, jp, role,
            "Active", "Employee - Regular", activity, join_date,
            "Manila", "Manila", "Philippines",
            org5, org6, org7,
            bg, practice, market, "Philippines",
            capability,
            project_id, client, project_id,
            1.0, 100.0, join_date,
        ))


def seed_dim_person(cn: sqlite3.Connection) -> dict[str, int]:
    """SCD2 initial load. Insertion order guarantees Juan=1, Karoline=2, Oscar=3."""
    person_key: dict[str, int] = {}
    for (eid, pn, name, lvl, jp, role,
         activity, join_date, _cap, _prj, avatar) in PEOPLE:
        cur = cn.execute("""
            INSERT INTO dim_person (
                EnterpriseID, PersonnelNo, FullName, EmailAddress,
                ManagementLevel, JobProfile, ProjectRole,
                EmploymentStatus, ResourceType, ActivityType, JoinDate,
                HomeLocation, CurrentLocation, Country,
                IsActive, PeopleLeadEID, AvatarColor,
                EffectiveFrom, EffectiveTo, IsCurrent
            ) VALUES (?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?,?)
        """, (
            eid, pn, name, f"{eid}@accenture.com",
            lvl, jp, role,
            "Active", "Employee - Regular", activity, join_date,
            "Manila", "Manila", "Philippines",
            1, PL_MAP.get(eid), avatar,
            NOW_UTC, None, 1,
        ))
        person_key[eid] = cur.lastrowid
    return person_key


def seed_bridges(cn: sqlite3.Connection, keys: dict) -> None:
    person_key  = keys["person"]
    project_key = keys["project"]
    skill_key   = keys["skill"]

    for (eid, _pn, _name, _lvl, _jp, _role,
         _activity, join_date, _cap, project_id, _av) in PEOPLE:
        cn.execute("""
            INSERT INTO bridge_person_project (
                PersonKey, ProjectKey, FTE, FTEPercent,
                ProjectStartDate, RollOffDate, IsPrimaryAllocation
            ) VALUES (?,?,?,?,?,?,?)
        """, (person_key[eid], project_key[project_id], 1.0, 100.0, join_date, None, 1))

    for eid, records in SKILL_ASSIGN.items():
        for sid, stype, prof, cycle in records:
            cn.execute("""
                INSERT INTO bridge_person_skill (
                    PersonKey, SkillKey, SkillType, ProficiencyCode, AssessmentCycle
                ) VALUES (?,?,?,?,?)
            """, (person_key[eid], skill_key[sid], stype, prof, cycle))


def seed_facts(cn: sqlite3.Connection, keys: dict) -> None:
    person_key = keys["person"]
    course_key = keys["course"]

    for (eid, *_rest) in PEOPLE:
        done = COMPLETED_COURSES.get(eid, ())
        wip  = IN_PROGRESS_COURSES.get(eid, ())
        for course in MANDATORY_COURSES:
            if course in done:
                status, completion = "Completed",   "2026-05-15"
            elif course in wip:
                status, completion = "In Progress", None
            else:
                status, completion = "Not Started", None
            cn.execute("""
                INSERT INTO fact_training_status (
                    PersonKey, CourseKey, Status, RegistrationStatus, AttendanceStatus,
                    CompletionDateKey, LatestEnrollmentFlag, SourcePriority
                ) VALUES (?,?,?,?,?,?,?,?)
            """, (
                person_key[eid], course_key[course], status,
                "Registered", "Attended" if status == "Completed" else None,
                dk(completion), 1, 1,
            ))

    for (eid, *_rest) in PEOPLE:
        for program in PROGRAM_CODES:
            status = PROGRAM_STATUS.get(eid, {}).get(program, "Not Started")
            status_iso = "2026-06-30" if status == "Completed" else \
                         "2026-08-01" if status in ("In Progress", "Nominated") else None
            cn.execute("""
                INSERT INTO fact_program_status (
                    PersonKey, ProgramCode, ProgramStatus, StatusDateKey, SourceFile
                ) VALUES (?,?,?,?,?)
            """, (person_key[eid], program, status, dk(status_iso), "dummy-seed"))

    for eid, records in CERTS.items():
        for code, goal_status, target, completion, expiry in records:
            cn.execute("""
                INSERT INTO fact_certification (
                    PersonKey, CertificationCode, GoalStatus,
                    TargetDateKey, CompletionDateKey, ExpiryDateKey, EvidenceURL
                ) VALUES (?,?,?,?,?,?,?)
            """, (
                person_key[eid], code, goal_status,
                dk(target), dk(completion), dk(expiry), None,
            ))

    achievers = {
        "sofia.reyes":  [("BADGE-FDE-COMPLETE","FDE Core Complete", "2026-06-30")],
        "marco.aquino": [("BADGE-CLOUD-CERT",  "Multi-cloud Certified","2026-05-20")],
        "ines.perez":   [("BADGE-CKAD",        "CKAD Earned",       "2025-01-15")],
        "lea.torres":   [("BADGE-RDE",         "RDE Graduate",      "2026-06-30")],
    }
    for eid, awards in achievers.items():
        for code, name, awarded in awards:
            cn.execute("""
                INSERT INTO fact_achievement (
                    PersonKey, AchievementCode, AchievementName,
                    AwardedDateKey, RuleVersion, SourceFile
                ) VALUES (?,?,?,?,?,?)
            """, (person_key[eid], code, name, dk(awarded), RULE_VERSION, "dummy-seed"))

    for (eid, *_rest) in PEOPLE:
        done = COMPLETED_COURSES.get(eid, ())
        training_score = round(len(done) / len(MANDATORY_COURSES) * 100, 2)

        skills = SKILL_ASSIGN.get(eid, [])
        prof_avg = (sum(PROF_SCORE.get(p, 0) for _, _, p, _ in skills) / len(skills)
                    if skills else 0.0)
        prof_score = round(prof_avg, 2)

        cert_count = len(CERTS.get(eid, []))
        cert_score = round(min(cert_count / 2, 1.0) * 100, 2)

        components   = sum(1 for s in (training_score, prof_score, cert_score) if s > 0)
        completeness = round(components / 3 * 100, 2)

        ready    = round(training_score * 0.4 + prof_score * 0.4 + cert_score * 0.2, 2)
        eligible = 1 if completeness >= 66 else 0

        cn.execute("""
            INSERT INTO fact_ready_snapshot (
                PersonKey, SnapshotDateKey, RuleVersion,
                TrainingScore, ProficiencyScore, CertificationScore, AchievementScore,
                ReadyScore, DataCompletenessPercent, IsRankingEligible
            ) VALUES (?,?,?, ?,?,?,?, ?,?,?)
        """, (
            person_key[eid], dk(SNAPSHOT), RULE_VERSION,
            training_score, prof_score, cert_score, 0.0,
            ready, completeness, eligible,
        ))

    months = ["2026-03-01","2026-04-01","2026-05-01","2026-06-01","2026-07-01","2026-08-01"]
    scopes = [
        ("people_lead", "karoline.s.cayetano", "avg_ready_score", [62, 65, 67, 70, 73, 75]),
        ("people_lead", "karoline.s.cayetano", "compliance_pct",  [58, 62, 65, 68, 71, 73]),
        ("people_lead", "maria.s.cruz",        "avg_ready_score", [70, 72, 74, 75, 77, 78]),
        ("people_lead", "maria.s.cruz",        "compliance_pct",  [72, 74, 76, 78, 80, 82]),
        ("people_lead", "gerald.s.carlos",     "avg_ready_score", [64, 66, 68, 70, 72, 74]),
        ("people_lead", "gerald.s.carlos",     "compliance_pct",  [70, 72, 74, 76, 78, 80]),
        ("capability",  "Service Management",  "avg_ready_score", [65, 67, 69, 70, 72, 73]),
        ("capability",  "Service Management",  "compliance_pct",  [79, 81, 83, 85, 87, 88]),
        ("org",         "GLOBAL",              "avg_ready_score", [67, 69, 71, 73, 74, 75]),
        ("org",         "GLOBAL",              "compliance_pct",  [83, 85, 87, 89, 90, 91]),
        ("org",         "GLOBAL",              "p2plus_pct",      [60, 62, 64, 65, 66, 68]),
    ]
    for scope_type, scope_id, metric, values in scopes:
        for m, v in zip(months, values):
            cn.execute("""
                INSERT INTO fact_team_snapshot (
                    ScopeType, ScopeID, SnapshotDateKey, MetricKey, MetricValue
                ) VALUES (?,?,?,?,?)
            """, (scope_type, scope_id, dk(m), metric, float(v)))


def seed_config(cn: sqlite3.Connection, keys: dict, person_key: dict[str, int]) -> None:
    for code, label, rank in [("P1","Foundational",1), ("P2","Working",2),
                              ("P3","Proficient",3),   ("P4","Expert",4),
                              ("P5","Distinguished",5)]:
        cn.execute("""
            INSERT INTO cfg_proficiency_rule (
                ProficiencyCode, DisplayLabel, RankOrder, RuleVersion
            ) VALUES (?,?,?,?)
        """, (code, label, rank, RULE_VERSION))

    for comp, weight, threshold in [
        ("Training",      0.40, 80.0),
        ("Proficiency",   0.40, 60.0),
        ("Certification", 0.20, 50.0),
        ("Achievement",   0.00, None),
    ]:
        cn.execute("""
            INSERT INTO cfg_ready_rule (
                RuleVersion, ScoreComponent, ComponentWeight, Threshold,
                MissingDataTreatment, CohortLogic, EffectiveFrom, EffectiveTo
            ) VALUES (?,?,?,?,?,?,?,?)
        """, (
            f"{RULE_VERSION}-{comp}", comp, weight, threshold,
            "zero", "capability", SNAPSHOT, None,
        ))

    contacts = [
        (None,                      "CapDev Lead",      "julie.san.jose"),
        (None,                      "RDE POC",          "julie.san.jose"),
        ("Cloud Transformation",    "Capability Lead",  "karoline.s.cayetano"),
        ("Service Management",      "Capability Lead",  "maria.s.cruz"),
    ]
    for cap_name, role, eid in contacts:
        cap_id = keys["cap"].get(cap_name) if cap_name else None
        cn.execute("""
            INSERT INTO cfg_portal_contact (
                CapabilityKey, ContactRole, PersonKey, EffectiveFrom, EffectiveTo
            ) VALUES (?,?,?,?,?)
        """, (cap_id, role, person_key[eid], SNAPSHOT, None))

    for course_code, rule in [
        ("GENAI",       "population = 'all'"),
        ("AGENTIC_L3A", "population = 'all'"),
        ("TQ",          "population = 'all'"),
        ("ETHICS",      "population = 'all'"),
        ("AZ-900",      "capability IN ('Cloud Transformation','SRE')"),
        ("ITIL4-F",     "capability IN ('Service Management')"),
    ]:
        cn.execute("""
            INSERT INTO cfg_training_applicability (
                CourseKey, PopulationRule, EffectiveFrom, EffectiveTo
            ) VALUES (?,?,?,?)
        """, (keys["course"][course_code], rule, SNAPSHOT, None))

    links = [
        ("MyLearning Portal",       "https://mylearning.accenture.com",         "all"),
        ("Gen AI Foundations",      "https://mylearning.accenture.com/genai",   "all"),
        ("Agentic AI L3A",          "https://mylearning.accenture.com/agentic", "all"),
        ("CapDev Playbook",         "https://ts.accenture.com/capdev",          "people_lead"),
        ("RDE Nomination Tracker",  "https://ts.accenture.com/rde-nom",         "people_lead"),
    ]
    for label, url, audience in links:
        cn.execute("""
            INSERT INTO cfg_helpful_link (
                LinkLabel, LinkURL, Audience, EffectiveFrom, EffectiveTo
            ) VALUES (?,?,?,?,?)
        """, (label, url, audience, SNAPSHOT, None))


def seed_checkins(cn: sqlite3.Connection, person_key: dict[str, int]) -> None:
    for worker_eid, pl_eid, ctype, notes, sentiment, iso in CHECKINS:
        cn.execute("""
            INSERT INTO checkins (
                worker_id, pl_id, checkin_type, notes, sentiment, checkin_date
            ) VALUES (?,?,?,?,?,?)
        """, (person_key[worker_eid], person_key[pl_eid], ctype, notes, sentiment, iso))


def seed_rbac(cn: sqlite3.Connection, person_key: dict[str, int]) -> None:
    """Seed demo portal accounts, role permissions, and access scopes."""
    demo_users = [
        ("juan.marcos.garcia@accenture.com", "individual", "juan.marcos.g"),
        ("karoline.cayetano@accenture.com", "people_lead", "karoline.s.cayetano"),
        ("oscar.punsalan@accenture.com", "capability_lead", "oscar.r.punsalan"),
        ("admin@accenture.com", "admin", None),
    ]
    roles = [
        ("individual", "Individual", "Access to the signed-in person's own records"),
        ("people_lead", "People Lead", "Access to the assigned direct-report team"),
        ("capability_lead", "Capability Lead", "Organization-wide reporting access"),
        ("admin", "Administrator", "Manage portal administration functions"),
    ]
    permissions = [
        ("worker.read.self", "Read own worker records"),
        ("worker.update.self", "Update permitted own-worker records"),
        ("team.read", "Read assigned team data"),
        ("checkin.write.team", "Create check-ins for assigned team members"),
        ("export.team", "Export assigned team data"),
        ("report.read.capability", "Read organization-wide capability reports"),
        ("export.capability", "Export organization-wide capability data"),
        ("admin.read", "Read portal administration data"),
        ("catalog.manage", "Manage portal catalogs"),
        ("user_role.manage", "Manage portal roles and assignments"),
        ("imports.manage", "Manage portal imports"),
        ("checkin.read.team", "Read check-ins for assigned team members"),
        ("report.read.organization", "Read organization-wide administrative summaries"),
        ("worker.read.organization", "Read organization-wide worker records"),
        ("checkin.read.organization", "Read organization-wide check-ins"),
    ]
    role_permission_codes = {
        "individual": ["worker.read.self", "worker.update.self"],
        "people_lead": [
            "worker.read.self", "worker.update.self", "team.read",
            "checkin.write.team", "export.team", "checkin.read.team",
        ],
        "capability_lead": [
            "worker.read.self", "report.read.capability", "export.capability",
        ],
        "admin": [
            "admin.read", "catalog.manage", "user_role.manage", "imports.manage",
            "report.read.organization", "worker.read.organization",
            "checkin.read.organization",
        ],
    }

    for table, rows, columns in (
        ("rbac_roles", roles, "code, name, description"),
        ("rbac_permissions", permissions, "code, description"),
    ):
        placeholders = ", ".join("?" for _ in rows[0])
        cn.executemany(
            f"INSERT OR IGNORE INTO {table} ({columns}) VALUES ({placeholders})",
            rows,
        )

    role_ids = {
        code: cn.execute(
            "SELECT id FROM rbac_roles WHERE code = ?", (code,)
        ).fetchone()[0]
        for code, _, _ in roles
    }
    permission_ids = {
        code: cn.execute(
            "SELECT id FROM rbac_permissions WHERE code = ?", (code,)
        ).fetchone()[0]
        for code, _ in permissions
    }
    for role_code, permission_codes in role_permission_codes.items():
        cn.executemany(
            """INSERT OR IGNORE INTO rbac_role_permissions (role_id, permission_id)
               VALUES (?, ?)""",
            [
                (role_ids[role_code], permission_ids[permission_code])
                for permission_code in permission_codes
            ],
        )

    for email, role_code, enterprise_id in demo_users:
        person_id = person_key.get(enterprise_id) if enterprise_id else None
        if enterprise_id and person_id is None:
            raise RuntimeError(
                f"Cannot assign demo portal account {email!r}: "
                f"EnterpriseID {enterprise_id!r} was not seeded"
            )

        cn.execute(
            """INSERT OR IGNORE INTO rbac_portal_users (email, EnterpriseID)
               VALUES (?, ?)""",
            (email, enterprise_id),
        )
        user = cn.execute(
            "SELECT id, EnterpriseID FROM rbac_portal_users WHERE email = ?", (email,)
        ).fetchone()
        if user[1] != enterprise_id:
            raise RuntimeError(
                f"Portal account {email!r} is linked to an unexpected EnterpriseID"
            )
        role_id = role_ids[role_code]
        cn.execute(
            """INSERT OR IGNORE INTO rbac_user_role_assignments (user_id, role_id)
               VALUES (?, ?)""",
            (user[0], role_id),
        )
        assignment_id = cn.execute(
            """SELECT id FROM rbac_user_role_assignments
               WHERE user_id = ? AND role_id = ?""",
            (user[0], role_id),
        ).fetchone()[0]

        scope = None
        if role_code in ("capability_lead", "admin"):
            scope = ("organization", None, "org")
        if scope:
            exists = cn.execute(
                """SELECT 1 FROM rbac_user_role_scopes
                   WHERE user_role_assignment_id = ? AND scope_type = ?
                     AND scope_capability_key IS ? AND scope_org_value IS ?""",
                (assignment_id, *scope),
            ).fetchone()
            if not exists:
                cn.execute(
                    """INSERT INTO rbac_user_role_scopes (
                           user_role_assignment_id, scope_type,
                           scope_capability_key, scope_org_value
                       ) VALUES (?, ?, ?, ?)""",
                    (assignment_id, *scope),
                )


# ═════════════════════════════════════════════════════════════════════════════
#  Orchestrator
# ═════════════════════════════════════════════════════════════════════════════

def run() -> None:
    if not DB_PATH.exists():
        raise SystemExit(
            f"Missing {DB_PATH.name}. Build the schema first:\n"
            f"    python db/build_capdev_portal_db.py"
        )

    with sqlite3.connect(DB_PATH) as cn:
        cn.execute("PRAGMA foreign_keys = OFF")
        truncate_all(cn)

        # calendar first so all FK date lookups succeed
        seed_dim_date_range(cn, date(2020, 1, 1), date(2029, 12, 31))

        keys = seed_reference_dims(cn)
        seed_org_and_staging(cn)
        person_key = seed_dim_person(cn)
        keys["person"] = person_key
        seed_bridges(cn, keys)
        seed_facts(cn, keys)
        seed_config(cn, keys, person_key)
        seed_checkins(cn, person_key)
        seed_rbac(cn, person_key)

        cn.commit()
        cn.execute("PRAGMA foreign_keys = ON")

        orphans = cn.execute("PRAGMA foreign_key_check").fetchall()
        if orphans:
            print("⚠  Foreign-key orphans detected:")
            for row in orphans:
                print(f"     {row}")
        else:
            print("✔  foreign_key_check: OK")

        print("\nCapDev Portal — dummy row counts:")
        for tbl in [
            "stg_headcount",
            "dim_person", "dim_organization", "dim_capability",
            "dim_skill", "dim_course", "dim_certification", "dim_program",
            "dim_project", "dim_date",
            "bridge_person_project", "bridge_person_skill",
            "fact_training_status", "fact_program_status", "fact_certification",
            "fact_achievement", "fact_ready_snapshot", "fact_team_snapshot",
            "cfg_portal_contact", "cfg_training_applicability",
            "cfg_proficiency_rule", "cfg_ready_rule", "cfg_helpful_link",
            "checkins", "rbac_portal_users", "rbac_roles", "rbac_permissions",
            "rbac_role_permissions", "rbac_user_role_assignments",
            "rbac_user_role_scopes", "rbac_authorization_audit",
        ]:
            n = cn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            print(f"  {tbl:<28} {n:>5}")

        j = cn.execute(
            "SELECT PersonKey, FullName FROM dim_person WHERE PersonKey IN (1,2,3) ORDER BY PersonKey"
        ).fetchall()
        print("\nDemo-user pinning: " + " · ".join(f"[{k}] {n}" for k, n in j))


if __name__ == "__main__":
    run()
