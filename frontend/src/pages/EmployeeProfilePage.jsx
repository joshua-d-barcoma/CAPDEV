import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';

const defaultSchedule = {
  Monday: 'Onsite',
  Tuesday: 'Onsite',
  Wednesday: 'Onsite',
  Thursday: 'Onsite',
  Friday: 'Work from home',
};

export default function EmployeeProfilePage() {
  const { employeeName } = useParams();
  const {
    employees,
    tasks,
    attendanceRecords,
    employeeSchedules,
    scheduleRequests,
    reviewScheduleRequest,
    updateEmployeeSchedule,
  } = useBenchData();
  const [scheduleDraft, setScheduleDraft] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const employee = employees.find((item) => item.name === employeeName);
  const schedule = employee ? (employeeSchedules[employee.id] ?? defaultSchedule) : defaultSchedule;
  const employeeTasks = tasks.slice(0, 4);
  const employeeAttendance = useMemo(
    () => attendanceRecords.filter((record) => record.employeeId === employee?.id),
    [attendanceRecords, employee?.id],
  );
  const requests = scheduleRequests.filter((request) => request.employeeId === employee?.id);

  if (!employee) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Bench Management"
          title="Employee not found"
          description="This employee may have been removed or the profile link is invalid."
        />
        <Link className="button button-primary button-fit" to={ROUTES.employees}>
          Return to employees
        </Link>
      </div>
    );
  }

  function saveSchedule() {
    if (employee && updateEmployeeSchedule(employee.id, scheduleDraft ?? schedule)) {
      setScheduleDraft(null);
      setEditingSchedule(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Employee profile"
        title={employee.name}
        description={`${employee.capability} · ${employee.careerLevel}`}
        actions={
          <Link className="button button-secondary" to={ROUTES.employees}>
            ← Back to employees
          </Link>
        }
      />
      <section className="profile-card panel">
        <span className="profile-image profile-monogram">
          {employee.name
            .split(' ')
            .map((part) => part[0])
            .join('')}
        </span>
        <div className="profile-main">
          <div className="profile-name-row">
            <h2>{employee.name}</h2>
            <span className="tag">{employee.careerLevel}</span>
          </div>
          <span className="muted-copy">Bench resource · {employee.workLocation}</span>
        </div>
        <div className="profile-detail">
          <span>Capability</span>
          <strong>{employee.capability}</strong>
        </div>
        <div className="profile-detail">
          <span>Roll-in date</span>
          <strong>{employee.rollInDate}</strong>
        </div>
        <div className="profile-detail profile-skills">
          <span>Skills</span>
          <div className="skill-tags">
            {employee.skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label="Bench tenure"
          value="51 days"
          detail="Since current roll-in date"
          icon="◷"
        />
        <StatCard
          label="Deployment readiness"
          value="60%"
          detail="Profile and learning progress"
          tone="blue"
          icon="↗"
        />
        <StatCard
          label="Training progress"
          value="54%"
          detail="Required training average"
          tone="green"
          icon="◇"
        />
        <StatCard
          label="Attendance records"
          value={employeeAttendance.length}
          detail="Current register entries"
          tone="orange"
          icon="▣"
        />
      </div>
      <div className="two-column-grid">
        <Panel title="Tasks and development" eyebrow="Current plan">
          <div className="compact-list">
            {employeeTasks.map((task) => (
              <div className="compact-row" key={task.id}>
                <span className="compact-row-main">
                  <strong>{task.title}</strong>
                  <small>
                    {task.category} · Due {task.due}
                  </small>
                </span>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Attendance" eyebrow="Latest records">
          <div className="compact-list">
            {employeeAttendance.slice(0, 4).map((record) => (
              <div className="compact-row" key={record.id}>
                <span className="compact-row-main">
                  <strong>{record.date}</strong>
                  <small>
                    {record.timeIn} · {record.workType}
                  </small>
                </span>
                <StatusBadge status={record.status} />
              </div>
            ))}
            {employeeAttendance.length === 0 && <p className="muted-copy">No records available.</p>}
          </div>
        </Panel>
      </div>
      <Panel
        title="Return-to-office schedule"
        eyebrow="Weekly schedule"
        action={
          <button
            className="button button-secondary button-small"
            onClick={() =>
              editingSchedule
                ? saveSchedule()
                : (setScheduleDraft({ ...schedule }), setEditingSchedule(true))
            }
          >
            {editingSchedule ? 'Save schedule' : 'Edit schedule'}
          </button>
        }
      >
        <div className="schedule-list">
          {Object.entries(schedule).map(([day, location]) => (
            <div className="schedule-row" key={day}>
              <strong>{day}</strong>
              {editingSchedule ? (
                <select
                  value={scheduleDraft?.[day] ?? location}
                  onChange={(event) =>
                    setScheduleDraft((current) => ({
                      ...(current ?? schedule),
                      [day]: event.target.value,
                    }))
                  }
                >
                  <option>Onsite</option>
                  <option>Work from home</option>
                </select>
              ) : (
                <StatusBadge status={location} />
              )}
            </div>
          ))}
        </div>
        {requests.map((request) => (
          <div className="request-row" key={request.id}>
            <span>
              {request.kind === 'calendar'
                ? `${request.requestType ?? 'Calendar'} request · ${request.date}`
                : 'Requested schedule change'}{' '}
              · {new Date(request.submittedAt).toLocaleDateString()}
            </span>
            <div className="row-actions">
              <StatusBadge status={request.status} />
              {request.status === 'Pending' && (
                <>
                  <button
                    className="text-button"
                    onClick={() => reviewScheduleRequest(request.id, 'Approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() => reviewScheduleRequest(request.id, 'Rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
