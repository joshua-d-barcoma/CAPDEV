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
const EOD_AVERAGE = Math.round(
  EOD_TREND.reduce((total, { rate }) => total + rate, 0) / EOD_TREND.length,
);

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

      <div className="stat-grid stat-grid-five">
        <StatCard
          label="Tasks In Scope"
          value={scopedTasks.length}
          detail="Total tracked tasks"
          tone="blue"
          icon="📋"
        />
        <StatCard
          label="Completed Tasks"
          value={completed}
          detail="41% completion rate"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Overdue Tasks"
          value={inProgress}
          detail="5% of total tasks"
          tone="red"
          icon="◷"
        />
        <StatCard
          label="Unassigned Tasks"
          value={notStarted}
          detail="Pending distribution"
          tone="black"
          icon="!"
        />
         <StatCard
          label="EOD Submission Rate"
          value={`${EOD_AVERAGE}%`}
          detail="Last 10 working days"
          tone="blue"
          icon="✓"
        />
      </div>
    <div className="dashboard-row">

  {/* Task Status by Capability */}
  <div className="dashboard-card">
    <h3>Task Status by Capability</h3>
    <p className="subtitle">Completion state of tracked work</p>

    {[
      { name: "Hybrid Cloud", completed: 43, progress: 24, notStarted: 21, overdue: 12, total: 24 },
      { name: "Network", completed: 44, progress: 17, notStarted: 23, overdue: 16, total: 38 },
      { name: "Security", completed: 39, progress: 24, notStarted: 25, overdue: 12, total: 18 },
      { name: "Data & AI", completed: 42, progress: 24, notStarted: 21, overdue: 13, total: 4 },
    ].map((item) => (
      <div className="capability-row" key={item.name}>
        <span className="capability-name">{item.name}</span>

        <div className="status-bar">
          <div
            className="bar completed"
            style={{ width: `${item.completed}%` }}
          />
          <div
            className="bar progress"
            style={{ width: `${item.progress}%` }}
          />
          <div
            className="bar not-started"
            style={{ width: `${item.notStarted}%` }}
          />
          <div
            className="bar overdue"
            style={{ width: `${item.overdue}%` }}
          />
        </div>

        <strong>{item.total}</strong>
      </div>
    ))}

    <div className="legend">
      <span><i className="legend-box completed-box"></i> Completed</span>
      <span><i className="legend-box progress-box"></i> In Progress</span>
      <span><i className="legend-box not-started-box"></i> Not Started</span>
      <span><i className="legend-box overdue-box"></i> Overdue</span>
    </div>
  </div>


  {/* Productivity by Task Category */}
  <div className="dashboard-card">
    <div className="card-header">
      <div>
        <h3>Productivity by Task Category</h3>
        <p className="subtitle">Hours logged this week</p>
      </div>

      <button className="details-btn">
        View details →
      </button>
    </div>

    {[
      { name: "Capability Building", value: 126, width: 100 },
      { name: "Mandatory Learning", value: 94, width: 59 },
      { name: "Internal Assignments", value: 72, width: 84 },
      { name: "Deployment Preparation", value: 58, width: 93 },
    ].map((item) => (
      <div className="productivity-row" key={item.name}>
        <strong>{item.name}</strong>

        <div className="productivity-track">
          <div
            className="productivity-fill"
            style={{ width: `${item.width}%` }}
          />
        </div>

        <strong>{item.value}h</strong>
      </div>
    ))}
  </div>

</div>
      
      <div className="productivity-chart-grid">
        
        <div className="eod-card">
  <h3>EOD Submission Rate</h3>
  <p>Last 10 working days</p>

  <div className="eod-chart">
    {[
      { day: "D-9", value: 86 },
      { day: "D-8", value: 91 },
      { day: "D-7", value: 83 },
      { day: "D-6", value: 94 },
      { day: "D-5", value: 89 },
      { day: "D-4", value: 92 },
      { day: "D-3", value: 87 },
      { day: "D-2", value: 95 },
      { day: "D-1", value: 90 },
      { day: "Today", value: 78 },
    ].map((item) => (
      <div className="eod-column" key={item.day}>
        <span className="eod-percent">{item.value}%</span>

        <div className="eod-bar-track">
          <div
            className="eod-bar-fill"
            style={{ height: `${item.value}%` }}
          ></div>
        </div>

        <span className="eod-day">{item.day}</span>
      </div>
    ))}
  </div>
</div>


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
