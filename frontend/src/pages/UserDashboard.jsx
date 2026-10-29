import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/Panel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { formatDate, getInitials } from '../utils/formatters.js';

const WEEKDAYS = [
  { key: 'Monday', label: 'MON' },
  { key: 'Tuesday', label: 'TUE' },
  { key: 'Wednesday', label: 'WED' },
  { key: 'Thursday', label: 'THU' },
  { key: 'Friday', label: 'FRI' },
];

const RECOMMENDATIONS = [
  {
    title: 'Azure Administrator Fundamentals',
    detail: 'Strengthen identity, governance, storage, compute, and networking foundations.',
    tag: 'Cloud skills',
    duration: '4 hours',
  },
  {
    title: 'UiPath Advanced Automation',
    detail: 'Continue developing automation, queue-processing, and exception-handling skills.',
    tag: 'Automation',
    duration: '3 hours',
  },
  {
    title: 'Deployment Interview Practice',
    detail: 'Prepare concise project examples covering cloud support and troubleshooting.',
    tag: 'Deployment',
    duration: '1 hour',
  },
];

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(today) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return WEEKDAYS.map(({ key }, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { day: key, date: formatLocalDate(date) };
  });
}

function MetricIcon({ children }) {
  return (
    <span className="user-metric-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
    </span>
  );
}

function UserMetric({ label, value, detail, note, children }) {
  return (
    <article className="user-metric-card">
      <div className="user-metric-heading">
        {children}
        <span>{label}</span>
      </div>
      <strong className="user-metric-value">{value}</strong>
      <span className="user-metric-detail">{detail}</span>
      {note && <span className="user-metric-note">{note}</span>}
    </article>
  );
}

