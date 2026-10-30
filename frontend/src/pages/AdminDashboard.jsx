import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeScopeFilters } from '../components/EmployeeScopeFilters.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { buildAttendanceTrend, filterDashboardData } from '../utils/dashboardFilters.js';
import { getEmployeeFilterOptions } from '../utils/employeeInsights.js';
import { getEmployeeName, getInitials } from '../utils/formatters.js';

function AttendanceTrendChart({ trend }) {
  const visibleTrend = trend.slice(-7);
  const points = visibleTrend.map((day, index) => {
    const x = visibleTrend.length === 1 ? 220 : 38 + (index * 364) / (visibleTrend.length - 1);
    const y = 132 - day.percentage;
    return { ...day, x, y };
  });
  const line = points.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} 138 L ${points[0].x} 138 Z`
    : '';

  return (
    <div className="admin-trend-chart">
      <svg
        viewBox="0 0 440 166"
        role="img"
        aria-label={`Attendance trend: ${visibleTrend.map((day) => `${day.date}, ${day.percentage}%`).join('; ')}`}
      >
        <defs>
          <linearGradient id="attendance-area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9741f5" stopOpacity=".24" />
            <stop offset="100%" stopColor="#9741f5" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((percentage) => {
          const y = 132 - percentage;
          return (
            <g key={percentage}>
              <text x="0" y={y + 3} className="admin-chart-axis-label">
                {percentage}%
              </text>
              <line x1="35" x2="432" y1={y} y2={y} className="admin-chart-gridline" />
            </g>
          );
        })}
        {points.length > 0 && (
          <>
            <path d={area} fill="url(#attendance-area-fill)" />
            <path d={line} className="admin-chart-line" />
            {points.map((point) => (
              <g key={point.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  className="admin-chart-point"
                  tabIndex="0"
                  aria-label={`${point.date}: ${point.present} of ${point.total} present (${point.percentage}%)`}
                >
                  <title>
                    {`${new Date(`${point.date}T00:00:00`).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}: ${point.present} of ${point.total} present (${point.percentage}%)`}
                  </title>
                </circle>
                <text x={point.x} y="157" textAnchor="middle" className="admin-chart-date">
                  {new Date(`${point.date}T00:00:00`).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

export default function AdminDashboard() {
  const data = useBenchData();
  const [location, setLocation] = useState('');
  const [capability, setCapability] = useState('');
  const { employees, attendanceRecords, actionItems } = useMemo(
    () => filterDashboardData(data, { location, capability }),
    [data, location, capability],
  );
  const capabilities = useMemo(() => getEmployeeFilterOptions(employees).capabilities, [employees]);
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
  const employeesOnLeave = employees.filter(
    (employee) => employee.attendanceStatus === 'Vacation Leave',
  ).length;
  const trackedSkills = new Set(employees.flatMap((employee) => employee.skills ?? [])).size;
  const hasActiveFilters = Boolean(location || capability);

  return (
    <div className="page-stack admin-dashboard">
      <section className="dashboard-banner employee-scope-banner" aria-labelledby="dashboard-title">
        <div className="employee-scope-banner-heading">
          <div className="dashboard-banner-copy">
            <h1 id="dashboard-title">DASHBOARD</h1>
            <p>Overview of bench resources and workforce readiness.</p>
          </div>
        </div>
        <EmployeeScopeFilters
          employees={data.employees}
          location={location}
          capability={capability}
          onChange={(name, value) => {
            if (name === 'location') setLocation(value);
            if (name === 'capability') setCapability(value);
          }}
        />
      </section>
      <div className="stat-grid admin-dashboard-metrics">
        <StatCard
          label="Total Bench Employees"
          value={employees.length}
          detail="Across all capabilities"
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
          label="Non-Compliant Employees"
          value={exceptions}
          detail="Require RTO follow-up"
          tone="red"
          icon="alert"
        />
        <StatCard
          label="Employees on Leave"
          value={employeesOnLeave}
          detail="Approved leave today"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Active Capabilities"
          value={capabilities.length}
          detail="Across filtered resources"
          tone="blue"
          icon="capability"
        />
        <StatCard
          label="Skills Tracked"
          value={trackedSkills}
          detail="Unique employee skills"
          icon="✦"
        />
        <StatCard
          label="Open Action Items"
          value={openActions.length}
          detail={`${openActions.filter((item) => item.priority === 'High').length} high priority`}
          tone="orange"
          icon="flag"
        />
      </div>

      <div className="admin-dashboard-overview-grid">
        <Panel
          title="Bench by capability"
          eyebrow="Bench distribution"
          className="admin-dashboard-panel"
        >
          <div className="bar-list">
            {capabilities.map((item) => {
              const count = employees.filter((employee) => employee.capability === item).length;
              const width = employees.length ? Math.max(8, (count / employees.length) * 100) : 0;
              const tooltip = `${item}: ${count} ${count === 1 ? 'employee' : 'employees'} (${employees.length ? Math.round((count / employees.length) * 100) : 0}% of filtered bench)`;
              return (
                <div
                  className="bar-row chart-data-tooltip"
                  data-chart-tooltip={tooltip}
                  title={tooltip}
                  key={item}
                >
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
          className="admin-dashboard-panel"
          action={
            <Link className="text-link dashboard-records-link" to={ROUTES.attendance}>
              View roster <span aria-hidden="true">↗</span>
            </Link>
          }
        >
          <div className="compact-list admin-attendance-list">
            {employees.slice(0, 5).map((employee) => (
              <div className="compact-row" key={employee.id}>
                <span className="avatar-small">{getInitials(employee.name)}</span>
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
          {employees.length > 0 && (
            <p className="admin-list-note">
              Showing {Math.min(employees.length, 5)} of {employees.length} employees
            </p>
          )}
        </Panel>
      </div>

      <div className="admin-dashboard-lower-grid">
        <Panel
          title="Attendance trend"
          eyebrow="Recent activity"
          className="admin-dashboard-panel admin-trend-panel"
        >
          {attendanceTrend.length ? (
            <>
              <div className="admin-trend-meta">
                <span>
                  {attendanceTrend.length > 1
                    ? `${attendanceTrend[0].date} – ${attendanceTrend[attendanceTrend.length - 1].date}`
                    : attendanceTrend[0].date}
                </span>
                <span className="admin-trend-legend">
                  <i aria-hidden="true" /> Attendance
                </span>
              </div>
              <AttendanceTrendChart trend={attendanceTrend} />
            </>
          ) : (
            <p className="muted-copy">No attendance records match these filters.</p>
          )}
        </Panel>

        <Panel
          title="Action items"
          eyebrow="Follow-up"
          className="admin-dashboard-panel admin-action-panel"
          action={
            <Link className="text-link admin-view-all" to={ROUTES.actionItems}>
              View all <span aria-hidden="true">↗</span>
            </Link>
          }
        >
          {hasActiveFilters && (
            <p className="panel-description">
              Filtered counts include only action items linked to matching employees.
            </p>
          )}
          {openActions.length ? (
            <div className="admin-action-table-wrap">
              <table className="admin-action-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Due date</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openActions.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.owner}</td>
                      <td>{item.due}</td>
                      <td>
                        <span
                          className={`admin-priority admin-priority-${item.priority.toLowerCase()}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted-copy">
              {hasActiveFilters
                ? 'No open action items are linked to matching employees.'
                : 'No open action items.'}
            </p>
          )}
        </Panel>
      </div>
      {attendanceRecords.length > 0 && (
        <span className="visually-hidden">
          Latest attendance recorded for{' '}
          {getEmployeeName(attendanceRecords[0].employeeId, employees)}
        </span>
      )}
    </div>
  );
}