import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';

export default function UserDashboard() {
  const { tasks, checkedIn } = useBenchData();
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <div>
          <span className="page-eyebrow">Personal Workspace</span>
          <h1>
            Good afternoon, Alex <span aria-hidden="true">👋</span>
          </h1>
          <p>SRE / Hybrid Cloud · CL8 · Capability Building · Day 51 on bench</p>
          <div className="welcome-actions">
            <Link className="button button-light" to={ROUTES.timeIn}>
              {checkedIn ? 'View check-in' : 'Check in at CG2'}
            </Link>
            <Link className="button button-outline-light" to={ROUTES.tasks}>
              View tasks
            </Link>
          </div>
        </div>
        <span className="welcome-mark" aria-hidden="true">
          &gt;
        </span>
      </section>
      <PageHeader
        eyebrow="Your workspace"
        title="My Dashboard"
        description="Track your tasks, training, attendance, and development."
      />
      <section className="profile-card panel">
        <img
          src="/assets/images/profile-placeholder.jpg"
          alt="Alex Santos profile"
          className="profile-image"
        />
        <div className="profile-main">
          <div className="profile-name-row">
            <h2>Alex Santos</h2>
            <span className="tag">CL8</span>
          </div>
          <span className="muted-copy">Bench resource · Manila</span>
        </div>
        <div className="profile-detail">
          <span>Capability</span>
          <strong>SRE / Hybrid Cloud</strong>
        </div>
        <div className="profile-detail">
          <span>Career level</span>
          <strong>CL8</strong>
        </div>
        <div className="profile-detail profile-skills">
          <span>Skills</span>
          <div className="skill-tags">
            {['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Python'].map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label="Task completion"
          value={`${progress}%`}
          detail={`${completed} of ${tasks.length} tasks complete`}
          icon="✓"
          tone="green"
        />
        <StatCard label="Bench days" value="51" detail="Since roll-in on Jul 14" icon="◷" />
        <StatCard
          label="Training progress"
          value="54%"
          detail="2 of 3 required trainings started"
          icon="◇"
          tone="blue"
        />
        <StatCard
          label="Today's attendance"
          value={checkedIn ? 'Checked in' : 'Not checked in'}
          detail={checkedIn ? 'Time-in recorded' : 'Remember to record your time-in'}
          icon="▣"
          tone={checkedIn ? 'green' : 'orange'}
        />
      </div>
      <Panel
        title="Your tasks"
        eyebrow="Next steps"
        action={
          <Link className="text-link" to={ROUTES.tasks}>
            See all tasks
          </Link>
        }
      >
        <div className="compact-list">
          {tasks
            .filter((task) => task.status !== 'Completed')
            .slice(0, 3)
            .map((task) => (
              <div className="compact-row" key={task.id}>
                <span className="task-bullet" />
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
    </div>
  );
}
