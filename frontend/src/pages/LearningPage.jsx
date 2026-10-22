import { useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

const EMPTY_FORM = { title: '', description: '', due: '', status: 'Active' };
const EMPLOYEES_PER_PAGE = 10;
const PAGE_BUTTON_LIMIT = 5;

function Pagination({ totalItems, page, onPageChange }) {
  const pageCount = Math.ceil(totalItems / EMPLOYEES_PER_PAGE);
  if (pageCount === 0) return null;

  const firstPage = Math.min(
    Math.max(1, page - Math.floor(PAGE_BUTTON_LIMIT / 2)),
    Math.max(1, pageCount - PAGE_BUTTON_LIMIT + 1),
  );
  const lastPage = Math.max(
    PAGE_BUTTON_LIMIT,
    Math.min(pageCount, firstPage + PAGE_BUTTON_LIMIT - 1),
  );

  return (
    <nav className="learning-pagination" aria-label="Employee list pages">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        ‹ Previous
      </button>
      {Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index).map(
        (pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            className={pageNumber === page ? 'active' : ''}
            aria-current={pageNumber === page ? 'page' : undefined}
            aria-label={`Page ${pageNumber}`}
            disabled={pageNumber > pageCount}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ),
      )}
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
        Next ›
      </button>
    </nav>
  );
}

function getToday() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  );
}

