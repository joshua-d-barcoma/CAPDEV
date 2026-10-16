import { useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

const certifications = [
  { title: 'Cloud Fundamentals', detail: 'Passed · Sep 2026', status: 'Completed' },
  {
    title: 'Cloud Architecture Associate',
    detail: 'Learning path in progress',
    status: 'In Progress',
  },
  {
    title: 'Infrastructure Automation',
    detail: 'Recommended for your capability',
    status: 'Recommended',
  },
];

const readiness = [
  { label: 'Technical profile updated', complete: true },
  { label: 'Resume uploaded', complete: true },
  { label: 'Primary skill mapping reviewed', complete: false },
  { label: 'Development plan discussed', complete: false },
];

export default function SkillHubPage() {
  const { cohorts, toggleCohort } = useBenchData();
  const [voucherRequested, setVoucherRequested] = useState(false);
  const [checkedItems, setCheckedItems] = useState(readiness.map((item) => item.complete));
  const completeCount = checkedItems.filter(Boolean).length;
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Skill Hub"
        description="Build capability, track readiness, and discover learning opportunities."
      />
      <div className="two-column-grid">
        <Panel title="Deployment readiness" eyebrow="Your checklist">
          <div className="readiness-meter">
            <strong>{Math.round((completeCount / readiness.length) * 100)}%</strong>
            <span>
              {completeCount} of {readiness.length} actions complete
            </span>
            <div className="progress-track">
              <i style={{ width: `${(completeCount / readiness.length) * 100}%` }} />
            </div>
          </div>
          <div className="checklist">
            {readiness.map((item, index) => (
              <label className="checklist-item" key={item.label}>
                <input
                  type="checkbox"
                  checked={checkedItems[index]}
                  onChange={(event) =>
                    setCheckedItems((current) =>
                      current.map((checked, itemIndex) =>
                        itemIndex === index ? event.target.checked : checked,
                      ),
                    )
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="Certifications" eyebrow="Skills and learning">
          <div className="compact-list">
            {certifications.map((item) => (
              <div className="compact-row" key={item.title}>
                <span className="learning-icon" aria-hidden="true">
                  ◇
                </span>
                <span className="compact-row-main">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
          <button
            className="button button-secondary voucher-button"
            onClick={() => setVoucherRequested(true)}
            disabled={voucherRequested}
          >
            {voucherRequested ? 'Voucher request submitted' : 'Request certification voucher'}
          </button>
        </Panel>
      </div>
      <Panel title="Capability cohorts" eyebrow="Learning missions">
        <div className="card-grid">
          {cohorts.map((cohort) => (
            <article className="opportunity-card" key={cohort.id}>
              <div className="opportunity-top">
                <span className="tag">{cohort.duration}</span>
                <StatusBadge status={cohort.joined ? 'Joined' : 'Open'} />
              </div>
              <h3>{cohort.name}</h3>
              <p>{cohort.focus}</p>
              <button
                className={`button ${cohort.joined ? 'button-secondary' : 'button-primary'} button-small`}
                onClick={() => toggleCohort(cohort.id)}
              >
                {cohort.joined ? 'Leave cohort' : 'Join cohort'}
              </button>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Announcements" eyebrow="For you">
        <div className="announcement-list">
          {[
            [
              'Onsite schedule reminder',
              'Follow the current team RTO schedule and reserve your office seat in advance.',
              'Attendance',
            ],
            [
              'Keep your skills profile current',
              'Review your primary skill mapping and update completed certifications.',
              'Profile',
            ],
            [
              'Bench learning opportunities',
              'Ask your Capability POC about current cohort missions and mentoring sessions.',
              'Learning',
            ],
          ].map(([title, description, category]) => (
            <article className="announcement-card" key={title}>
              <span className="tag">{category}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
