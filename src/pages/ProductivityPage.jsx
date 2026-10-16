import { DataTable } from '../components/DataTable.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

export default function ProductivityPage() {
  const { tasks, updateTask } = useBenchData();
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const columns = [
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
    { key: 'due', label: 'Due' },
    {
      key: 'priority',
      label: 'Priority',
      render: (task) => (
        <span className={`priority-label priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (task) => (
        <select
          className="status-select"
          aria-label={`Status for ${task.title}`}
          value={task.status}
          onChange={(event) => updateTask(task.id, event.target.value)}
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
      ),
    },
  ];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Bench Management"
        title="Tasks & Productivity"
        description="Monitor training and work progress across the bench."
      />
      <div className="stat-grid">
        <StatCard
          label="Assigned tasks"
          value={tasks.length}
          detail="Across active resources"
          icon="✓"
        />
        <StatCard
          label="Completed"
          value={completed}
          detail="Tasks marked complete"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="In progress"
          value={tasks.filter((task) => task.status === 'In Progress').length}
          detail="Currently active"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Not started"
          value={tasks.filter((task) => task.status === 'Not Started').length}
          detail="Awaiting action"
          tone="orange"
          icon="!"
        />
      </div>
      <Panel title="Task status by capability" eyebrow="Productivity overview">
        <div className="bar-list">
          {['Mandatory', 'Development', 'Assignment'].map((category) => {
            const scoped = tasks.filter((task) => task.category === category);
            const progress = scoped.length
              ? Math.round(
                  (scoped.filter((task) => task.status === 'Completed').length / scoped.length) *
                    100,
                )
              : 0;
            return (
              <div className="bar-row" key={category}>
                <span>{category}</span>
                <div className="bar-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <strong>{progress}%</strong>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Task register" eyebrow={`${tasks.length} assigned`}>
        <DataTable columns={columns} rows={tasks} rowKey={(task) => task.id} />
      </Panel>
    </div>
  );
}