function downloadReport(rows) {
  const columns = [
    ['Employee', 'employee'],
    ['Capability', 'capability'],
    ['Training', 'training'],
    ['Category', 'category'],
    ['Status', 'status'],
    ['Progress', 'progress'],
    ['Completion date', 'completionDate'],
  ];
  const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const content = [
    columns.map(([label]) => escapeCsv(label)).join(','),
    ...rows.map((row) => columns.map(([, key]) => escapeCsv(row[key])).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'benchflow-learning-report.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function LearningPage() {
  const {
    employees,
    learningAssignments,
    mandatoryTraining,
    cohorts,
    updateLearningAssignment,
    addMandatoryTraining,
    updateMandatoryTraining,
    storageError,
  } = useBenchData();
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [trainingForm, setTrainingForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [completionsPage, setCompletionsPage] = useState(1);
  const [noActivePage, setNoActivePage] = useState(1);
  const today = getToday();

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const trainingById = useMemo(
    () => new Map(mandatoryTraining.map((training) => [training.id, training])),
    [mandatoryTraining],
  );
  const assignments = useMemo(
    () =>
      learningAssignments
        .filter(
          (assignment) =>
            employeeById.has(assignment.employeeId) && trainingById.has(assignment.trainingId),
        )
        .map((assignment) => {
          const employee = employeeById.get(assignment.employeeId);
          const training = trainingById.get(assignment.trainingId);
          return {
            ...assignment,
            employee: employee.name,
            capability: employee.capability,
            training: training.title,
            category: 'Mandatory',
            progress:
              assignment.status === 'Completed'
                ? 100
                : assignment.status === 'In Progress'
                  ? 50
                  : 0,
          };
        }),
    [employeeById, learningAssignments, trainingById],
  );
  const completedToday = assignments.filter(
    (assignment) => assignment.status === 'Completed' && assignment.completionDate === today,
  );
  const completedCount = assignments.filter(
    (assignment) => assignment.status === 'Completed',
  ).length;
  const completionRate = assignments.length
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;
  const noActiveEmployees = employees.filter(
    (employee) =>
      !assignments.some(
        (assignment) => assignment.employeeId === employee.id && assignment.status !== 'Completed',
      ),
  );
  const accomplishments = [...assignments]
    .filter((assignment) => assignment.status === 'Completed')
    .sort((left, right) => (right.completionDate ?? '').localeCompare(left.completionDate ?? ''))
    .slice(0, 5);
  const employeeStats = employees.map((employee) => {
    const items = assignments.filter((assignment) => assignment.employeeId === employee.id);
    const completed = items.filter((assignment) => assignment.status === 'Completed').length;
    const daily = items.filter(
      (assignment) => assignment.status === 'Completed' && assignment.completionDate === today,
    ).length;
    return {
      ...employee,
      total: items.length,
      completed,
      daily,
      rate: items.length ? Math.round((completed / items.length) * 100) : 0,
      nextAssignment: items.find((assignment) => assignment.status !== 'Completed'),
    };
  });
  const completionsPageCount = Math.max(1, Math.ceil(employeeStats.length / EMPLOYEES_PER_PAGE));
  const noActivePageCount = Math.max(1, Math.ceil(noActiveEmployees.length / EMPLOYEES_PER_PAGE));
  const visibleCompletionsPage = Math.min(completionsPage, completionsPageCount);
  const visibleNoActivePage = Math.min(noActivePage, noActivePageCount);
  const visibleEmployeeStats = employeeStats.slice(
    (visibleCompletionsPage - 1) * EMPLOYEES_PER_PAGE,
    visibleCompletionsPage * EMPLOYEES_PER_PAGE,
  );
  const visibleNoActiveEmployees = noActiveEmployees.slice(
    (visibleNoActivePage - 1) * EMPLOYEES_PER_PAGE,
    visibleNoActivePage * EMPLOYEES_PER_PAGE,
  );
  const reportRows = assignments.map((assignment) => ({
    ...assignment,
    completionDate: assignment.completionDate ?? '',
  }));

  function openAddTraining() {
    setEditingTraining(null);
    setTrainingForm(EMPTY_FORM);
    setFormError('');
    setIsTrainingDialogOpen(true);
  }

  function openEditTraining(training) {
    setEditingTraining(training);
    setTrainingForm({
      title: training.title,
      description: training.description,
      due: training.due,
      status: training.status,
    });
    setFormError('');
    setIsTrainingDialogOpen(true);
  }

  function saveTraining(event) {
    event.preventDefault();
    if (!trainingForm.title.trim()) {
      setFormError('Enter a training title.');
      return;
    }
    const payload = {
      ...trainingForm,
      title: trainingForm.title.trim(),
      description: trainingForm.description.trim(),
      due: trainingForm.due.trim(),
    };
    const saved = editingTraining
      ? updateMandatoryTraining(editingTraining.id, payload)
      : addMandatoryTraining(payload);
    if (!saved) {
      setFormError('Unable to save training. Please try again.');
      return;
    }
    setIsTrainingDialogOpen(false);
    setEditingTraining(null);
  }

  return (
    <div className="page-stack learning-dashboard">
      <header className="learning-banner">
        <div className="learning-banner-copy">
          <h1>Learning</h1>
          <p>Monitor bench employees, training, skills, and development progress.</p>
        </div>
        <div className="learning-banner-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => downloadReport(reportRows)}
          >
            Export report
          </button>
          <button type="button" className="button learning-add-button" onClick={openAddTraining}>
            Add Training <span aria-hidden="true">＋</span>
          </button>
        </div>
      </header>

      {storageError && (
        <p className="learning-error" role="alert">
          {storageError}
        </p>
      )}

      <div className="stat-grid">
        <StatCard
          label="Completed today"
          value={completedToday.length}
          detail="Learning activities completed"
          icon="check"
        />
        <StatCard
          label="Completion rate"
          value={`${completionRate}%`}
          detail={`${completedCount} of ${assignments.length} assigned learning`}
          icon="capability"
        />
        <StatCard
          label="No active tasks"
          value={noActiveEmployees.length}
          detail="Employees requiring learning assignment"
          icon="alert"
          tone="orange"
        />
        <StatCard
          label="Mandatory training"
          value={mandatoryTraining.filter((item) => item.status === 'Active').length}
          detail="Active training programs"
          icon="people"
        />
      </div>

      <Panel
        title="Recent Accomplishment"
        eyebrow="Recent activity"
        className="learning-activity-panel"
      >
        <p className="learning-panel-description">
          Latest learning and training accomplishments from employees.
        </p>
        {accomplishments.length ? (
          <div className="learning-accomplishments">
            {accomplishments.map((item) => (
              <article className="learning-accomplishment" key={item.id}>
                <span className="learning-complete-icon" aria-hidden="true">
                  ✓
                </span>
                <div className="learning-accomplishment-copy">
                  <strong>{item.employee}</strong>
                  <b>{item.training}</b>
                  <span>Completed mandatory training.</span>
                </div>
                <div className="learning-accomplishment-meta">
                  <StatusBadge status="Training" />
                  <span>
                    {item.completionDate === today ? 'Today' : formatDate(item.completionDate)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No training accomplishments have been recorded yet.</p>
        )}
      </Panel>

      <div className="learning-insights-grid">
        <Panel
          title="Employee Completions"
          eyebrow="Daily statistics"
          className="learning-paginated-panel"
        >
          <p className="learning-panel-description">
            Learning activities completed today and overall assigned progress.
          </p>
          <div className="learning-employee-stats">
            {visibleEmployeeStats.map((employee) => (
              <article className="learning-employee-stat" key={employee.id}>
                <div className="learning-employee-stat-heading">
                  <div>
                    <strong>{employee.name}</strong>
                    <span>
                      {employee.daily} completed today · {employee.completed} of {employee.total}{' '}
                      overall
                    </span>
                  </div>
                  <b>{employee.rate}%</b>
                </div>
                <div
                  className="learning-progress-track"
                  aria-label={`${employee.name}: ${employee.rate}% complete`}
                >
                  <i style={{ width: `${employee.rate}%` }} />
                </div>
                {employee.nextAssignment && (
                  <button
                    type="button"
                    className="learning-complete-action"
                    onClick={() =>
                      updateLearningAssignment(employee.nextAssignment.id, 'Completed')
                    }
                  >
                    Record completion: {employee.nextAssignment.training}
                  </button>
                )}
              </article>
            ))}
          </div>
          <Pagination
            totalItems={employeeStats.length}
            page={visibleCompletionsPage}
            onPageChange={setCompletionsPage}
          />
        </Panel>

        <Panel
          title="Employees with no active tasks"
          eyebrow="Attention required"
          className="learning-attention-panel learning-paginated-panel"
        >
          {noActiveEmployees.length ? (
            <div className="learning-attention-list">
              {visibleNoActiveEmployees.map((employee) => {
                const lastCompletion = assignments
                  .filter(
                    (assignment) =>
                      assignment.employeeId === employee.id && assignment.completionDate,
                  )
                  .sort((left, right) =>
                    right.completionDate.localeCompare(left.completionDate),
                  )[0];
                return (
                  <article className="learning-attention-row" key={employee.id}>
                    <div>
                      <strong>{employee.name}</strong>
                      <span>{employee.capability}</span>
                    </div>
                    <div className="learning-last-activity">
                      <span>Last activity</span>
                      <strong>
                        {lastCompletion ? formatDate(lastCompletion.completionDate) : 'None yet'}
                      </strong>
                    </div>
                    <StatusBadge status="No active tasks" />
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="learning-no-attention">All employees have active learning tasks.</p>
          )}
          <Pagination
            totalItems={noActiveEmployees.length}
            page={visibleNoActivePage}
            onPageChange={setNoActivePage}
          />
        </Panel>
      </div>

      <Panel
        title="Mandatory Trainings"
        eyebrow="Training management"
        className="learning-training-panel"
      >
        <p className="learning-panel-description">
          Manage required training programs assigned to bench employees.
        </p>
        {mandatoryTraining.length ? (
          <div className="learning-training-list">
            {mandatoryTraining.map((training) => {
              const trainingAssignments = assignments.filter(
                (assignment) => assignment.trainingId === training.id,
              );
              const completed = trainingAssignments.filter(
                (assignment) => assignment.status === 'Completed',
              ).length;
              const progress = trainingAssignments.length
                ? Math.round((completed / trainingAssignments.length) * 100)
                : 0;
              return (
                <article className="learning-training-row" key={training.id}>
                  <span className="learning-training-icon" aria-hidden="true">
                    ◇
                  </span>
                  <div className="learning-training-copy">
                    <strong>{training.title}</strong>
                    <span>{training.description}</span>
                  </div>
                  <div className="learning-training-metric">
                    <span>Due</span>
                    <strong>{training.due || '—'}</strong>
                  </div>
                  <div className="learning-training-metric">
                    <span>Assigned</span>
                    <strong>{trainingAssignments.length}</strong>
                  </div>
                  <div className="learning-training-metric">
                    <span>Completed</span>
                    <strong>{completed}</strong>
                  </div>
                  <div className="learning-training-progress">
                    <span>
                      Progress <b>{progress}%</b>
                    </span>
                    <div className="learning-progress-track">
                      <i style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <StatusBadge status={training.status} />
                  <button
                    type="button"
                    className="icon-button learning-edit-button"
                    onClick={() => openEditTraining(training)}
                    aria-label={`Edit ${training.title}`}
                  >
                    ✎
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted-copy">No mandatory training has been configured.</p>
        )}
      </Panel>

      <Panel title="Skill Hub offerings" eyebrow="Development opportunities">
        {cohorts.length ? (
          <div className="card-grid">
            {cohorts.map((cohort) => (
              <article className="opportunity-card" key={cohort.id}>
                <div className="opportunity-top">
                  <span className="tag">{cohort.duration}</span>
                  <StatusBadge status={cohort.joined ? 'Joined' : 'Open'} />
                </div>
                <h3>{cohort.name}</h3>
                <p>{cohort.focus}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No Skill Hub offerings are currently available.</p>
        )}
      </Panel>

      {isTrainingDialogOpen && (
        <Dialog
          title={editingTraining ? 'Edit mandatory training' : 'Add mandatory training'}
          description="This training list is shared with applicable employees."
          onClose={() => setIsTrainingDialogOpen(false)}
        >
          <form className="learning-training-form" onSubmit={saveTraining}>
            <label>
              Training name
              <input
                autoFocus
                value={trainingForm.title}
                onChange={(event) =>
                  setTrainingForm({ ...trainingForm, title: event.target.value })
                }
                maxLength={100}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={trainingForm.description}
                onChange={(event) =>
                  setTrainingForm({ ...trainingForm, description: event.target.value })
                }
                maxLength={250}
                rows={3}
              />
            </label>
            <div className="learning-form-row">
              <label>
                Due date
                <input
                  value={trainingForm.due}
                  onChange={(event) =>
                    setTrainingForm({ ...trainingForm, due: event.target.value })
                  }
                  placeholder="e.g. Nov 15"
                  maxLength={30}
                />
              </label>
              <label>
                Status
                <select
                  value={trainingForm.status}
                  onChange={(event) =>
                    setTrainingForm({ ...trainingForm, status: event.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>
            {formError && (
              <p className="learning-error" role="alert">
                {formError}
              </p>
            )}
            <div className="learning-form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsTrainingDialogOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Save training
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
