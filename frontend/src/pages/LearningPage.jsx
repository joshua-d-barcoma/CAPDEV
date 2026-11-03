import { useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog.jsx';
import { EmployeeScopeFilters } from '../components/EmployeeScopeFilters.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { filterEmployees } from '../utils/employeeInsights.js';
import './LearningPage.css';

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

function TrainingIcon({ trainingId }) {
  const iconProps = {
    'aria-hidden': true,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (trainingId === 'training-security') {
    return (
      <svg {...iconProps}>
        <path d="M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (trainingId === 'training-privacy') {
    return (
      <svg {...iconProps}>
        <path d="M7 3.5h7l4 4V12" />
        <path d="M14 3.5v4h4M7 3.5v17h6" />
        <path d="M9.5 11h5M9.5 14h3" />
        <path d="m17 13 3 1.2v2.1c0 2-1.2 3.5-3 4.4-1.8-.9-3-2.4-3-4.4v-2.1l3-1.2Z" />
      </svg>
    );
  }

  if (trainingId === 'training-workplace-safety') {
    return (
      <svg {...iconProps}>
        <path d="M4 14a8 8 0 0 1 16 0v1H4v-1Z" />
        <path d="M12 6v8M6.5 9.5 8 14M17.5 9.5 16 14M3.5 18h17" />
      </svg>
    );
  }

  if (trainingId === 'training-responsible-ai') {
    return (
      <svg {...iconProps}>
        <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6L5 3Z" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M12 6.5C9.5 4.8 6.5 4.7 4 5.7v13c2.5-1 5.5-.9 8 1 2.5-1.9 5.5-2 8-1v-13c-2.5-1-5.5-.9-8 .8Z" />
      <path d="M12 6.5v13M7 9h2M7 12h2M15 9h2M15 12h2" />
    </svg>
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
    certifications,
    announcements,
    updateLearningAssignment,
    addMandatoryTraining,
    updateMandatoryTraining,
    addSkillHubItem,
    storageError,
  } = useBenchData();
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [trainingForm, setTrainingForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [skillHubCategory, setSkillHubCategory] = useState(null);
  const [skillHubForm, setSkillHubForm] = useState({ title: '', description: '', detail: '' });
  const [completionsPage, setCompletionsPage] = useState(1);
  const [noActivePage, setNoActivePage] = useState(1);
  const [scopeFilters, setScopeFilters] = useState({ location: '', capability: '' });
  const today = getToday();

  const scopedEmployees = useMemo(
    () => filterEmployees(employees, scopeFilters),
    [employees, scopeFilters],
  );
  const scopedEmployeeIds = useMemo(
    () => new Set(scopedEmployees.map((employee) => employee.id)),
    [scopedEmployees],
  );
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
            scopedEmployeeIds.has(assignment.employeeId) &&
            employeeById.has(assignment.employeeId) &&
            trainingById.has(assignment.trainingId),
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
    [employeeById, learningAssignments, scopedEmployeeIds, trainingById],
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
  const noActiveEmployees = scopedEmployees.filter(
    (employee) =>
      !assignments.some(
        (assignment) => assignment.employeeId === employee.id && assignment.status !== 'Completed',
      ),
  );
  const accomplishments = [...assignments]
    .filter((assignment) => assignment.status === 'Completed')
    .sort((left, right) => (right.completionDate ?? '').localeCompare(left.completionDate ?? ''))
    .slice(0, 5);
  const employeeStats = scopedEmployees.map((employee) => {
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
  const reportDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${today}T12:00:00`));
  const reportScope = [
    scopeFilters.location || 'all locations',
    scopeFilters.capability || 'all capabilities',
  ].join(', ');

  function updateScopeFilter(name, value) {
    setScopeFilters((current) => ({ ...current, [name]: value }));
    setCompletionsPage(1);
    setNoActivePage(1);
  }

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

  function saveSkillHubItem(event) {
    event.preventDefault();
    if (!skillHubForm.title.trim()) {
      setFormError('Enter a title.');
      return;
    }
    const commonFields = {
      title: skillHubForm.title.trim(),
      detail: skillHubForm.description.trim(),
    };
    const item =
      skillHubCategory === 'certifications'
        ? { ...commonFields, status: 'Recommended' }
        : skillHubCategory === 'cohorts'
          ? {
              name: commonFields.title,
              focus: skillHubForm.description.trim(),
              duration: skillHubForm.detail.trim(),
            }
          : {
              title: commonFields.title,
              description: skillHubForm.description.trim(),
              category: skillHubForm.detail.trim() || 'Learning',
            };
    const saved = addSkillHubItem(skillHubCategory, item);
    if (!saved) {
      setFormError('Unable to save this Skill Hub offering. Please try again.');
      return;
    }
    setSkillHubCategory(null);
    setSkillHubForm({ title: '', description: '', detail: '' });
  }

  return (
    <div className="page-stack learning-dashboard">
      <header className="learning-banner employee-scope-banner">
        <div className="employee-scope-banner-heading">
          <div className="learning-banner-copy">
            <h1>Learning</h1>
            <p>Monitor bench employees, training, skills, and development progress.</p>
          </div>
        </div>
        <div className="employee-scope-banner-controls">
          <EmployeeScopeFilters
            employees={employees}
            location={scopeFilters.location}
            capability={scopeFilters.capability}
            onChange={updateScopeFilter}
          />
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
        title="Recent Accomplishments"
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
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => downloadReport(reportRows)}
            >
              Export report
            </button>
          }
        >
          <p className="learning-panel-description">
            Learning activities completed today and overall assigned progress.
          </p>
          <div className="learning-employee-stats">
            {visibleEmployeeStats.map((employee) => (
              <article
                className="learning-employee-stat chart-data-tooltip"
                data-chart-tooltip={`${employee.name}: ${employee.daily} completed today, ${employee.completed} of ${employee.total} assigned trainings complete (${employee.rate}%)`}
                title={`${employee.name}: ${employee.daily} completed today, ${employee.completed} of ${employee.total} assigned trainings complete (${employee.rate}%)`}
                key={employee.id}
              >
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
        title="Certifications, Cohorts, & Announcement"
        eyebrow="Skill Hub"
        className="learning-skill-hub-panel"
      >
        <p className="learning-panel-description">
          Manage the content shown to employees in Skill Hub.
        </p>
        <div className="learning-skill-hub-columns">
          <section className="learning-skill-hub-column">
            <header>
              <div>
                <h3>Certifications</h3>
                <span>{certifications.length} listed</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSkillHubCategory('certifications');
                  setSkillHubForm({ title: '', description: '', detail: '' });
                  setFormError('');
                }}
              >
                + Add
              </button>
            </header>
            <div className="learning-skill-hub-items">
              {certifications.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </article>
              ))}
            </div>
          </section>
          <section className="learning-skill-hub-column">
            <header>
              <div>
                <h3>Bench Cohorts</h3>
                <span>{cohorts.length} listed</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSkillHubCategory('cohorts');
                  setSkillHubForm({ title: '', description: '', detail: '' });
                  setFormError('');
                }}
              >
                + Add
              </button>
            </header>
            <div className="learning-skill-hub-items">
              {cohorts.map((item) => (
                <article key={item.id}>
                  <strong>{item.name}</strong>
                  <span>
                    {item.focus} · {item.duration}
                  </span>
                </article>
              ))}
            </div>
          </section>
          <section className="learning-skill-hub-column">
            <header>
              <div>
                <h3>Announcements</h3>
                <span>{announcements.length} listed</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSkillHubCategory('announcements');
                  setSkillHubForm({ title: '', description: '', detail: '' });
                  setFormError('');
                }}
              >
                + Add
              </button>
            </header>
            <div className="learning-skill-hub-items">
              {announcements.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.description} · {item.category}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Panel>

      <Panel
        title="Mandatory Trainings"
        eyebrow="Training management"
        className="learning-training-panel"
        action={
          <button type="button" className="button learning-add-button" onClick={openAddTraining}>
            Add Training <span aria-hidden="true">＋</span>
          </button>
        }
      >
        <p className="learning-panel-description">
          Manage required training programs assigned to bench employees.
        </p>
        {mandatoryTraining.length ? (
          <div className="learning-training-table-scroll">
            <table className="learning-training-table">
              <thead>
                <tr>
                  <th scope="col">Training</th>
                  <th scope="col">Due</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={training.id}>
                      <td>
                        <div className="learning-training-copy">
                          <span
                            className={`learning-training-icon learning-training-icon-${training.id}`}
                            aria-hidden="true"
                          >
                            <TrainingIcon trainingId={training.id} />
                          </span>
                          <span>
                            <strong>{training.title}</strong>
                            <span>{training.description}</span>
                          </span>
                        </div>
                      </td>
                      <td>{training.due || '—'}</td>
                      <td>{trainingAssignments.length}</td>
                      <td>{completed}</td>
                      <td>
                        <div className="learning-training-progress">
                          <span>{progress}%</span>
                          <div
                            className="learning-progress-track"
                            aria-label={`${progress}% complete`}
                            title={`${training.title}: ${completed} of ${trainingAssignments.length} employees completed (${progress}%)`}
                          >
                            <i style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={training.status} /></td>
                      <td>
                        <button
                          type="button"
                          className="icon-button learning-edit-button"
                          onClick={() => openEditTraining(training)}
                          aria-label={`Edit ${training.title}`}
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-copy">No mandatory training has been configured.</p>
        )}
      </Panel>

      <footer className="learning-report-footer">
        <div>
          <strong>Learning Report · {reportDate}</strong>
          <span>
            Filtered scope: {reportScope}. Report reflects the current filter selection.
          </span>
        </div>
        <button
          type="button"
          className="learning-report-button"
          onClick={() => downloadReport(reportRows)}
        >
          <span aria-hidden="true">▤</span>
          Generate Report
        </button>
      </footer>

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
      {skillHubCategory && (
        <Dialog
          title={`Add ${skillHubCategory === 'cohorts' ? 'bench cohort' : skillHubCategory.slice(0, -1)}`}
          description="This content will be available to employees in Skill Hub."
          onClose={() => setSkillHubCategory(null)}
        >
          <form className="learning-training-form" onSubmit={saveSkillHubItem}>
            <label>
              {skillHubCategory === 'cohorts' ? 'Cohort name' : 'Title'}
              <input
                autoFocus
                value={skillHubForm.title}
                onChange={(event) =>
                  setSkillHubForm({ ...skillHubForm, title: event.target.value })
                }
                maxLength={100}
                required
              />
            </label>
            <label>
              {skillHubCategory === 'certifications'
                ? 'Description'
                : skillHubCategory === 'cohorts'
                  ? 'Focus'
                  : 'Announcement'}
              <textarea
                value={skillHubForm.description}
                onChange={(event) =>
                  setSkillHubForm({ ...skillHubForm, description: event.target.value })
                }
                maxLength={250}
                rows={3}
              />
            </label>
            {skillHubCategory !== 'certifications' && (
              <label>
                {skillHubCategory === 'cohorts' ? 'Duration' : 'Category'}
                <input
                  value={skillHubForm.detail}
                  onChange={(event) =>
                    setSkillHubForm({ ...skillHubForm, detail: event.target.value })
                  }
                  maxLength={60}
                  placeholder={
                    skillHubCategory === 'cohorts' ? 'e.g. 6-week mission' : 'e.g. Learning'
                  }
                />
              </label>
            )}
            {formError && (
              <p className="learning-error" role="alert">
                {formError}
              </p>
            )}
            <div className="learning-form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSkillHubCategory(null)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
