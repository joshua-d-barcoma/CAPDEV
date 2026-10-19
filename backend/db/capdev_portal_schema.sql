-- ============================================================================
--  CapDev Portal — Target Data Model (SQLite translation)
--  Source: ready-portal/data_mapping/CapDev Portal Data setup.xlsx
--  Layers: Staging  →  Integration (dims + bridges)  →  Data Mart (facts)
--          + Configuration (control) tables
--
--  Notes on the translation from the workbook to SQLite:
--    • BIGINT / INT / SMALLINT             → INTEGER
--    • VARCHAR(n)                          → TEXT      (SQLite ignores length)
--    • DECIMAL(p,s) / FLOAT                → REAL
--    • BOOLEAN                             → INTEGER   (0 = false, 1 = true)
--    • DATE / DATETIME / TIMESTAMPTZ       → TEXT      (ISO-8601 strings)
--    • TEXT[] arrays (Postgres)            → TEXT      (JSON string; no arrays)
--    • Surrogate PKs                       → INTEGER PRIMARY KEY AUTOINCREMENT
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================================
--  STAGING LAYER  (raw)
-- ============================================================================

-- Grain: one source row per employee allocation (ATCP Headcount.xlsx)
CREATE TABLE IF NOT EXISTS stg_headcount (
    SourceRowID       INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceFile        TEXT,
    IngestedAt        TEXT DEFAULT (datetime('now')),

    PersonnelNo       TEXT,
    EnterpriseID      TEXT,
    EmailAddress      TEXT,
    Name              TEXT,
    Level             TEXT,
    JobProfile        TEXT,
    ProjectRole       TEXT,
    EmploymentStatus  TEXT,
    ResourceType      TEXT,
    ActivityType      TEXT,
    JoinDate          TEXT,
    HomeLoc           TEXT,
    CurrLoc           TEXT,
    Country           TEXT,

    OrgLevel5         TEXT,
    OrgLevel6         TEXT,
    OrgLevel7         TEXT,
    OrgLevel8         TEXT,
    BusinessGroup     TEXT,
    Practice          TEXT,
    Market            TEXT,
    MarketUnit        TEXT,

    CapabilityMapping TEXT,
    CapabilityOwner   TEXT,

    PrimarySkill      TEXT,
    SecondarySkill    TEXT,
    ProficiencyLatest TEXT,
    LatestCycle       TEXT,

    Project           TEXT,
    Client            TEXT,
    Engagement        TEXT,
    FTE               REAL,
    FTEPercent        REAL,
    ProjectStartDate  TEXT,
    RollOffDate       TEXT
);

-- Grain: one source row per employee (Consolidated HC Mandatory Training Tracker)
CREATE TABLE IF NOT EXISTS stg_training_consolidated (
    SourceRowID                     INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceFile                      TEXT,
    IngestedAt                      TEXT DEFAULT (datetime('now')),

    EnterpriseID                    TEXT,
    Name                            TEXT,
    Capability                      TEXT,
    CapabilityOwner                 TEXT,
    MD                              TEXT,

    FDETrainingStatus               TEXT,
    RDEWorkshopCompletion           TEXT,
    ReinventionGarageCompleters     TEXT,
    GenAIStatus                     TEXT,
    AgenticAIStatus                 TEXT,

    RawPayload                      TEXT           -- catch-all JSON for wide-format columns
);

-- Grain: one enrollment per employee/course/reference id (Prism)
CREATE TABLE IF NOT EXISTS stg_learning_enrollment (
    ReferenceID              TEXT PRIMARY KEY,
    SourceFile               TEXT,
    IngestedAt               TEXT DEFAULT (datetime('now')),

    EnterpriseID             TEXT,
    CourseCode               TEXT,
    CourseName               TEXT,
    CompletionStatus         TEXT,
    RegistrationStatus       TEXT,
    CourseAttendanceStatus   TEXT,
    CompletionDate           TEXT,
    LatestEnrollmentFlag     INTEGER CHECK (LatestEnrollmentFlag IN (0,1))
);

-- Grain: one employee/RDE record (MAGS and IIS tracker) — restricted access
CREATE TABLE IF NOT EXISTS stg_rde (
    SourceRowID    INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceFile     TEXT,
    IngestedAt     TEXT DEFAULT (datetime('now')),

    EnterpriseID   TEXT,
    Name           TEXT,
    RDEWorkshop    TEXT,
    NominationDate TEXT,
    CompletionDate TEXT,
    Cohort         TEXT
);


-- ============================================================================
--  INTEGRATION LAYER  —  DIMENSIONS
-- ============================================================================

