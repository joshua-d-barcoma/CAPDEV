import { useEffect, useState } from 'react';
import './WelcomeMailer.css';

const PDF_URL = '/DC%20IIS%20Bench%20Welcome%20Mailer.pdf';

const sections = [
  { title: 'Welcome', subtitle: 'Introduction and overview', page: 1, icon: 'home' },
  {
    title: 'Work arrangement and Attendance',
    subtitle: 'RTO, schedule, and policies',
    page: 1,
    icon: 'calendar',
  },
  {
    title: 'Daily Login, Reporting and Availability',
    subtitle: 'Forms, leave process',
    page: 2,
    icon: 'monitor',
  },
  { title: 'MyTE Guidelines', subtitle: 'Time reporting and WBS', page: 2, icon: 'document' },
  {
    title: 'Learning Deployment & Contact',
    subtitle: 'Expectations and reminders',
    page: 3,
    icon: 'people',
  },
];

function SectionIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18m2 4H9m-6 4h18" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5m-10 4h6m-6 4h6" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-14a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 4v2h-4" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function getAcknowledgementKey(email) {
  return `benchflow_welcome_mailer_ack:${email.trim().toLowerCase()}`;
}

function getDismissalKey(email) {
  return `benchflow_welcome_mailer_dismissed:${email.trim().toLowerCase()}`;
}

export function clearWelcomeMailerDismissal(email) {
  if (!email) return;

  try {
    window.sessionStorage.removeItem(getDismissalKey(email));
  } catch (error) {
    console.error('Unable to clear the Welcome Mailer dismissal:', error);
  }
}

function getInitialState(email) {
  try {
    return {
      open:
        window.localStorage.getItem(getAcknowledgementKey(email)) !== 'true' &&
        window.sessionStorage.getItem(getDismissalKey(email)) !== 'true',
      acknowledged: window.localStorage.getItem(getAcknowledgementKey(email)) === 'true',
      error: '',
    };
  } catch (error) {
    console.error('Unable to read the Welcome Mailer acknowledgement:', error);
    return {
      open: true,
      acknowledged: false,
      error: 'Your acknowledgement status could not be read. You can still review the mailer.',
    };
  }
}

export function WelcomeMailer({ email, openRequest = 0 }) {
  const [initialState] = useState(() => getInitialState(email));
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [acknowledged, setAcknowledged] = useState(initialState.acknowledged);
  const [isAcknowledged, setIsAcknowledged] = useState(initialState.acknowledged);
  const [error, setError] = useState(initialState.error);

  useEffect(() => {
    const latestState = getInitialState(email);
    if (!latestState.open && openRequest === 0) return undefined;

    setActiveSection(0);
    setAcknowledged(latestState.acknowledged);
    setIsAcknowledged(latestState.acknowledged);
    setError(latestState.error);
    setIsOpen(true);
    return undefined;
  }, [email, openRequest]);

  if (!isOpen) return null;

  const section = sections[activeSection];
  const documentUrl = `${PDF_URL}#page=${section.page}&toolbar=0&navpanes=0&view=FitH`;

  function dismissForSession() {
    try {
      window.sessionStorage.setItem(getDismissalKey(email), 'true');
      setIsOpen(false);
    } catch (storageError) {
      console.error('Unable to remember the Welcome Mailer dismissal:', storageError);
      setError('Your dismissal could not be saved for this session. Please try again.');
    }
  }

  function submitAcknowledgement(event) {
    event.preventDefault();
    if (!acknowledged || isAcknowledged) return;

    try {
      window.localStorage.setItem(getAcknowledgementKey(email), 'true');
      setIsAcknowledged(true);
      setAcknowledged(true);
      setError('');
    } catch (storageError) {
      console.error('Unable to save the Welcome Mailer acknowledgement:', storageError);
      setError('Your acknowledgement could not be saved. Please try again.');
    }
  }

  return (
    <div className="welcome-mailer-backdrop">
      <section
        className="welcome-mailer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-mailer-title"
      >
        <header className="welcome-mailer-header">
          <span className="welcome-mailer-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="28" height="28" rx="7" />
              <path d="m7 10 9 7 9-7M8 23h16V9H8z" />
            </svg>
          </span>
          <div>
            <span className="welcome-mailer-eyebrow">Mailer Acknowledgement</span>
            <h2 id="welcome-mailer-title">Digital Core IIS Bench Welcome Mailer</h2>
            <p>Please review all sections of the guidelines and acknowledge to proceed.</p>
          </div>
        </header>

        <div className="welcome-mailer-content">
          <nav className="welcome-mailer-nav" aria-label="Welcome mailer sections">
            {sections.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={`welcome-mailer-nav-item${activeSection === index ? ' active' : ''}`}
                aria-current={activeSection === index ? 'page' : undefined}
                onClick={() => setActiveSection(index)}
              >
                <span className="welcome-mailer-nav-icon">
                  <SectionIcon name={item.icon} />
                </span>
                <span className="welcome-mailer-nav-copy">
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="welcome-mailer-document">
            <iframe
              key={section.page}
              title={`Welcome mailer: ${section.title}`}
              src={documentUrl}
            />
            <a href={PDF_URL} target="_blank" rel="noreferrer">
              Open the full Welcome Mailer PDF
            </a>
          </div>
        </div>

        <form className="welcome-mailer-footer" onSubmit={submitAcknowledgement}>
          <div
            className={`welcome-mailer-status${isAcknowledged ? ' is-acknowledged' : ' is-pending'}`}
            role="status"
            aria-live="polite"
          >
            <div className="welcome-mailer-status-heading">
              <span className="welcome-mailer-status-dot" aria-hidden="true" />
              <span>Acknowledgement Status</span>
              <strong>{isAcknowledged ? 'Acknowledged' : 'Not Acknowledged'}</strong>
            </div>
            <p>
              {isAcknowledged
                ? 'Acknowledged successfully. No further action is required.'
                : 'Pending acknowledgement. Please review the mailer and acknowledge receipt.'}
            </p>
          </div>

          <div className="welcome-mailer-footer-controls">
            <label
              className={`welcome-mailer-acknowledgement${isAcknowledged ? ' is-accepted' : ''}`}
            >
              <input
                type="checkbox"
                required={!isAcknowledged}
                checked={acknowledged}
                disabled={isAcknowledged}
                onChange={(event) => {
                  setAcknowledged(event.target.checked);
                  setError('');
                }}
              />
              <span>
                Yes, I acknowledge receipt and have reviewed it
                {isAcknowledged && <span className="welcome-mailer-accepted">Accepted</span>}
              </span>
            </label>
            <div className="welcome-mailer-actions">
              <button type="button" className="button button-secondary" onClick={dismissForSession}>
                {isAcknowledged ? 'Close' : 'Cancel'}
              </button>
              <button
                type="submit"
                className={`button button-primary${isAcknowledged ? ' is-acknowledged' : ''}`}
                disabled={isAcknowledged}
              >
                {isAcknowledged ? 'Accepted' : 'Submit'}
              </button>
            </div>
          </div>
          {error && <p className="welcome-mailer-error" role="alert">{error}</p>}
        </form>
      </section>
    </div>
  );
}