export default function UserDashboard() {
  const {
    employees,
    tasks,
    checkedIn,
    attendanceRecords,
    employeeSchedules,
    mandatoryTraining,
    learningAssignments,
    certifications,
    updateTask,
    updateLearningAssignment,
    addTask,
    refreshData,
  } = useBenchData();
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const employee =
    employees.find((item) => item.name === 'Alex Santos') ??
    employees.find((item) => !item.employeeStatus || item.employeeStatus === 'Bench');
  const employeeAssignments = useMemo(
    () => learningAssignments.filter((assignment) => assignment.employeeId === employee?.id),
    [employee?.id, learningAssignments],
  );
  const activeTraining = useMemo(
    () =>
      mandatoryTraining
        .filter((training) => training.status === 'Active')
        .map((training) => ({
          training,
          assignment: employeeAssignments.find((item) => item.trainingId === training.id),
        }))
        .filter((item) => item.assignment),
    [employeeAssignments, mandatoryTraining],
  );
  const employeeTasks = useMemo(
    () => tasks.filter((task) => !task.assigneeId || task.assigneeId === employee?.id),
    [employee?.id, tasks],
  );
  const completedTasks = employeeTasks.filter((task) => task.status === 'Completed').length;
  const completedTraining = activeTraining.filter(
    ({ assignment }) => assignment.status === 'Completed',
  ).length;
  const trainingProgress = activeTraining.length
    ? Math.round((completedTraining / activeTraining.length) * 100)
    : 0;
  const pendingTraining = activeTraining.find(
    ({ assignment }) => assignment.status !== 'Completed',
  );
  const today = new Date();
  const weekDates = getWeekDates(today);
  const schedule = employee ? (employeeSchedules[employee.id] ?? {}) : {};
  const employeeAttendance = useMemo(
    () => attendanceRecords.filter((record) => record.employeeId === employee?.id),
    [attendanceRecords, employee?.id],
  );
  const weekAttendance = weekDates.map(({ day, date }) => ({
    day,
    date,
    plan: schedule[day] ?? 'Onsite',
    record: employeeAttendance.find((record) => record.date === date),
  }));
  const scheduledOfficeDays = weekAttendance.filter(({ plan }) => plan === 'Onsite').length;
  const completedOfficeDays = weekAttendance.filter(
    ({ plan, record }) =>
      plan === 'Onsite' && record?.status === 'Present' && record.workType === 'Onsite',
  ).length;
  const weeklyRto = scheduledOfficeDays
    ? Math.round((completedOfficeDays / scheduledOfficeDays) * 100)
    : 0;
  const readinessItems = [
    {
      label: 'Profile completeness',
      detail: 'Name, capability, location, and career level',
      complete: Boolean(
        employee?.name && employee?.capability && employee?.workLocation && employee?.careerLevel,
      ),
    },
    {
      label: 'Skills validation',
      detail: 'At least one skill is listed on your profile',
      complete: Boolean(employee?.skills?.length),
    },
    {
      label: 'Mandatory learning',
      detail: `${completedTraining} of ${activeTraining.length} active items completed`,
      complete: activeTraining.length > 0 && completedTraining === activeTraining.length,
    },
    {
      label: 'Interview readiness',
      detail: 'Capability and three or more skills are recorded',
      complete: Boolean(employee?.capability && (employee?.skills?.length ?? 0) >= 3),
    },
  ];
  const readinessPercent = Math.round(
    (readinessItems.filter((item) => item.complete).length / readinessItems.length) * 100,
  );
  const latestAchievement = useMemo(() => {
    const completedAssignment = employeeAssignments
      .filter((assignment) => assignment.status === 'Completed')
      .sort((first, second) =>
        (second.completionDate ?? '').localeCompare(first.completionDate ?? ''),
      )[0];
    if (completedAssignment) {
      const training = mandatoryTraining.find((item) => item.id === completedAssignment.trainingId);
      if (training) {
        return {
          title: training.title,
          detail: completedAssignment.completionDate
            ? `Completed ${formatDate(completedAssignment.completionDate)} and added to your development record.`
            : 'Completed and added to your development record.',
        };
      }
    }

    const completedCertification = certifications.find((item) => item.status === 'Completed');
    return completedCertification
      ? { title: completedCertification.title, detail: completedCertification.detail }
      : null;
  }, [certifications, employeeAssignments, mandatoryTraining]);
  const enrolledTasks = new Set(
    employeeTasks.filter((task) => task.assigneeId === employee?.id).map((task) => task.title),
  );
  const firstName = employee?.name.split(/\s+/)[0] ?? 'there';
  const todayRecord = employeeAttendance.find((record) => record.date === formatLocalDate(today));

  function handleRefresh() {
    if (refreshData()) setLastRefreshed(new Date());
  }

  function toggleTask(task) {
    updateTask(task.id, task.status === 'Completed' ? 'In Progress' : 'Completed');
  }

  function markTrainingComplete(assignment) {
    if (assignment.status !== 'Completed') {
      updateLearningAssignment(assignment.id, 'Completed');
    }
  }

  function addRecommendation(recommendation) {
    if (!employee || enrolledTasks.has(recommendation.title)) return;
    addTask({
      title: recommendation.title,
      description: recommendation.detail,
      due: 'No due date',
      priority: 'Medium',
      status: 'Not Started',
      category: 'Development',
      assigneeId: employee.id,
    });
  }

  return (
    <div className="page-stack user-dashboard-page">
      <section className="user-dashboard-welcome" aria-labelledby="user-dashboard-title">
        <div className="user-dashboard-welcome-copy">
          <span className="user-dashboard-eyebrow">YOUR PERSONAL OVERVIEW</span>
          <h1 id="user-dashboard-title">Welcome back, {firstName}!</h1>
          <p>Here is your personal bench activity and deployment-readiness overview.</p>
        </div>
        <div className="user-dashboard-refresh">
          <span>
            Demo data ·{' '}
            {lastRefreshed
              ? `Refreshed ${lastRefreshed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
              : 'Not yet refreshed'}
          </span>
          <button type="button" className="button user-refresh-button" onClick={handleRefresh}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 7v5h-5M4.6 9a7.5 7.5 0 0 1 13-2L20 12m-16 5v-5h5m10 3a7.5 7.5 0 0 1-13 2L4 12" />
            </svg>
            Refresh dashboard
          </button>
        </div>
      </section>

      {pendingTraining ? (
        <section className="user-training-alert" aria-label="Mandatory item pending">
          <span className="user-alert-icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Mandatory item pending</strong>
            <span>
              Complete {pendingTraining.training.title} to keep your compliance status current.
            </span>
          </div>
          <Link className="button user-alert-button" to={ROUTES.tasks}>
            View training <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <section className="user-training-alert is-complete" role="status">
          <span className="user-alert-icon" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Mandatory learning complete</strong>
            <span>Your active required learning items are complete.</span>
          </div>
          <Link className="button user-alert-button" to={ROUTES.tasks}>
            View training <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      <section className="user-dashboard-metrics" aria-label="Your progress">
        <UserMetric
          label="Tasks completed"
          value={`${completedTasks}/${employeeTasks.length}`}
          detail={`${employeeTasks.length - completedTasks} activities remaining`}
          note="Task progress"
        >
          <MetricIcon>
            <path d="M5 19V9m5 10V5m5 14v-7m5 7H3" />
          </MetricIcon>
        </UserMetric>
        <UserMetric
          label="Weekly RTO"
          value={`${completedOfficeDays}/${scheduledOfficeDays}`}
          detail={`${weeklyRto}% of scheduled office days logged`}
          note="Current week"
        >
          <MetricIcon>
            <path d="M5 19V9m5 10V5m5 14v-7m5 7H3" />
          </MetricIcon>
        </UserMetric>
        <UserMetric
          label="Training progress"
          value={`${trainingProgress}%`}
          detail={`${completedTraining} of ${activeTraining.length} active learning items complete`}
          note={pendingTraining ? 'Mandatory pending' : 'All required complete'}
        >
          <MetricIcon>
            <path d="M5 19V9m5 10V5m5 14v-7m5 7H3" />
          </MetricIcon>
        </UserMetric>
        <UserMetric
          label="Deployment readiness"
          value={`${readinessPercent}%`}
          detail={`${readinessItems.filter((item) => item.complete).length} of ${readinessItems.length} profile checks complete`}
          note={readinessPercent >= 75 ? 'On track' : 'Keep building'}
        >
          <MetricIcon>
            <path d="M5 19V9m5 10V5m5 14v-7m5 7H3" />
          </MetricIcon>
        </UserMetric>
      </section>

      <section className="user-dashboard-overview-grid">
        <Panel
          title="Employee information and skills"
          eyebrow="Your profile"
          className="user-profile-panel"
          action={<StatusBadge status={employee ? 'Available' : 'Profile unavailable'} />}
        >
          {employee ? (
            <div className="user-profile-summary">
              <span className="user-profile-avatar">{getInitials(employee.name)}</span>
              <div className="user-profile-copy">
                <strong>{employee.name}</strong>
                <span>
                  {employee.capability} · {employee.workLocation}
                </span>
                <div className="user-profile-skills">
                  {(employee.skills ?? []).map((skill) => (
                    <span className="tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                  {!employee.skills?.length && (
                    <span className="muted-copy">No skills added yet.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="muted-copy">No employee profile is available for this account.</p>
          )}
        </Panel>

        <Panel
          title="Latest achievement"
          eyebrow="Most recent learning milestone"
          className="user-achievement-panel"
          action={<span className="user-new-badge">New</span>}
        >
          {latestAchievement ? (
            <div className="user-achievement-card">
              <span className="user-trophy-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" />
                </svg>
              </span>
              <div>
                <strong>{latestAchievement.title}</strong>
                <span>{latestAchievement.detail}</span>
              </div>
            </div>
          ) : (
            <p className="muted-copy">
              Complete a learning item to see your latest achievement here.
            </p>
          )}
        </Panel>
      </section>

      <section className="user-dashboard-work-grid">
        <Panel
          title="Today's tasks"
          eyebrow="Assigned and personally selected activities"
          className="user-today-panel"
          action={
            <Link className="user-count-badge" to={ROUTES.tasks}>
              {employeeTasks.length - completedTasks} remaining
            </Link>
          }
        >
          <div className="user-dashboard-task-list">
            {employeeTasks.slice(0, 4).map((task) => {
              const isCompleted = task.status === 'Completed';
              const isMandatory = task.category === 'Mandatory';
              return (
                <div
                  className={`user-dashboard-task${isMandatory && !isCompleted ? ' is-mandatory' : ''}`}
                  key={task.id}
                >
                  <button
                    type="button"
                    className={`user-task-check${isCompleted ? ' is-checked' : ''}${isMandatory && !isCompleted ? ' is-required' : ''}`}
                    aria-label={`${isCompleted ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                    onClick={() => toggleTask(task)}
                  >
                    {isCompleted ? '✓' : isMandatory ? '!' : ''}
                  </button>
                  <div className="user-task-copy">
                    <strong>{task.title}</strong>
                    <span>
                      {isMandatory
                        ? `Mandatory · ${task.category}`
                        : `${task.category} · Due ${task.due}`}
                    </span>
                  </div>
                  {isMandatory && !isCompleted ? (
                    <button
                      type="button"
                      className="user-required-action"
                      onClick={() => {
                        const assignment =
                          activeTraining.find((item) => item.training.title === task.title)
                            ?.assignment ?? pendingTraining?.assignment;
                        if (assignment) markTrainingComplete(assignment);
                        else toggleTask(task);
                      }}
                    >
                      Required
                    </button>
                  ) : (
                    <StatusBadge status={isCompleted ? 'Done' : task.status} />
                  )}
                </div>
              );
            })}
            {employeeTasks.length === 0 && (
              <p className="muted-copy">
                No tasks assigned yet. Add a recommendation below to get started.
              </p>
            )}
          </div>
          {employeeTasks.length > 4 && (
            <Link className="user-panel-link" to={ROUTES.tasks}>
              View all tasks →
            </Link>
          )}
        </Panel>

        <Panel
          title="Training progress"
          eyebrow="Mandatory and development learning"
          className="user-training-panel"
          action={
            <span className="user-count-badge">
              {activeTraining.filter((item) => item.assignment.status !== 'Completed').length}{' '}
              mandatory
            </span>
          }
        >
          {activeTraining.length ? (
            <div className="user-training-list">
              {activeTraining.slice(0, 4).map(({ training, assignment }) => {
                const isComplete = assignment.status === 'Completed';
                const progress =
                  assignment.status === 'Completed'
                    ? 100
                    : assignment.status === 'In Progress'
                      ? 55
                      : 0;
                return (
                  <button
                    className="user-training-item"
                    key={assignment.id}
                    type="button"
                    onClick={() => markTrainingComplete(assignment)}
                    disabled={isComplete}
                    aria-label={`${training.title}: ${isComplete ? 'completed' : `${assignment.status}, click to mark complete`}`}
                  >
                    <span className="user-training-title-row">
                      <strong>{training.title}</strong>
                      <b>{isComplete ? 'Complete' : assignment.status}</b>
                    </span>
                    <span className="user-training-progress">
                      <i style={{ width: `${progress}%` }} />
                    </span>
                    <small>
                      {isComplete
                        ? `Completed ${formatDate(assignment.completionDate)}`
                        : `${training.status === 'Active' ? 'Mandatory' : 'Optional'} · Due ${training.due || 'date not set'}`}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="muted-copy">No active training assignments.</p>
          )}
          <Link className="user-panel-link" to={ROUTES.tasks}>
            Open learning tasks →
          </Link>
        </Panel>
      </section>

      <section className="user-dashboard-work-grid">
        <Panel
          title="Deployment readiness"
          eyebrow="Based on required profile items"
          className="user-readiness-panel"
          action={<StatusBadge status={readinessPercent >= 75 ? 'On track' : 'In Progress'} />}
        >
          <div className="user-readiness-content">
            <div
              className="user-readiness-ring"
              role="img"
              aria-label={`${readinessPercent}% deployment readiness`}
              style={{ '--readiness-value': `${readinessPercent}%` }}
            >
              <strong>{readinessPercent}%</strong>
              <span>ready</span>
            </div>
            <div className="user-readiness-list">
              {readinessItems.map((item) => (
                <div className="user-readiness-row" key={item.label}>
                  <span className={item.complete ? 'is-complete' : ''}>
                    <i aria-hidden="true">{item.complete ? '✓' : '•'}</i>
                    {item.label}
                  </span>
                  <strong className={item.complete ? 'is-complete' : 'is-pending'}>
                    {item.complete ? 'Complete' : 'Pending'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Attendance and weekly RTO"
          eyebrow="Current week's work-location record"
          className="user-rto-panel"
          action={
            <span className="user-count-badge">
              {completedOfficeDays} of {scheduledOfficeDays} RTO
            </span>
          }
        >
          <div className="user-week-strip">
            {weekAttendance.map(({ day, date, plan, record }) => {
              const dayLabel = WEEKDAYS.find((item) => item.key === day)?.label ?? day.slice(0, 3);
              const status =
                record?.status === 'Present'
                  ? 'Logged'
                  : plan === 'Work from home'
                    ? 'Home'
                    : date < formatLocalDate(today)
                      ? 'Missed'
                      : 'Planned';
              return (
                <div
                  className={`user-week-day user-week-day-${status.toLowerCase()}`}
                  key={date}
                  title={`${day}: ${record?.workType ?? plan}`}
                >
                  <strong>{dayLabel}</strong>
                  <span aria-hidden="true">
                    {status === 'Logged' ? 'O' : status === 'Home' ? 'H' : '·'}
                  </span>
                  <small>{status}</small>
                </div>
              );
            })}
          </div>
          <div className="user-week-legend">
            <span>
              <i className="is-office" /> O = Office / RTO
            </span>
            <span>
              <i className="is-home" /> H = Home / remote
            </span>
          </div>
          <Link className="user-panel-link" to={checkedIn ? ROUTES.timeOut : ROUTES.timeIn}>
            {checkedIn
              ? 'Time out for today →'
              : todayRecord
                ? 'View today’s attendance →'
                : 'Record today’s attendance →'}
          </Link>
        </Panel>
      </section>

      <Panel
        title="Recommended development"
        eyebrow="Suggested activities based on your stated skills and role"
        className="user-recommendations-panel"
        action={<span className="user-count-badge">{RECOMMENDATIONS.length} suggestions</span>}
      >
        <div className="user-recommendation-grid">
          {RECOMMENDATIONS.map((recommendation) => {
            const added = enrolledTasks.has(recommendation.title);
            return (
              <article className="user-recommendation-card" key={recommendation.title}>
                <div className="user-recommendation-heading">
                  <span className="user-recommendation-icon" aria-hidden="true">
                    ◇
                  </span>
                  <strong>{recommendation.title}</strong>
                  <span className="tag">{recommendation.duration}</span>
                </div>
                <p>{recommendation.detail}</p>
                <div className="user-recommendation-actions">
                  <Link className="button user-recommendation-secondary" to={ROUTES.skillHub}>
                    View recommendation
                  </Link>
                  <button
                    type="button"
                    className="button user-recommendation-primary"
                    onClick={() => addRecommendation(recommendation)}
                    disabled={added || !employee}
                  >
                    {added ? 'Added to my tasks' : 'Add to my tasks'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
      <footer className="user-dashboard-footer">
        <span>Your dashboard shows your information and assigned or selected activities.</span>
        <span>Prototype · Demo data only</span>
      </footer>
    </div>
  );
}
