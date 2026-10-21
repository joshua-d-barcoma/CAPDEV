import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { DateFilter } from '../components/DateFilter.jsx';
import { EmployeeForm } from '../components/EmployeeForm.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { getEmployeeRoute, ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import {
  getCapabilityReadiness,
  getEmployeeCountsBy,
  filterEmployees,
  getBenchTenureCounts,
  getCareerLevelCounts,
  getEmployeeFilterOptions,
  getSkillDistribution,
} from '../utils/employeeInsights.js';
import {
  DEMO_COHORT_PROGRESS,
  DEMO_DEPLOYMENT_STAGES,
  DEMO_READINESS_METRICS,
} from '../utils/employeePageDemoData.js';
import { formatDate } from '../utils/formatters.js';

const EMPTY_FILTERS = {
  capability: '',
  careerLevel: '',
  skill: '',
  attendance: '',
  location: '',
  joiningDate: '',
  rollInDate: '',
};

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useBenchData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [dialogEmployee, setDialogEmployee] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredEmployees = useMemo(
    () => filterEmployees(employees, filters, search),
    [employees, filters, search],
  );
  const filterOptions = useMemo(() => getEmployeeFilterOptions(employees), [employees]);
  const tenureBuckets = useMemo(() => getBenchTenureCounts(filteredEmployees), [filteredEmployees]);
  const careerLevels = useMemo(() => getCareerLevelCounts(filteredEmployees), [filteredEmployees]);
  const capabilityReadiness = useMemo(
    () => getCapabilityReadiness(filteredEmployees),
    [filteredEmployees],
  );
  const skillDistribution = useMemo(
    () => getSkillDistribution(filteredEmployees),
    [filteredEmployees],
  );
  const benchStatusCounts = useMemo(
    () => getEmployeeCountsBy(filteredEmployees, 'attendanceStatus'),
    [filteredEmployees],
  );
  const capabilityCounts = useMemo(
    () => getEmployeeCountsBy(filteredEmployees, 'capability'),
    [filteredEmployees],
  );
  const presentCount = filteredEmployees.filter(
    (employee) => employee.attendanceStatus === 'Present',
  ).length;
  const nonComplianceCount = filteredEmployees.filter(
    (employee) => employee.attendanceStatus === 'Unapproved Absence',
  ).length;
  const capabilityCount = new Set(filteredEmployees.map((employee) => employee.capability)).size;
  const careerLevelColors = ['#d9c1e9', '#c79be0', '#b875dc', '#a900e8', '#8700c7', '#5c1680'];
  const careerLevelTotal = careerLevels.reduce((total, item) => total + item.count, 0);
  let careerLevelProgress = 0;
  const careerDonut = careerLevels
    .map((item, index) => {
      const start = careerLevelProgress;
      careerLevelProgress += careerLevelTotal ? (item.count / careerLevelTotal) * 100 : 0;
      return `${careerLevelColors[index]} ${start}% ${careerLevelProgress}%`;
    })
    .join(', ');

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setSearch('');
    setFilters({ ...EMPTY_FILTERS });
  }

  function saveEmployee(values) {
    const saved = dialogEmployee ? updateEmployee(dialogEmployee.id, values) : addEmployee(values);
    if (saved) {
      setFormOpen(false);
      setDialogEmployee(null);
    }
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (employee) => (
        <Link className="employee-link" to={getEmployeeRoute(employee.name)}>
          <span className="avatar-small">
            {employee.name
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </span>
          <span>
            <strong>{employee.name}</strong>
            <small>{employee.careerLevel}</small>
          </span>
        </Link>
      ),
    },
    { key: 'capability', label: 'Capability' },
    { key: 'workLocation', label: 'Location' },
    {
      key: 'skills',
      label: 'Key skills',
      render: (employee) => (
        <span className="skill-inline">{employee.skills.slice(0, 3).join(' · ')}</span>
      ),
    },
    {
      key: 'attendanceStatus',
      label: 'Attendance',
      render: (employee) => <StatusBadge status={employee.attendanceStatus} />,
    },
    {
      key: 'rollInDate',
      label: 'Roll-in date',
      render: (employee) => formatDate(employee.rollInDate),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (employee) => (
        <div className="row-actions">
          <button
            className="text-button"
            aria-label={`Edit ${employee.name}`}
            onClick={() => {
              setDialogEmployee(employee);
              setFormOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="text-button danger-text"
            aria-label={`Delete ${employee.name}`}
            onClick={() => setDeleteTarget(employee)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack employee-page">
      <section className="dashboard-banner employee-banner" aria-labelledby="employees-title">
        <div className="dashboard-banner-copy">
          <h1 id="employees-title">Employees</h1>
          <p>Monitor bench employees, attendance, skills, and deployment readiness.</p>
        </div>
        <div className="dashboard-filters">
          <label className="dashboard-filter">
            <span className="visually-hidden">Filter by location</span>
            <select
              aria-label="Filter by location"
              value={filters.location}
              onChange={(event) => updateFilter('location', event.target.value)}
            >
              <option value="">All Locations</option>
              {filterOptions.locations.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter">
            <span className="visually-hidden">Filter by capability</span>
            <select
              aria-label="Filter by capability"
              value={filters.capability}
              onChange={(event) => updateFilter('capability', event.target.value)}
            >
              <option value="">All Capabilities</option>
              {filterOptions.capabilities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label="Total Bench Employees"
          value={filteredEmployees.length}
          detail="Active bench employees"
          icon="people"
        />
        <StatCard
          label="Present Today"
          value={presentCount}
          detail="Attendance records"
          tone="green"
          icon="check"
        />
        <StatCard
          label="Active Non-Compliance"
          value={nonComplianceCount}
          detail="Requires follow-up"
          tone="orange"
          icon="alert"
        />
        <StatCard
          label="Capabilities"
          value={capabilityCount}
          detail="Across the bench"
          tone="blue"
          icon="capability"
        />
      </div>

      <div className="employee-insights-grid">
        <Panel title="Time in bench" eyebrow="Employee aging">
          <div className="tenure-grid">
            {tenureBuckets.map((bucket) => (
              <div className="tenure-card" key={bucket.label}>
                <strong>{bucket.count}</strong>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Career levels" eyebrow="CL mix">
          <div className="career-level-content">
            <div
              className={`career-level-donut${careerLevelTotal ? '' : ' is-empty'}`}
              role="img"
              aria-label={`${careerLevelTotal} employees across career levels`}
              style={{
                '--career-level-donut': careerLevelTotal
                  ? `conic-gradient(${careerDonut})`
                  : undefined,
              }}
            >
              <span>
                <strong>{careerLevelTotal}</strong>
                <small>employees</small>
              </span>
            </div>
            <ul className="career-level-legend" aria-label="Employee count by career level">
              {careerLevels.map((item, index) => (
                <li key={item.level}>
                  <span className="career-level-key">
                    <i style={{ backgroundColor: careerLevelColors[index] }} />
                    {item.level}
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel
        title="Skill distribution"
        eyebrow="Workforce"
        className="skill-distribution-panel"
        action={<span className="scorecard-measure-label">Validated employee skills</span>}
      >
        {skillDistribution.length > 0 ? (
          <div
            className="skill-distribution-chart"
            role="list"
            aria-label="Employee count by skill"
          >
            {skillDistribution.map(({ skill, count }, index) => {
              const maxCount = skillDistribution[0].count;
              const barHeight = Math.max(10, (count / maxCount) * 100);

              return (
                <div className="skill-distribution-item" role="listitem" key={skill}>
                  <strong>{count}</strong>
                  <div className="skill-distribution-track">
                    <i
                      className={
                        index === 0 ? 'skill-distribution-bar is-leading' : 'skill-distribution-bar'
                      }
                      style={{ height: `${barHeight}%` }}
                      role="img"
                      aria-label={`${skill}: ${count} employees`}
                    />
                  </div>
                  <span title={skill}>{skill}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted-copy">No skill data is available for these employees.</p>
        )}
      </Panel>

      <div className="employee-breakdown-grid">
        <Panel title="Bench Status" eyebrow="Workforce availability">
          <div className="employee-breakdown-list">
            {benchStatusCounts.map(({ label, count }) => (
              <div className="employee-breakdown-row" key={label}>
                <span>{label}</span>
                <i aria-hidden="true">
                  <b
                    style={{
                      width: `${filteredEmployees.length ? (count / filteredEmployees.length) * 100 : 0}%`,
                    }}
                  />
                </i>
                <strong>{count}</strong>
              </div>
            ))}
            {benchStatusCounts.length === 0 && (
              <p className="muted-copy">No status data is available for these employees.</p>
            )}
          </div>
          <p className="scorecard-note">
            Counts are derived from current employee attendance status.
          </p>
        </Panel>

        <Panel
          title="Capability in IIS"
          eyebrow="Employee distribution"
          action={<span className="scorecard-measure-label">{filteredEmployees.length} total</span>}
        >
          <div className="employee-breakdown-list">
            {capabilityCounts.map(({ label, count }) => (
              <div className="employee-breakdown-row" key={label}>
                <span>{label}</span>
                <i aria-hidden="true">
                  <b
                    style={{
                      width: `${filteredEmployees.length ? (count / filteredEmployees.length) * 100 : 0}%`,
                    }}
                  />
                </i>
                <strong>{count}</strong>
              </div>
            ))}
            {capabilityCounts.length === 0 && (
              <p className="muted-copy">No capability data is available for these employees.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Bench by capability"
        eyebrow="Workforce"
        action={
          <button
            type="button"
            className="button button-primary employee-add-button"
            onClick={() => {
              setDialogEmployee(null);
              setFormOpen(true);
            }}
          >
            <span aria-hidden="true">+</span>
            Add employee
          </button>
        }
      >
        <div className="employee-filter-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, capability, or skill"
            label="Search employees"
          />
          <div className="employee-filter-controls">
            <label className="employee-filter-control">
              <span className="visually-hidden">Filter by career level</span>
              <select
                aria-label="Filter by career level"
                value={filters.careerLevel}
                onChange={(event) => updateFilter('careerLevel', event.target.value)}
              >
                <option value="">All Career Levels</option>
                {filterOptions.careerLevels.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="employee-filter-control">
              <span className="visually-hidden">Filter by skill</span>
              <select
                aria-label="Filter by skill"
                value={filters.skill}
                onChange={(event) => updateFilter('skill', event.target.value)}
              >
                <option value="">All Skills</option>
                {filterOptions.skills.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="employee-filter-control">
              <span className="visually-hidden">Filter by attendance</span>
              <select
                aria-label="Filter by attendance"
                value={filters.attendance}
                onChange={(event) => updateFilter('attendance', event.target.value)}
              >
                <option value="">All Attendance</option>
                {filterOptions.attendanceStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <DateFilter
              label="Join date"
              value={filters.joiningDate}
              onChange={(value) => updateFilter('joiningDate', value)}
            />
            <DateFilter
              label="Roll-in date"
              value={filters.rollInDate}
              onChange={(value) => updateFilter('rollInDate', value)}
              alignRight
            />
            <button
              type="button"
              className="button button-reset"
              onClick={resetFilters}
              disabled={!search && Object.values(filters).every((value) => !value)}
            >
              Reset all
            </button>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredEmployees}
          rowKey={(employee) => employee.id}
          emptyTitle="No employees found"
          emptyDescription="Adjust the search or location filter."
        />
      </Panel>

      <Panel
        title="Readiness by Capability"
        eyebrow="Bench scorecard"
        action={<span className="scorecard-measure-label">Illustrative demo data</span>}
      >
        <div className="table-scroll">
          <table className="data-table readiness-table">
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">HC</th>
                <th scope="col">Attendance / RTO</th>
                <th scope="col">Mandatory Training</th>
                <th scope="col">Proficiency</th>
                <th scope="col">EOD / Deliverables</th>
                <th scope="col">Overall</th>
              </tr>
            </thead>
            <tbody>
              {capabilityReadiness.map((item) => {
                const demoMetrics = DEMO_READINESS_METRICS[item.capability] ?? {
                  mandatoryTraining: 82,
                  proficiency: 76,
                  deliverables: 88,
                };
                const trackedScores = [
                  item.attendancePercent,
                  demoMetrics.mandatoryTraining,
                  demoMetrics.proficiency,
                  demoMetrics.deliverables,
                ].filter((score) => score !== null);
                const overall = Math.round(
                  trackedScores.reduce((total, score) => total + score, 0) / trackedScores.length,
                );

                return (
                  <tr key={item.capability}>
                    <td>{item.capability}</td>
                    <td>{item.headcount}</td>
                    <td>{item.attendancePercent === null ? '—' : `${item.attendancePercent}%`}</td>
                    <td>{demoMetrics.mandatoryTraining}%</td>
                    <td>{demoMetrics.proficiency}%</td>
                    <td>{demoMetrics.deliverables}%</td>
                    <td>
                      <strong>{overall}%</strong>
                    </td>
                  </tr>
                );
              })}
              {capabilityReadiness.length === 0 && (
                <tr>
                  <td colSpan={7} className="untracked-metric">
                    No matching employee data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="scorecard-note">
          Headcount and attendance use the selected employee records. Training, proficiency, and
          deliverables are illustrative demo values; the overall score includes both live and demo
          metrics.
        </p>
      </Panel>

      <div className="deployment-insights-grid">
        <Panel
          title="Deployment Pipeline"
          eyebrow="Bench to billable"
          className="deployment-pipeline-panel"
        >
          <p className="deployment-panel-description">Interview and endorsement progress</p>
          <div className="demo-stage-list">
            {DEMO_DEPLOYMENT_STAGES.map((stage) => (
              <div className="demo-stage-row" key={stage.label}>
                <span>{stage.label}</span>
                <i aria-hidden="true">
                  <b
                    style={{ width: `${(stage.count / DEMO_DEPLOYMENT_STAGES[0].count) * 100}%` }}
                  />
                </i>
                <strong>{stage.count.toString().padStart(2, '0')}</strong>
              </div>
            ))}
          </div>
          <p className="scorecard-note">
            Illustrative demo pipeline counts — not live employee data.
          </p>
        </Panel>
        <Panel
          title="Development Cohorts"
          eyebrow="Capability opportunities"
          className="deployment-pipeline-panel"
          action={
            <Link className="text-link" to={ROUTES.learning}>
              View learning
            </Link>
          }
        >
          <p className="deployment-panel-description">
            Bench development missions · illustrative demo progress
          </p>
          <div className="cohort-summary-list">
            {DEMO_COHORT_PROGRESS.map((cohort) => (
              <article className="cohort-summary-row demo-cohort-row" key={cohort.name}>
                <div>
                  <strong>{cohort.name}</strong>
                  <span>{cohort.focus}</span>
                  <i aria-label={`${cohort.progress}% demo mission progress`}>
                    <b style={{ width: `${cohort.progress}%` }} />
                  </i>
                  <small>{cohort.progress}% demo mission progress</small>
                </div>
                <small>{cohort.members} demo members</small>
              </article>
            ))}
          </div>
          <p className="scorecard-note">
            Demo cohort counts and progress are illustrative and are not linked to employee records.
          </p>
        </Panel>
      </div>

      {formOpen && (
        <EmployeeForm
          employee={dialogEmployee}
          onSubmit={saveEmployee}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete employee?"
          message={`Remove ${deleteTarget.name} and their attendance records from this demo workspace?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteEmployee(deleteTarget.id)) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
