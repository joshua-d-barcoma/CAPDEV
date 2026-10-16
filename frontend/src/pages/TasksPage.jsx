import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

export default function TasksPage() {
  const { tasks, updateTask } = useBenchData();
  const [filter, setFilter] = useState('All');
  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === 'All' || task.status === filter),
    [filter, tasks],
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
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personal Workspace"
        title="My Tasks"
        description="Complete mandatory training and keep your development plan moving."
      />
      <div className="stat-grid">
        <StatCard
          label="Completed"
          value={tasks.filter((task) => task.status === 'Completed').length}
          detail="Tasks completed"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="In progress"
          value={tasks.filter((task) => task.status === 'In Progress').length}
          detail="Actively working on"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Not started"
          value={tasks.filter((task) => task.status === 'Not Started').length}
          detail="Ready when you are"
          tone="orange"
          icon="!"
        />
        <StatCard
          label="Required training"
          value={tasks.filter((task) => task.category === 'Mandatory').length}
          detail="Mandatory items"
          icon="◇"
        />
      </div>
      <Panel title="Task list" eyebrow="Training and development">
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
          {['All', 'Not Started', 'In Progress', 'Completed'].map((status) => (
            <button
              key={status}
              role="tab"
              aria-selected={filter === status}
              className={filter === status ? 'selected' : ''}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="task-list">
          {visibleTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <span
                className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}
                aria-hidden="true"
              >
                {task.status === 'Completed' ? '✓' : ''}
              </span>
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
              <label className="status-field">
                <span>Status</span>
                <select
                  value={task.status}
                  onChange={(event) => updateTask(task.id, event.target.value)}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>
            </article>
          ))}
          {visibleTasks.length === 0 && <p className="muted-copy">No tasks match this status.</p>}
        </div>
      </Panel>
      <Panel title="Recommended for you" eyebrow="Development opportunities">
        <div className="card-grid">
          {recommendations.map((item) => (
            <article className="opportunity-card" key={item.title}>
              <div className="opportunity-top">
                <span className="tag">{item.tag}</span>
                <span className="muted-copy">{item.duration}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
