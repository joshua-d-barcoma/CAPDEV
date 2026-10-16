import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { getEmployeeName } from '../utils/formatters.js';

export default function AdminDashboard() {
  const { employees, attendanceRecords, actionItems } = useBenchData();
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Bench Management"
        title="Bench Overview"
        description="Capability counts and workforce readiness at a glance."
      />
      <div className="stat-grid">
        <StatCard
          label="Total Bench Employees"
          value={employees.length}
          detail="Active bench employees"
          icon="♙"
        />
        <StatCard
          label="Attendance Today"
          value={`${attendancePercent}%`}
          detail={`${presentCount} of ${employees.length} present`}
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Active Non-Compliance"
          value={exceptions}
          detail="Employees requiring follow-up"
          tone="orange"
          icon="!"
        />
        <StatCard
          label="Open Action Items"
          value={openActions.length}
          detail={`${openActions.filter((item) => item.priority === 'High').length} high priority`}
          tone="blue"
          icon="⚑"
        />
      </div>

      <div className="two-column-grid">
        <Panel title="Bench by capability" eyebrow="Workforce">
          <div className="bar-list">
            {['Hybrid Cloud', 'Cloud Customer Edge', 'Network', 'Service Management'].map(
              (capability) => {
                const count = employees.filter((employee) =>
                  employee.capability.toLowerCase().includes(capability.toLowerCase()),
                ).length;
                const width = employees.length ? Math.max(8, (count / employees.length) * 100) : 0;
                return (
                  <div className="bar-row" key={capability}>
                    <span>{capability}</span>
                    <div className="bar-track">
                      <i style={{ width: `${width}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              },
            )}
          </div>
        </Panel>
        <Panel
          title="Today's attendance"
          eyebrow="Attendance"
          action={
            <Link className="text-link" to={ROUTES.attendance}>
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
          </div>
        </Panel>
      </div>

      <Panel
        title="Action items"
        eyebrow="Follow-up"
        action={
          <Link className="text-link" to={ROUTES.actionItems}>
            View all
          </Link>
        }
      >
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
          {employees.length === 0 && <p className="muted-copy">No active bench employees.</p>}
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