-- Conformed employee identity (SCD Type 2)
CREATE TABLE IF NOT EXISTS dim_person (
    PersonKey         INTEGER PRIMARY KEY AUTOINCREMENT,
    EnterpriseID      TEXT NOT NULL,                       -- alt key (lowercase, trimmed, no @domain)
    PersonnelNo       TEXT,
    FullName          TEXT NOT NULL,
    EmailAddress      TEXT,
    ManagementLevel   TEXT,                                -- keep as text — do NOT convert to numeric
    JobProfile        TEXT,
    ProjectRole       TEXT,
    EmploymentStatus  TEXT,
    ResourceType      TEXT,
    ActivityType      TEXT,
    JoinDate          TEXT,
    HomeLocation      TEXT,
    CurrentLocation   TEXT,
    Country           TEXT,
    IsActive          INTEGER NOT NULL CHECK (IsActive IN (0,1)),  -- Rule needed: active-status mapping
    -- UI-facing extensions (not in the original workbook — needed for the compatibility layer)
    PeopleLeadEID     TEXT,                                -- self-reference by EID (mirrors upstream HR field)
    AvatarColor       TEXT,                                -- pu | te | co | bl | pi | am | dk
    -- SCD2 metadata
    EffectiveFrom     TEXT NOT NULL,
    EffectiveTo       TEXT,
    IsCurrent         INTEGER NOT NULL CHECK (IsCurrent IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_dim_person_eid    ON dim_person(EnterpriseID);
CREATE INDEX IF NOT EXISTS idx_dim_person_curr   ON dim_person(EnterpriseID, IsCurrent);

-- Org hierarchy dimension
CREATE TABLE IF NOT EXISTS dim_organization (
    OrganizationKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    OrgLevel5        TEXT,
    OrgLevel6        TEXT,
    OrgLevel7        TEXT,
    OrgLevel8        TEXT,
    BusinessGroup    TEXT,
    Practice         TEXT,
    Market           TEXT,
    MarketUnit       TEXT
);

-- Canonical capability catalog
CREATE TABLE IF NOT EXISTS dim_capability (
    CapabilityKey        INTEGER PRIMARY KEY AUTOINCREMENT,
    CapabilityName       TEXT NOT NULL UNIQUE,                    -- alt key
    CapabilityOwnerEID   TEXT,                                    -- FK-resolved to dim_person later
    ManagingDirectorEID  TEXT
);

-- Canonical skill catalog
CREATE TABLE IF NOT EXISTS dim_skill (
    SkillKey    INTEGER PRIMARY KEY AUTOINCREMENT,
    SkillID     TEXT UNIQUE,
    SkillName   TEXT NOT NULL,
    SkillFamily TEXT
);

-- Course catalog (Prism)
CREATE TABLE IF NOT EXISTS dim_course (
    CourseKey      INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseCode     TEXT UNIQUE,
    CourseName     TEXT NOT NULL,
    Category       TEXT,
    Provider       TEXT,
    -- UI-facing extensions
    DurationHours  REAL,
    URL            TEXT,
    DueDate        TEXT,
    Icon           TEXT
);

-- Certification catalog (⚠ new source required — placeholder for portal display)
CREATE TABLE IF NOT EXISTS dim_certification (
    CertificationKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    CertificationCode TEXT UNIQUE NOT NULL,   -- AZ-900, ITIL4-F, etc.
    CertificationName TEXT NOT NULL,
    Provider          TEXT,
    Level             TEXT,                   -- Foundation | Associate | Expert | Professional
    StudyURL          TEXT,
    PracticeURL       TEXT,
    Badge             TEXT
);

-- Program catalog (portal-facing rollup — one row per program code)
CREATE TABLE IF NOT EXISTS dim_program (
    ProgramKey   INTEGER PRIMARY KEY AUTOINCREMENT,
    ProgramCode  TEXT UNIQUE NOT NULL,   -- FDE_CORE, RDE_WORKSHOP, GENAI, AGENTIC_AI
    ProgramName  TEXT NOT NULL,
    Description  TEXT
);

-- Project / engagement dimension
CREATE TABLE IF NOT EXISTS dim_project (
    ProjectKey       INTEGER PRIMARY KEY AUTOINCREMENT,
    ProjectID        TEXT UNIQUE,
    ProjectName      TEXT NOT NULL,
    EngagementID     TEXT,
    EngagementName   TEXT,
    ClientID         TEXT,
    ClientName       TEXT,
    Industry         TEXT,
    LeadershipEID    TEXT
);

-- Calendar dimension (DateKey = YYYYMMDD)
CREATE TABLE IF NOT EXISTS dim_date (
    DateKey        INTEGER PRIMARY KEY,      -- e.g. 20260907
    FullDate       TEXT NOT NULL UNIQUE,     -- ISO YYYY-MM-DD
    DayOfWeek      INTEGER,
    DayName        TEXT,
    MonthNumber    INTEGER,
    MonthName      TEXT,
    Quarter        INTEGER,
    Year           INTEGER,
    IsWeekend      INTEGER CHECK (IsWeekend IN (0,1))
);


-- ============================================================================
--  INTEGRATION LAYER  —  BRIDGES  (resolve M:N)
-- ============================================================================

-- Person ↔ Project allocation (never count these rows as headcount)
CREATE TABLE IF NOT EXISTS bridge_person_project (
    PersonProjectKey      INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey             INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    ProjectKey            INTEGER NOT NULL REFERENCES dim_project(ProjectKey),
    FTE                   REAL,
    FTEPercent            REAL,
    ProjectStartDate      TEXT,
    RollOffDate           TEXT,
    IsPrimaryAllocation   INTEGER CHECK (IsPrimaryAllocation IN (0,1))  -- Rule needed
);
CREATE INDEX IF NOT EXISTS idx_bpp_person  ON bridge_person_project(PersonKey);
CREATE INDEX IF NOT EXISTS idx_bpp_project ON bridge_person_project(ProjectKey);

-- Person ↔ Skill proficiency (primary/secondary, over cycles)
CREATE TABLE IF NOT EXISTS bridge_person_skill (
    PersonSkillKey    INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey         INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    SkillKey          INTEGER NOT NULL REFERENCES dim_skill(SkillKey),
    SkillType         TEXT NOT NULL CHECK (SkillType IN ('Primary','Secondary')),
    ProficiencyCode   TEXT,
    AssessmentCycle   TEXT
);
CREATE INDEX IF NOT EXISTS idx_bps_person ON bridge_person_skill(PersonKey);
CREATE INDEX IF NOT EXISTS idx_bps_skill  ON bridge_person_skill(SkillKey);


-- ============================================================================
--  DATA MART LAYER  —  FACTS
-- ============================================================================

-- Latest training outcome per person / course (governed)
CREATE TABLE IF NOT EXISTS fact_training_status (
    TrainingStatusKey     INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey             INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    CourseKey             INTEGER NOT NULL REFERENCES dim_course(CourseKey),
    Status                TEXT NOT NULL,
    RegistrationStatus    TEXT,
    AttendanceStatus      TEXT,
    CompletionDateKey     INTEGER REFERENCES dim_date(DateKey),
    LatestEnrollmentFlag  INTEGER CHECK (LatestEnrollmentFlag IN (0,1)),
    SourcePriority        INTEGER NOT NULL              -- Rule needed: Consolidated vs Prism
);
CREATE INDEX IF NOT EXISTS idx_fts_person ON fact_training_status(PersonKey);
CREATE INDEX IF NOT EXISTS idx_fts_course ON fact_training_status(CourseKey);

-- Program status (FDE / RDE / Gen AI / Agentic AI / Reinvention Garage)
CREATE TABLE IF NOT EXISTS fact_program_status (
    ProgramStatusKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey         INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    ProgramCode       TEXT NOT NULL,                    -- FDE_CORE | RDE_WORKSHOP | GENAI | AGENTIC_AI
    ProgramStatus     TEXT NOT NULL,                    -- Completed | In Progress | Not Started | Incomplete
    StatusDateKey     INTEGER REFERENCES dim_date(DateKey),
    SourceFile        TEXT NOT NULL                     -- lineage
);
CREATE INDEX IF NOT EXISTS idx_fps_person  ON fact_program_status(PersonKey);
CREATE INDEX IF NOT EXISTS idx_fps_program ON fact_program_status(ProgramCode);

-- Certification history / goals (⚠ new source required — no data yet)
CREATE TABLE IF NOT EXISTS fact_certification (
    CertificationKey   INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey          INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    CertificationCode  TEXT NOT NULL,                   -- e.g. AZ-900, AZ-204
    GoalStatus         TEXT,
    TargetDateKey      INTEGER REFERENCES dim_date(DateKey),
    CompletionDateKey  INTEGER REFERENCES dim_date(DateKey),
    ExpiryDateKey      INTEGER REFERENCES dim_date(DateKey),
    EvidenceURL        TEXT
);
CREATE INDEX IF NOT EXISTS idx_fcert_person ON fact_certification(PersonKey);

-- Derived program badges + manually governed awards
CREATE TABLE IF NOT EXISTS fact_achievement (
    AchievementKey    INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey         INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    AchievementCode   TEXT NOT NULL,
    AchievementName   TEXT,
    AwardedDateKey    INTEGER REFERENCES dim_date(DateKey),
    RuleVersion       TEXT,                             -- derivation lineage
    SourceFile        TEXT
);
CREATE INDEX IF NOT EXISTS idx_facha_person ON fact_achievement(PersonKey);

-- READY score snapshot (auditable; components + total per rule version)
CREATE TABLE IF NOT EXISTS fact_ready_snapshot (
    ReadySnapshotKey        INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonKey               INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    SnapshotDateKey         INTEGER NOT NULL REFERENCES dim_date(DateKey),
    RuleVersion             TEXT NOT NULL,                 -- FK-alias to cfg_ready_rule
    TrainingScore           REAL,
    ProficiencyScore        REAL,
    CertificationScore      REAL,
    AchievementScore        REAL,
    ReadyScore              REAL,                          -- weighted, approved formula
    DataCompletenessPercent REAL NOT NULL,
    IsRankingEligible       INTEGER NOT NULL CHECK (IsRankingEligible IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_frs_person   ON fact_ready_snapshot(PersonKey);
CREATE INDEX IF NOT EXISTS idx_frs_snapshot ON fact_ready_snapshot(SnapshotDateKey);

-- Pre-aggregated people-lead / capability metrics
CREATE TABLE IF NOT EXISTS fact_team_snapshot (
    TeamSnapshotKey    INTEGER PRIMARY KEY AUTOINCREMENT,
    ScopeType          TEXT NOT NULL,                     -- 'people_lead' | 'capability' | 'org'
    ScopeID            TEXT NOT NULL,                     -- PL EID / capability name / org id
    SnapshotDateKey    INTEGER NOT NULL REFERENCES dim_date(DateKey),
    MetricKey          TEXT NOT NULL,                     -- headcount | avg_ready_score | compliance_pct
    MetricValue        REAL NOT NULL,
    UNIQUE (ScopeType, ScopeID, SnapshotDateKey, MetricKey)
);


-- ============================================================================
--  CONFIGURATION LAYER  (control tables — govern rules & lookups)
-- ============================================================================

-- Portal contact directory (CapDev Lead, RDE POC, etc.)
CREATE TABLE IF NOT EXISTS cfg_portal_contact (
    PortalContactKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    CapabilityKey     INTEGER REFERENCES dim_capability(CapabilityKey),   -- null = enterprise-wide
    ContactRole       TEXT NOT NULL,
    PersonKey         INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    EffectiveFrom     TEXT NOT NULL,
    EffectiveTo       TEXT
);

-- Which training applies to which population
CREATE TABLE IF NOT EXISTS cfg_training_applicability (
    ApplicabilityKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseKey         INTEGER NOT NULL REFERENCES dim_course(CourseKey),
    PopulationRule    TEXT NOT NULL,     -- e.g. "capability = 'Cloud'"; JSON also acceptable
    EffectiveFrom     TEXT NOT NULL,
    EffectiveTo       TEXT
);

-- Proficiency scale — ordered codes + display labels
CREATE TABLE IF NOT EXISTS cfg_proficiency_rule (
    ProficiencyRuleKey INTEGER PRIMARY KEY AUTOINCREMENT,
    ProficiencyCode    TEXT NOT NULL,
    DisplayLabel       TEXT NOT NULL,
    RankOrder          INTEGER NOT NULL,
    RuleVersion        TEXT NOT NULL,
    UNIQUE (ProficiencyCode, RuleVersion)
);

-- READY-score rule: weights, thresholds, missing-data treatment, cohort logic
CREATE TABLE IF NOT EXISTS cfg_ready_rule (
    ReadyRuleKey                 INTEGER PRIMARY KEY AUTOINCREMENT,
    RuleVersion                  TEXT NOT NULL UNIQUE,
    ScoreComponent               TEXT NOT NULL,          -- Training | Proficiency | Certification | Achievement
    ComponentWeight              REAL NOT NULL,
    Threshold                    REAL,
    MissingDataTreatment         TEXT,                   -- 'ignore' | 'zero' | 'exclude_person'
    CohortLogic                  TEXT,
    EffectiveFrom                TEXT NOT NULL,
    EffectiveTo                  TEXT
);

-- Portal helpful links (learning + support) by audience
CREATE TABLE IF NOT EXISTS cfg_helpful_link (
    HelpfulLinkKey  INTEGER PRIMARY KEY AUTOINCREMENT,
    LinkLabel       TEXT NOT NULL,
    LinkURL         TEXT NOT NULL,
    Audience        TEXT,                                -- e.g. 'all' | 'people_lead' | 'capability:Cloud'
    EffectiveFrom   TEXT NOT NULL,
    EffectiveTo     TEXT
);


-- ============================================================================
--  UI-FACING PHYSICAL TABLES  (not part of the star schema — write-through)
-- ============================================================================

-- 1:1 check-in notes captured live from the portal.
-- Kept as a physical table because the UI writes to it and the workbook has
-- no equivalent entity.
CREATE TABLE IF NOT EXISTS checkins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id     INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    pl_id         INTEGER NOT NULL REFERENCES dim_person(PersonKey),
    checkin_type  TEXT DEFAULT '1:1 Note',
    notes         TEXT,
    sentiment     TEXT DEFAULT 'neutral',           -- positive | neutral | needs_support
    checkin_date  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkins_worker ON checkins(worker_id);
CREATE INDEX IF NOT EXISTS idx_checkins_pl     ON checkins(pl_id);


-- ============================================================================
--  PORTAL AUTHORIZATION (RBAC)
-- ============================================================================

-- EnterpriseID is not a direct FK because dim_person is SCD Type 2 and can
-- contain multiple historical rows per EnterpriseID. The triggers below
-- enforce that portal users link to a current person record.
CREATE TABLE IF NOT EXISTS rbac_portal_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    EnterpriseID TEXT UNIQUE,
    is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS rbac_portal_users_validate_insert
BEFORE INSERT ON rbac_portal_users
FOR EACH ROW
WHEN NEW.EnterpriseID IS NOT NULL
 AND NOT EXISTS (
     SELECT 1 FROM dim_person
     WHERE EnterpriseID = NEW.EnterpriseID AND IsCurrent = 1
 )
BEGIN
    SELECT RAISE(ABORT, 'RBAC EnterpriseID must match a current dim_person record');
END;

CREATE TRIGGER IF NOT EXISTS rbac_portal_users_validate_update
BEFORE UPDATE OF EnterpriseID ON rbac_portal_users
FOR EACH ROW
WHEN NEW.EnterpriseID IS NOT NULL
 AND NOT EXISTS (
     SELECT 1 FROM dim_person
     WHERE EnterpriseID = NEW.EnterpriseID AND IsCurrent = 1
 )
BEGIN
    SELECT RAISE(ABORT, 'RBAC EnterpriseID must match a current dim_person record');
END;

CREATE TABLE IF NOT EXISTS rbac_roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS rbac_permissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS rbac_role_permissions (
    role_id       INTEGER NOT NULL REFERENCES rbac_roles(id),
    permission_id INTEGER NOT NULL REFERENCES rbac_permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS rbac_user_role_assignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES rbac_portal_users(id),
    role_id     INTEGER NOT NULL REFERENCES rbac_roles(id),
    is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, role_id)
);

-- Team access is derived from PeopleLeadEID. Explicit scopes are reserved for
-- Managing Director capability teams or organization-wide administration.
CREATE TABLE IF NOT EXISTS rbac_user_role_scopes (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_role_assignment_id INTEGER NOT NULL
                                REFERENCES rbac_user_role_assignments(id),
    scope_type              TEXT NOT NULL
                                CHECK (scope_type IN ('capability_team', 'organization')),
    scope_capability_key    INTEGER REFERENCES dim_capability(CapabilityKey),
    scope_org_value         TEXT,
    CHECK (
        (scope_type = 'capability_team'
            AND scope_capability_key IS NOT NULL
            AND scope_org_value IS NULL)
        OR
        (scope_type = 'organization'
            AND scope_capability_key IS NULL
            AND scope_org_value = 'org')
    ),
    UNIQUE (
        user_role_assignment_id, scope_type, scope_capability_key, scope_org_value
    )
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rbac_scopes_org_unique
    ON rbac_user_role_scopes(user_role_assignment_id)
    WHERE scope_type = 'organization';
CREATE UNIQUE INDEX IF NOT EXISTS idx_rbac_scopes_capability_unique
    ON rbac_user_role_scopes(user_role_assignment_id, scope_capability_key)
    WHERE scope_type = 'capability_team';

CREATE TABLE IF NOT EXISTS rbac_authorization_audit (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER REFERENCES rbac_portal_users(id),
    action        TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id   TEXT,
    outcome       TEXT NOT NULL CHECK (outcome IN ('allowed', 'denied')),
    request_id    TEXT,
    occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rbac_user_role_active
    ON rbac_user_role_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_actor
    ON rbac_authorization_audit(actor_user_id, occurred_at);
