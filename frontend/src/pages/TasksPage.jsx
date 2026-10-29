import { useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const DEFAULT_TASK_FORM = {
  title: '',
  description: '',
  category: 'Development',
  priority: 'Medium',
  due: '',
  status: 'Not Started',
};
const DEFAULT_FILTERS = { priority: '', status: '' };

function formatDueDate(value) {
  if (!value) return 'No due date';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function TaskGroup({
  title,
  eyebrow,
  tasks,
  filters,
  onFilterChange,
  onReset,
  onUpdateTask,
  onAddTask,
}) {
  const visibleTasks = tasks.filter(
    (task) =>
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.status || task.status === filters.status),
  );

  return (
    <Panel
      title={title}
      eyebrow={eyebrow}
      className="task-group-panel"
      action={
        <div className="task-group-header-actions">
          {onAddTask && (
            <button type="button" className="button button-primary task-add-button" onClick={onAddTask}>
              Add Task <span aria-hidden="true">+</span>
            </button>
          )}
          <span className="task-group-count">{visibleTasks.length}</span>
        </div>
      }
    >
      <div className="task-group-filters">
        <label>
          <span className="visually-hidden">{title} priority</span>
          <select
            aria-label={`${title} priority`}
            value={filters.priority}
            onChange={(event) => onFilterChange('priority', event.target.value)}
          >
            <option value="">All Priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="visually-hidden">{title} status</span>
          <select
            aria-label={`${title} status`}
            value={filters.status}
            onChange={(event) => onFilterChange('status', event.target.value)}
          >
            <option value="">All Status</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="button button-secondary task-filter-reset" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="task-list task-group-list">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <article className="task-card task-group-card" key={task.id}>
              <div className="task-main">
                <div className="task-title-row">
                  <h3>{task.title}</h3>
                  <span className={`priority-label priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
                <p>{task.description}</p>
                <span className="action-meta">
                  {task.category} · Due {task.due}
                </span>
              </div>
              <label className="task-status-control">
                <span className="visually-hidden">Status for {task.title}</span>
                <select
                  aria-label={`Status for ${task.title}`}
                  value={task.status}
                  onChange={(event) => onUpdateTask(task.id, event.target.value)}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))
        ) : (
          <p className="task-empty-state">No tasks match these filters.</p>
        )}
      </div>
    </Panel>
  );
}

export default function TasksPage() {
  const { tasks, updateTask, addTask } = useBenchData();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK_FORM);
  const [taskFormError, setTaskFormError] = useState('');
  const [requiredFilters, setRequiredFilters] = useState(DEFAULT_FILTERS);
  const [workFilters, setWorkFilters] = useState(DEFAULT_FILTERS);
  const mandatoryTasks = useMemo(
    () => tasks.filter((task) => task.category === 'Mandatory'),
    [tasks],
  );
  const assignedTasks = useMemo(
    () => tasks.filter((task) => task.category !== 'Mandatory'),
    [tasks],
  );
  const recommendations = [
    {
      title: 'Cloud Fundamentals',
      detail: 'Build foundational cloud skills to improve deployment readiness.',
      tag: 'Upskill',
      duration: '4 hours',
    },
    {
      title: 'Cybersecurity Basics',
      detail: 'Develop security knowledge that complements your current skill set.',
      tag: 'Cross-skill',
      duration: '3 hours',
    },
    {
      title: 'Agile Project Management',
      detail: 'Strengthen collaboration and project delivery skills.',
      tag: 'Cross-skill',
      duration: '5 hours',
    },
  ];

  function updateTaskForm(field, value) {
    setTaskForm((current) => ({ ...current, [field]: value }));
  }

  function handleAddTask(event) {
    event.preventDefault();
    setTaskFormError('');
    const saved = addTask({
      ...taskForm,
      due: formatDueDate(taskForm.due),
    });
    if (!saved) {
      setTaskFormError('Unable to save this task. Please try again.');
      return;
    }
    setTaskForm(DEFAULT_TASK_FORM);
    setIsAddTaskOpen(false);
  }

  function updateFilters(setFilters, field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-stack tasks-page">
      <PageHeader
        eyebrow="Personal Workspace"
        title="My Tasks"
        description="Manage your mandatory and assigned tasks."
        className="tasks-page-header"
      />
      <div className="stat-grid task-summary-grid">
        <StatCard
          label="Completed Tasks"
          value={tasks.filter((task) => task.status === 'Completed').length}
          detail="Tasks completed"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="In Progress"
          value={tasks.filter((task) => task.status === 'In Progress').length}
          detail="Actively working on"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Not Started"
          value={tasks.filter((task) => task.status === 'Not Started').length}
          detail="Ready when you are"
          tone="orange"
          icon="!"
        />
      </div>
      <div className="task-groups">
        <TaskGroup
          title="Mandatory Trainings"
          eyebrow="Required"
          tasks={mandatoryTasks}
          filters={requiredFilters}
          onFilterChange={(field, value) => updateFilters(setRequiredFilters, field, value)}
          onReset={() => setRequiredFilters(DEFAULT_FILTERS)}
          onUpdateTask={updateTask}
        />
        <TaskGroup
          title="Other Tasks"
          eyebrow="Assigned Work"
          tasks={assignedTasks}
          filters={workFilters}
          onFilterChange={(field, value) => updateFilters(setWorkFilters, field, value)}
          onReset={() => setWorkFilters(DEFAULT_FILTERS)}
          onUpdateTask={updateTask}
          onAddTask={() => {
            setTaskFormError('');
            setIsAddTaskOpen(true);
          }}
        />
      </div>
      <Panel
        title="AI Recommendations"
        eyebrow="Development"
        className="tasks-support-panel"
      >
        <div className="card-grid task-recommendation-grid">
          {recommendations.map((item) => (
            <article className="opportunity-card task-recommendation-card" key={item.title}>
              <div className="opportunity-top">
                <h3>{item.title}</h3>
                <span className="tag">{item.tag}</span>
              </div>
              <p>{item.detail}</p>
              <span className="muted-copy">{item.duration}</span>
            </article>
          ))}
        </div>
      </Panel>
      {isAddTaskOpen && (
        <Dialog
          title="Add New Task"
          description="Create a personal task to track alongside your assigned work."
          onClose={() => setIsAddTaskOpen(false)}
          className="task-dialog"
        >
          <form className="stacked-form task-form" onSubmit={handleAddTask}>
            <label className="field field-wide">
              <span>
                Task Name <b>*</b>
              </span>
              <input
                autoFocus
                required
                maxLength={100}
                value={taskForm.title}
                onChange={(event) => updateTaskForm('title', event.target.value)}
                placeholder="e.g. Complete Microsoft Intune Fundamentals"
              />
            </label>
            <label className="field field-wide">
              <span>
                Description <b>*</b>
              </span>
              <textarea
                required
                maxLength={500}
                value={taskForm.description}
                onChange={(event) => updateTaskForm('description', event.target.value)}
                placeholder="Briefly describe what needs to be completed"
              />
            </label>
            <div className="form-grid task-form-grid">
              <label className="field">
                <span>
                  Category <b>*</b>
                </span>
                <select
                  required
                  value={taskForm.category}
                  onChange={(event) => updateTaskForm('category', event.target.value)}
                >
                  <option value="Development">Development</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </label>
              <label className="field">
                <span>
                  Priority <b>*</b>
                </span>
                <select
                  required
                  value={taskForm.priority}
                  onChange={(event) => updateTaskForm('priority', event.target.value)}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>
                  Due Date <b>*</b>
                </span>
                <input
                  type="date"
                  required
                  value={taskForm.due}
                  onChange={(event) => updateTaskForm('due', event.target.value)}
                />
              </label>
              <label className="field">
                <span>
                  Status <b>*</b>
                </span>
                <select
                  required
                  value={taskForm.status}
                  onChange={(event) => updateTaskForm('status', event.target.value)}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <small className="task-status-help">You can update the status after creating the task.</small>
              </label>
            </div>
            {taskFormError && (
              <p className="task-form-error" role="alert">
                {taskFormError}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setIsAddTaskOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Submit
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
