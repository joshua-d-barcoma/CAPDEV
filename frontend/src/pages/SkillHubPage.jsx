import { useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

const readiness = [
  { label: 'Technical profile updated', complete: true },
  { label: 'Resume uploaded', complete: true },
  { label: 'Primary skill mapping reviewed', complete: false },
  { label: 'Development plan discussed', complete: false },
];

const competencies = [
  { name: 'Cloud Infrastructure', level: 'Intermediate', score: 72 },
  { name: 'Infrastructure Automation', level: 'Beginner', score: 40 },
  { name: 'DevOps Practices', level: 'Proficient', score: 85 },
  { name: 'Security & Compliance', level: 'Developing', score: 55 },
];

const bootcamps = [
  {
    id: 'cloud-practitioner',
    name: 'Cloud Practitioner Bootcamp',
    schedule: 'Nov 10–14, 2026 · 5 days · Online · 12 seats remaining',
    enrolled: false,
  },
  {
    id: 'devsecops',
    name: 'DevSecOps Fundamentals',
    schedule: 'Dec 1–5, 2026 · 5 days · Hybrid · 20 seats remaining',
    enrolled: false,
  },
  {
    id: 'infrastructure-code',
    name: 'Infrastructure as Code Intensive',
    schedule: 'Oct 28–Nov 1, 2026 · 5 days · Online',
    enrolled: true,
  },
];

const pointsOfContact = [
  {
    initials: 'CL',
    name: 'Capability POC',
    focus: 'Cloud & Infrastructure',
    description: 'Handles certification vouchers, cloud cohort inquiries, and skill assessments.',
    subject: 'Question about cloud and infrastructure learning',
  },
  {
    initials: 'LM',
    name: 'Learning & Development POC',
    focus: 'Bootcamps & Missions',
    description: 'Coordinates bootcamp enrollments, cohort registrations, and learning path planning.',
    subject: 'Question about bootcamps and learning missions',
  },
  {
    initials: 'DR',
    name: 'Deployment Readiness POC',
    focus: 'Readiness & Placement',
    description: 'Reviews readiness checklist progress, development plans, and deployment placement.',
    subject: 'Question about deployment readiness',
  },
];

export default function SkillHubPage() {
  const { cohorts, certifications, announcements, toggleCohort } = useBenchData();
  const [voucherRequested, setVoucherRequested] = useState(false);
  const [checkedItems, setCheckedItems] = useState(readiness.map((item) => item.complete));
  const [enrolledBootcamps, setEnrolledBootcamps] = useState(
    () => new Set(bootcamps.filter((bootcamp) => bootcamp.enrolled).map((bootcamp) => bootcamp.id)),
  );
  const completeCount = checkedItems.filter(Boolean).length;
  const readinessPercent = Math.round((completeCount / readiness.length) * 100);

  function toggleBootcamp(bootcampId) {
    setEnrolledBootcamps((current) => {
      const next = new Set(current);
      if (next.has(bootcampId)) next.delete(bootcampId);
      else next.add(bootcampId);
      return next;
    });
  }

  return (
    <div className="page-stack skill-hub-page">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Skill Hub"
        description="Build capability, track readiness, and discover learning opportunities."
      />
      <div className="two-column-grid skill-hub-overview">
        <Panel
          title="Deployment readiness"
          eyebrow="Your checklist"
          className="skill-hub-readiness-panel"
        >
          <div className="readiness-meter">
          <strong>{readinessPercent}%</strong>
            <span>
            {completeCount} of {readiness.length} complete · {completeCount} ÷ {readiness.length} × 100 = {readinessPercent}%
            </span>
            <div
              className="progress-track"
              title={`Readiness checklist: ${completeCount} of ${readiness.length} complete (${readinessPercent}%)`}
            >
            <i style={{ width: `${readinessPercent}%` }} />
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
                <span className={`skill-hub-check-status${checkedItems[index] ? ' is-done' : ''}`}>
                  {checkedItems[index] ? 'Done' : 'Pending'}
                </span>
              </label>
            ))}
          </div>
        </Panel>
        <Panel
          title="Certifications"
          eyebrow="Skills and learning"
          className="skill-hub-certifications-panel"
        >
          <div className="compact-list">
            {certifications.map((item) => (
              <div className="compact-row" key={item.title}>
                <span className="learning-icon" aria-hidden="true">
                  {item.status === 'Completed' ? '♧' : item.status === 'In Progress' ? '◯' : '⌘'}
                </span>
                <span className="compact-row-main">
                  <strong>{item.title}</strong>
                  {item.status === 'In Progress' ? (
                    <>
                      <small>60% complete · Continue learning</small>
                      <span className="skill-hub-cert-progress">
                        <i style={{ width: '60%' }} />
                      </span>
                    </>
                  ) : (
                    <small>
                      {item.detail}
                      {item.status === 'Completed' && ' · View certificate'}
                      {item.status === 'Recommended' && ' · View learning path'}
                    </small>
                  )}
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
      <Panel
        title="Competency Proficiency"
        eyebrow="Skill Assessment"
        className="skill-hub-proficiency-panel"
        action={<span className="skill-hub-panel-note">Illustrative assessment levels</span>}
      >
        <div className="skill-hub-proficiency-list">
          {competencies.map((competency) => (
            <div className="skill-hub-proficiency-row" key={competency.name}>
              <div className="skill-hub-proficiency-heading">
                <strong>{competency.name}</strong>
                <span>
                  <b>{competency.level}</b>
                  {competency.score}%
                </span>
              </div>
              <div
                className="skill-hub-proficiency-track"
                role="img"
                aria-label={`${competency.name}: ${competency.level}, ${competency.score}%`}
                  title={`${competency.name}: ${competency.level}, illustrative assessment score ${competency.score}%`}
                >
                <i style={{ width: `${competency.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Bench Cohorts"
        eyebrow="Learning missions"
        className="skill-hub-cohorts-panel"
        action={<span className="skill-hub-panel-note">Learn together. Build real capability.</span>}
      >
        <div className="card-grid skill-hub-cohort-grid">
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
      <Panel
        title="Upcoming Bootcamps"
        eyebrow="Learning Opportunities"
        className="skill-hub-bootcamps-panel"
        action={<span className="skill-hub-panel-note">Illustrative schedules · confirm availability</span>}
      >
        <div className="skill-hub-bootcamp-list">
          {bootcamps.map((bootcamp) => {
            const enrolled = enrolledBootcamps.has(bootcamp.id);
            return (
              <article
                className={`skill-hub-bootcamp-row${enrolled ? ' is-enrolled' : ''}`}
                key={bootcamp.id}
              >
                <span className="skill-hub-bootcamp-icon" aria-hidden="true">▦</span>
                <span className="skill-hub-bootcamp-copy">
                  <strong>{bootcamp.name}</strong>
                  <small>{bootcamp.schedule}</small>
                </span>
                {enrolled ? (
                  <span className="skill-hub-enrolled-label">Enrolled</span>
                ) : (
                  <button
                    type="button"
                    className="button button-primary button-small"
                    onClick={() => toggleBootcamp(bootcamp.id)}
                  >
                    Enroll
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Announcements"
        eyebrow="For you"
        className="skill-hub-announcements-panel"
        action={<span className="skill-hub-panel-note">Stay informed and keep moving forward</span>}
      >
        <div className="announcement-list skill-hub-announcement-grid">
          {announcements.map((announcement) => (
            <article className="announcement-card" key={announcement.id}>
              <span className="skill-hub-announcement-category">
                <span aria-hidden="true">▣</span> {announcement.category}
              </span>
              <h3>{announcement.title}</h3>
              <p>{announcement.description}</p>
            </article>
          ))}
          <article className="announcement-card skill-hub-generated-announcement">
            <span className="skill-hub-announcement-category">
              <span aria-hidden="true">●</span> Deployment
            </span>
            <h3>{readiness.length - completeCount} Readiness criteria still pending</h3>
            <p>Complete your skill mapping review and discuss your development plan to reach full readiness.</p>
          </article>
          <article className="announcement-card skill-hub-generated-announcement">
            <span className="skill-hub-announcement-category">
              <span aria-hidden="true">⌘</span> Capability
            </span>
            <h3>Skills gap identified</h3>
            <p>Security &amp; Compliance is at developing level. Consider enrolling in an upcoming bootcamp.</p>
          </article>
        </div>
      </Panel>
      <Panel
        title="Capability-Based POCs"
        eyebrow="Get Support"
        className="skill-hub-poc-panel"
        action={<span className="skill-hub-panel-note">Reach out to your assigned points of contact</span>}
      >
        <div className="skill-hub-poc-grid">
          {pointsOfContact.map((contact) => (
            <article className="skill-hub-poc-card" key={contact.initials}>
              <div className="skill-hub-poc-heading">
                <span className="skill-hub-poc-avatar">{contact.initials}</span>
                <span>
                  <strong>{contact.name}</strong>
                  <small>{contact.focus}</small>
                </span>
              </div>
              <p>{contact.description}</p>
              <a
                className="button button-secondary button-small"
                href={`mailto:?subject=${encodeURIComponent(contact.subject)}`}
              >
                Send a message
              </a>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
