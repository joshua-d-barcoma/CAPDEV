import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

const learningItems = [
  {
    title: 'Cloud Fundamentals',
    detail: 'Passed · Sep 2026',
    status: 'Completed',
    progress: 100,
    audience: 'Cloud',
  },
  {
    title: 'Cloud Architecture Associate',
    detail: 'Learning path in progress',
    status: 'In Progress',
    progress: 62,
    audience: 'Cloud',
  },
  {
    title: 'Infrastructure Automation',
    detail: 'Recommended for your capability',
    status: 'Recommended',
    progress: 0,
    audience: 'Engineering',
  },
  {
    title: 'Security Awareness',
    detail: 'Annual mandatory training',
    status: 'In Progress',
    progress: 40,
    audience: 'All employees',
  },
];

export default function LearningPage() {
  const { cohorts } = useBenchData();
  const completed = learningItems.filter((item) => item.status === 'Completed').length;
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Capability Development"
        title="Learning"
        description="Track training completion and capability development opportunities."
      />
      <div className="stat-grid">
        <StatCard
          label="Learning paths"
          value={learningItems.length}
          detail="Available this quarter"
          icon="◇"
        />
        <StatCard
          label="Completed"
          value={completed}
          detail="Learning paths completed"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="In progress"
          value={learningItems.filter((item) => item.status === 'In Progress').length}
          detail="Across the bench"
          tone="blue"
          icon="◷"
        />
        <StatCard
          label="Active cohorts"
          value={cohorts.length}
          detail="Development missions"
          tone="orange"
          icon="♙"
        />
      </div>
      <Panel title="Learning paths" eyebrow="Training overview">
        <div className="learning-list">
          {learningItems.map((item) => (
            <article className="learning-row" key={item.title}>
              <span className="learning-icon" aria-hidden="true">
                ◇
              </span>
              <div className="learning-main">
                <strong>{item.title}</strong>
                <span>
                  {item.detail} · {item.audience}
                </span>
                <div className="progress-track">
                  <i style={{ width: `${item.progress}%` }} />
                </div>
              </div>
              <StatusBadge status={item.status} />
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Development cohorts" eyebrow="Team opportunities">
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
      </Panel>
    </div>
  );
}
