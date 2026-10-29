import { useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { Dialog } from '../components/Dialog.jsx';
import { EmployeeScopeFilters } from '../components/EmployeeScopeFilters.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { filterEmployees } from '../utils/employeeInsights.js';
import { getTaskStatus, getTasksForDistribution } from '../utils/productivityTasks.js';

const EOD_TREND = [
  { day: 'D-9', rate: 86 },
  { day: 'D-8', rate: 91 },
  { day: 'D-7', rate: 88 },
  { day: 'D-6', rate: 94 },
  { day: 'D-5', rate: 89 },
  { day: 'D-4', rate: 92 },
  { day: 'D-3', rate: 87 },
  { day: 'D-2', rate: 95 },
  { day: 'D-1', rate: 90 },
  { day: 'Today', rate: 78 },
];

const TASK_STATUSES = [
  { key: 'Completed', label: 'Completed', className: 'completed' },
  { key: 'In Progress', label: 'In Progress', className: 'in-progress' },
  { key: 'Not Started', label: 'Not Started', className: 'not-started' },
  { key: 'Overdue', label: 'Overdue', className: 'overdue' },
];

function findSkillMatch(task, employees) {
  const taskText = `${task.title} ${task.description}`.toLowerCase();
  return employees
    .map((employee) => ({
      employee,
      skills: employee.skills.filter((skill) => taskText.includes(skill.toLowerCase())),
    }))
    .filter((match) => match.skills.length > 0)
    .sort((first, second) => second.skills.length - first.skills.length)[0];
}

export default function ProductivityPage() {
  const { employees, tasks, updateTaskAssignee } = useBenchData();
  const [taskToAssign, setTaskToAssign] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [scopeFilters, setScopeFilters] = useState({ location: '', capability: '' });
  const scopedEmployees = useMemo(
    () => filterEmployees(employees, scopeFilters),
    [employees, scopeFilters],
  );
  const scopedEmployeeIds = useMemo(
    () => new Set(scopedEmployees.map((employee) => employee.id)),
    [scopedEmployees],
  );
  const scopedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (task.assigneeId && scopedEmployeeIds.has(task.assigneeId)) ||
          (!task.assigneeId && findSkillMatch(task, scopedEmployees)),
      ),
    [scopedEmployeeIds, scopedEmployees, tasks],
  );
  const completed = scopedTasks.filter((task) => task.status === 'Completed').length;
  const inProgress = scopedTasks.filter((task) => task.status === 'In Progress').length;
  const notStarted = scopedTasks.filter((task) => task.status === 'Not Started').length;

  const categories = useMemo(
    () => [...new Set(scopedTasks.map((task) => task.category))],
    [scopedTasks],
  );
  const pendingTasks = getTasksForDistribution(scopedTasks);

  const distributionColumns = [
    {
      key: 'title',
      label: 'Task',
      render: (task) => (
        <span>
          <strong>{task.title}</strong>
          <small className="table-subtitle">{task.description}</small>
        </span>
      ),
    },
    { key: 'category', label: 'Category' },
    {
      key: 'skill',
      label: 'Skill needed',
      render: (task) => findSkillMatch(task, scopedEmployees)?.skills.join(', ') ?? '—',
    },
    {
      key: 'due',
      label: 'Due',
      render: (task) => (
        <span className="productivity-due-cell">
          {task.due}
          {getTaskStatus(task) === 'Overdue' && (
            <span className="productivity-overdue-badge">Overdue</span>
          )}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task) => (
        <span
          className={`productivity-priority productivity-priority-${task.priority.toLowerCase()}`}
        >
          {task.priority}
        </span>
      ),
    },
    {
      key: 'match',
      label: 'Suggested match',
      render: (task) => findSkillMatch(task, scopedEmployees)?.employee.name ?? 'No skill match',
    },
    {
      key: 'assign',
      label: '',
      render: (task) => (
        <button
          type="button"
          className="button button-secondary button-small productivity-assign-button"
          onClick={() => {
            setTaskToAssign(task);
            setSelectedEmployeeId(findSkillMatch(task, scopedEmployees)?.employee.id ?? '');
          }}
        >
          Assign
        </button>
      ),
    },
  ];

  function assignTask(event) {
    event.preventDefault();
    if (!taskToAssign || !selectedEmployeeId) return;
    if (updateTaskAssignee(taskToAssign.id, selectedEmployeeId)) {
      setTaskToAssign(null);
      setSelectedEmployeeId('');
    }
  }

  return (
    <div className="page-stack productivity-page">
      <section className="dashboard-banner productivity-banner employee-scope-banner">
        <div className="employee-scope-banner-heading">
          <div className="dashboard-banner-copy">
            <h1>Productivity</h1>
            <p>Monitor tasks delivery, EOD Reporting, and outstanding work.</p>
          </div>
        </div>
        <div className="employee-scope-banner-controls">
          <EmployeeScopeFilters
            employees={employees}
            location={scopeFilters.location}
            capability={scopeFilters.capability}
            onChange={(name, value) => setScopeFilters((current) => ({ ...current, [name]: value }))}
          />
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Tasks In Scope"
          value={scopedTasks.length}
          detail="Across active resources"
          icon="✓"
        />
        <StatCard
          label="Completed Tasks"
          value={completed}
          detail="Tasks marked complete"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="In progress"
          value={inProgress}
          detail="Currently active"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Not started"
          value={notStarted}
          detail="Awaiting action"
          tone="orange"
          icon="!"
        />
      </div>

      <div className="productivity-chart-grid">
        <Panel title="Task status by category" eyebrow="Completion state of tracked work">
          <div className="productivity-status-chart">
            {categories.map((category) => {
              const categoryTasks = scopedTasks.filter((task) => task.category === category);
              const statusCounts = TASK_STATUSES.map(({ key, label, className }) => ({
                key,
                label,
                className,
                count: categoryTasks.filter((task) => getTaskStatus(task) === key).length,
              }));
              return (
                <div className="productivity-status-row" key={category}>
                  <span>{category}</span>
                  <div
                    className="productivity-status-track"
                    role="img"
                    aria-label={`${category}: ${statusCounts.map(({ count, label }) => `${count} ${label}`).join(', ')}`}
                  >
                    {statusCounts.map(({ key, className, count }) =>
                      count ? (
                        <i
                          className={`productivity-status-segment ${className}`}
                          key={key}
                          style={{ width: `${(count / categoryTasks.length) * 100}%` }}
                        />
                      ) : null,
                    )}
                  </div>
                  <strong>{categoryTasks.length}</strong>
                </div>
              );
            })}
          </div>
          <div className="productivity-legend" aria-label="Task status legend">
            {TASK_STATUSES.map(({ key, label, className }) => (
              <span key={key}>
                <i className={className} />
                {label}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="EOD submission rate" eyebrow="Last 10 working days · illustrative demo data">
          <div className="productivity-eod-chart" role="img" aria-label="EOD submission rate trend">
            {EOD_TREND.map(({ day, rate }) => (
              <div className="productivity-eod-column" key={day}>
                <strong>{rate}%</strong>
                <div className="productivity-eod-track">
                  <i style={{ height: `${rate}%` }} />
                </div>
                <span>{day}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Productivity by task category" eyebrow="Completed tasks / assigned tasks">
        <div className="productivity-category-chart">
          {categories.map((category) => {
            const categoryTasks = scopedTasks.filter((task) => task.category === category);
            const completedTasks = categoryTasks.filter(
              (task) => task.status === 'Completed',
            ).length;
            const completion = categoryTasks.length
              ? Math.round((completedTasks / categoryTasks.length) * 100)
              : 0;
            return (
              <div className="productivity-category-row" key={category}>
                <span>{category}</span>
                <div className="productivity-category-track">
                  <i style={{ width: `${completion}%` }} />
                </div>
                <strong>
                  {completedTasks}/{categoryTasks.length}
                </strong>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Pending tasks for distribution"
        eyebrow="Task distribution"
        action={
          <span className="productivity-unassigned-count">{pendingTasks.length} unassigned</span>
        }
      >
        <DataTable
          columns={distributionColumns}
          rows={pendingTasks}
          rowKey={(task) => task.id}
          className="productivity-distribution-table"
          emptyTitle="All caught up"
          emptyDescription="There are no unassigned tasks waiting for distribution."
        />
        <p className="productivity-table-note">
          Suggested matches are based on skills listed in employee profiles.
        </p>
      </Panel>

      {taskToAssign && (
        <Dialog
          title="Assign task"
          description={`Choose an employee for ${taskToAssign.title}.`}
          onClose={() => setTaskToAssign(null)}
          className="productivity-assignment-dialog"
        >
          <form className="productivity-assignment-form" onSubmit={assignTask}>
            <label className="field">
              <span>Employee</span>
              <select
                autoFocus
                required
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
              >
                <option value="">Select an employee</option>
                {scopedEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} · {employee.capability}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setTaskToAssign(null)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Assign task
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
