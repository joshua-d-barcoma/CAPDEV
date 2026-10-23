import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import {
  buildAttendanceTrend,
  DASHBOARD_CAPABILITIES,
  DASHBOARD_LOCATIONS,
  filterDashboardData,
} from '../utils/dashboardFilters.js';
import { getEmployeeName } from '../utils/formatters.js';

export default function AdminDashboard() {
  const data = useBenchData();
  const [location, setLocation] = useState('');
  const [capability, setCapability] = useState('');
  const { employees, attendanceRecords, actionItems } = useMemo(
    () => filterDashboardData(data, { location, capability }),
    [data, location, capability],
  );
  const attendanceTrend = useMemo(
    () => buildAttendanceTrend(attendanceRecords),
    [attendanceRecords],
  );
  const presentCount = employees.filter(
    (employee) => employee.attendanceStatus === 'Present',
  ).length;
  const exceptions = employees.filter(
    (employee) => employee.attendanceStatus === 'Unapproved Absence',
  ).length;
  const openActions = actionItems.filter((item) => item.status !== 'Done');
  const attendancePercent = employees.length
    ? Math.round((presentCount / employees.length) * 100)
    : 0;
  const hasActiveFilters = Boolean(location || capability);

  return (
    <div className="page-stack">
      <section className="dashboard-banner" aria-labelledby="dashboard-title">
        <div className="dashboard-banner-copy">
          <h1 id="dashboard-title">Dashboard</h1>
          <p>Overview of bench resources and workforce readiness.</p>
        </div>
        <div className="dashboard-filters">
          <label className="dashboard-filter">
            <span className="visually-hidden">Location</span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              aria-label="Filter by location"
            >
              <option value="">All Locations</option>
              {DASHBOARD_LOCATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter">
            <span className="visually-hidden">Capability</span>
            <select
              value={capability}
              onChange={(event) => setCapability(event.target.value)}
              aria-label="Filter by capability"
            >
              <option value="">All Capabilities</option>
              {DASHBOARD_CAPABILITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label="Total Bench Employees"
          value={employees.length}
          detail="Active bench employees"
          icon="people"
        />
        <StatCard
          label="Attendance Today"
          value={`${attendancePercent}%`}
          detail={`${presentCount} of ${employees.length} present`}
          tone="green"
          icon="check"
        />
        <StatCard
          label="Active Non-Compliance"
          value={exceptions}
          detail="Employees requiring follow-up"
          tone="orange"
          icon="alert"
        />
        <StatCard
          label="Open Action Items"
          value={openActions.length}
          detail={`${openActions.filter((item) => item.priority === 'High').length} high priority`}
          tone="blue"
          icon="flag"
        />
      </div>

      <div className="two-column-grid">
        <Panel title="Bench by capability" eyebrow="Workforce">
          <div className="bar-list">
            {DASHBOARD_CAPABILITIES.map((item) => {
              const count = employees.filter((employee) =>
                employee.capability.toLowerCase().includes(item.toLowerCase()),
              ).length;
              const width = employees.length ? Math.max(8, (count / employees.length) * 100) : 0;
              return (
                <div className="bar-row" key={item}>
                  <span>{item}</span>
                  <div className="bar-track">
                    <i style={{ width: `${width}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="Today's attendance"
          eyebrow="Attendance"
          action={
            <Link className="text-link dashboard-records-link" to={ROUTES.attendance}>
              View records
            </Link>
          }
        >
          <div className="compact-list">
            {employees.slice(0, 5).map((employee) => (
              <div className="compact-row" key={employee.id}>
                <span className="avatar-small">
                  {employee.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <span className="compact-row-main">
                  <strong>{employee.name}</strong>
                  <small>
                    {employee.workLocation} · {employee.capability}
                  </small>
                </span>
                <StatusBadge status={employee.attendanceStatus} />
              </div>
            ))}
            {employees.length === 0 && (
              <p className="muted-copy">No employees match these filters.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Attendance trend" eyebrow="Attendance">
        {attendanceTrend.length ? (
          <div className="attendance-trend" aria-label="Attendance trend by date">
            {attendanceTrend.map((day) => (
              <div className="attendance-trend-row" key={day.date}>
                <span>
                  {new Date(`${day.date}T00:00:00`).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div
                  className="bar-track"
                  role="img"
                  aria-label={`${day.percentage}% attendance, ${day.present} of ${day.total} present`}
                >
                  <i style={{ width: `${day.percentage}%` }} />
                </div>
                <strong>
                  {day.present}/{day.total}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No attendance records match these filters.</p>
        )}
      </Panel>

      <Panel
        title="Action items"
        eyebrow="Follow-up"
        action={
          <Link className="text-link" to={ROUTES.actionItems}>
            View all
          </Link>
        }
      >
        {hasActiveFilters && (
          <p className="panel-description">
            Filtered counts include only action items linked to matching employees.
          </p>
        )}
        <div className="compact-list">
          {openActions.slice(0, 3).map((item) => (
            <div className="compact-row action-preview" key={item.id}>
              <span className={`priority-mark priority-${item.priority.toLowerCase()}`} />
              <span className="compact-row-main">
                <strong>{item.title}</strong>
                <small>
                  {item.owner} · {item.due}
                </small>
              </span>
              <StatusBadge status={item.status} />
            </div>
          ))}
          {openActions.length === 0 && (
            <p className="muted-copy">
              {hasActiveFilters
                ? 'No open action items are linked to matching employees.'
                : 'No open action items.'}
            </p>
          )}
        </div>
      </Panel>
      {attendanceRecords.length > 0 && (
        <span className="visually-hidden">
          Latest attendance recorded for{' '}
          {getEmployeeName(attendanceRecords[0].employeeId, employees)}
        </span>
      )}
    </div>
  );
}
