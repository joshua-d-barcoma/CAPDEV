import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DataTable } from '../components/DataTable.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { formatDate } from '../utils/formatters.js';
import { formatTime, getCurrentTimeInput } from '../utils/timeEntry.js';
import './TimeEntryPage.css';

const workTypes = ['Onsite', 'Work from home', 'Leave', 'Other'];
const standardCapabilities = [
  'Carrier Networks',
  'Cloud Customer Edge',
  'Digital Workplace - CWP',
  'Hybrid Cloud - Database',
  'Hybrid Cloud - Migration',
  'Hybrid Cloud - Operations',
  'Network',
  'Service Management',
  'SRE',
];

function getLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function EntryIcon({ type }) {
  const paths = {
    time: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    links: (
      <>
        <path d="M10 13.5 8.5 15a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" />
        <path d="m14 10.5 1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
        <path d="m9 15 6-6" />
      </>
    ),
    reminder: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    tips: (
      <>
        <path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 12.7c.8.6 1 1 1 1.8h6c0-.8.2-1.2 1-1.8A7 7 0 0 0 12 2Z" />
      </>
    ),
    records: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5h6M8 10h8M8 14h8M8 18h5" />
      </>
    ),
  };

  return (
    <span className={`time-entry-icon time-entry-icon-${type}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">{paths[type]}</svg>
    </span>
  );
}

function InfoCard({ type, title, children }) {
  return (
    <article className={`time-entry-info-card time-entry-info-${type}`}>
      <EntryIcon type={type} />
      <div>
        <h3>{title}</h3>
        {children}
      </div>
    </article>
  );
}

export default function TimeEntryPage() {
  const isTimeOut = useLocation().pathname.endsWith('time-out');
  const { employees, attendanceRecords, checkedIn, submitAttendance, setCheckedIn } =
    useBenchData();
  const alex = employees.find((employee) => employee.name === 'Alex Santos');
  const capabilities =
    alex && !standardCapabilities.includes(alex.capability)
      ? [...standardCapabilities, alex.capability]
      : standardCapabilities;
  const [initialClock] = useState(getCurrentTimeInput);
  const [workType, setWorkType] = useState('Onsite');
  const [location, setLocation] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [otherWorkType, setOtherWorkType] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [capability, setCapability] = useState(alex?.capability ?? '');
  const [employeeCode, setEmployeeCode] = useState(alex?.employeeId ?? '');
  const [timeIn, setTimeIn] = useState(initialClock.time);
  const [timeOut, setTimeOut] = useState(initialClock.time);
  const [remarks, setRemarks] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [trackerCompleted, setTrackerCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const today = getLocalDate();
  const employeeRecords = useMemo(
    () =>
      attendanceRecords
        .filter((record) => record.employeeId === alex?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [attendanceRecords, alex?.id],
  );
  const visibleRecords = isTimeOut
    ? employeeRecords.filter((record) => record.timeOut)
    : employeeRecords;
  const columns = isTimeOut
    ? [
        { key: 'date', label: 'Date', render: (record) => formatDate(record.date) },
        { key: 'timeOut', label: 'Time Out' },
        {
          key: 'accomplishments',
          label: 'Accomplishments',
          render: (record) => record.accomplishments || '—',
        },
        {
          key: 'status',
          label: 'Status',
          render: (record) => <StatusBadge status={record.timeOut ? 'Submitted' : record.status} />,
        },
      ]
    : [
        { key: 'date', label: 'Date', render: (record) => formatDate(record.date) },
        { key: 'timeIn', label: 'Time In' },
        { key: 'workType', label: 'Work Setup' },
        { key: 'location', label: 'Location' },
        { key: 'remarks', label: 'Remarks', render: (record) => record.remarks || '—' },
        {
          key: 'status',
          label: 'Status',
          render: (record) => (
            <StatusBadge status={record.status === 'Present' ? 'Submitted' : record.status} />
          ),
        },
      ];

  function submit(event) {
    event.preventDefault();
    setError('');
    const submittedTime = formatTime(isTimeOut ? timeOut : timeIn);
    if (!submittedTime) {
      setError('Enter a valid time with AM or PM, such as 5:45 PM. You can also use 17:45.');
      return;
    }

    if (isTimeOut) {
      if (!checkedIn) {
        setError('You need to record your time-in before submitting time-out.');
        return;
      }
      if (!employeeRecords.some((record) => record.date === today)) {
        setError(
          'No time-in record was found for today. Record your time-in before submitting time-out.',
        );
        return;
      }
      if (
        setCheckedIn(false, {
          employeeId: alex?.id,
          date: today,
          timeOut: submittedTime,
          accomplishments: accomplishments.trim(),
        })
      ) {
        setMessage('Your time-out has been recorded. Have a great evening!');
        setAccomplishments('');
      }
      return;
    }
    if (checkedIn) {
      setError('Your time-in is already recorded. Submit time-out before starting another entry.');
      return;
    }
    if (
      !alex ||
      !employeeCode.trim() ||
      !capability ||
      !acknowledged ||
      (workType === 'Onsite' && !location)
    ) {
      setError('Complete all required fields and acknowledge the attendance declaration.');
      return;
    }
    if (
      (workType === 'Onsite' && location === 'Other' && !otherLocation.trim()) ||
      (workType === 'Onsite' && location !== 'Other' && !seatNumber.trim()) ||
      (workType === 'Other' && !otherWorkType.trim()) ||
      (['Work from home', 'Leave'].includes(workType) && !trackerCompleted)
    ) {
      setError('Complete the additional details required for the selected work type.');
      return;
    }
    const record = {
      employeeId: alex.id,
      employeeCode: employeeCode.trim(),
      date: today,
      timeIn: submittedTime,
      workType: workType === 'Other' ? otherWorkType : workType,
      location: workType !== 'Onsite' ? '—' : location === 'Other' ? otherLocation : location,
      status: workType === 'Leave' ? 'Vacation Leave' : 'Present',
      seatNumber: workType === 'Onsite' ? seatNumber : '',
      capability,
      remarks: remarks.trim(),
    };
    if (submitAttendance(record)) {
      setMessage('Your time-in has been recorded successfully.');
      setRemarks('');
    }
  }

  return (
    <div
      className={`page-stack time-entry-page ${isTimeOut ? 'time-entry-page-out' : 'time-entry-page-in'}`}
    >
      <PageHeader
        className="time-entry-page-header"
        eyebrow="Personal Workspace"
        title={isTimeOut ? 'Time Out & Daily Accomplishments' : 'My Time In & Attendance'}
        description={
          isTimeOut
            ? 'Record your time-out and summarize your completed work for the day.'
            : 'Record your time-in and access the required attendance systems.'
        }
      />
      {message && (
        <div className="success-message" role="status">
          {message} <Link to={ROUTES.userDashboard}>Return to dashboard</Link>
        </div>
      )}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <div className="time-entry-main-grid">
        <Panel
          className="time-entry-form-panel"
          title={isTimeOut ? 'EOD / Time-Out Form' : 'Time-In Attendance Form'}
          eyebrow={isTimeOut ? 'Complete your day' : 'Record your work location'}
          action={<EntryIcon type="time" />}
        >
          <form
            className={`time-entry-form ${isTimeOut ? 'time-entry-form-out' : ''}`}
            onSubmit={submit}
          >
            {isTimeOut ? (
              <>
                <label className="field">
                  <span>
                    Employee ID <b aria-hidden="true">*</b>
                  </span>
                  <input
                    required
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value)}
                    placeholder="Enter your employee ID"
                  />
                </label>
                <label className="field">
                  <span>Date</span>
                  <input type="text" value={formatDate(today)} readOnly />
                </label>
                <label className="field">
                  <span>
                    Time Out <b aria-hidden="true">*</b>
                  </span>
                  <input
                    required
                    type="text"
                    value={timeOut}
                    onChange={(event) => setTimeOut(event.target.value)}
                    aria-label="Time Out"
                    placeholder="e.g. 5:45 PM"
                    autoComplete="off"
                    inputMode="text"
                  />
                </label>
                <label className="field field-wide">
                  <span>Daily Accomplishments</span>
                  <textarea
                    rows="4"
                    value={accomplishments}
                    onChange={(event) => setAccomplishments(event.target.value)}
                    placeholder="Write your accomplishments for today."
                  />
                </label>
              </>
            ) : (
              <>
                <label className="field">
                  <span>Date</span>
                  <input type="text" value={formatDate(today)} readOnly />
                </label>
                <label className="field">
                  <span>
                    Employee ID <b aria-hidden="true">*</b>
                  </span>
                  <input
                    required
                    value={employeeCode}
                    onChange={(event) => setEmployeeCode(event.target.value)}
                    placeholder="Enter your employee ID"
                  />
                </label>
                <label className="field">
                  <span>
                    Time In <b aria-hidden="true">*</b>
                  </span>
                  <input
                    required
                    type="text"
                    value={timeIn}
                    onChange={(event) => setTimeIn(event.target.value)}
                    aria-label="Time In"
                    placeholder="e.g. 8:30 AM"
                    autoComplete="off"
                    inputMode="text"
                  />
                </label>
                <label className="field">
                  <span>
                    Capability <b aria-hidden="true">*</b>
                  </span>
                  <select
                    required
                    value={capability}
                    onChange={(event) => setCapability(event.target.value)}
                  >
                    <option value="">Select a capability</option>
                    {capabilities.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>
                    Work Setup <b aria-hidden="true">*</b>
                  </span>
                  <select
                    required
                    value={workType}
                    onChange={(event) => {
                      setWorkType(event.target.value);
                      setLocation('');
                      setOtherLocation('');
                      setOtherWorkType('');
                      setSeatNumber('');
                      setTrackerCompleted(false);
                    }}
                  >
                    {workTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {workType === 'Onsite' && (
                  <>
                    <label className="field">
                      <span>
                        Location <b aria-hidden="true">*</b>
                      </span>
                      <select
                        required
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                      >
                        <option value="">Select location</option>
                        <option>Mandaluyong, Robinsons Cybergate Tower 2</option>
                        <option>Cebu IT Park, Cyberzone 2</option>
                        <option>Other</option>
                      </select>
                    </label>
                    {location === 'Other' ? (
                      <label className="field">
                        <span>
                          Other office location <b aria-hidden="true">*</b>
                        </span>
                        <input
                          required
                          value={otherLocation}
                          onChange={(event) => setOtherLocation(event.target.value)}
                          placeholder="Enter the office location"
                        />
                      </label>
                    ) : location ? (
                      <label className="field">
                        <span>
                          Seat number <b aria-hidden="true">*</b>
                        </span>
                        <input
                          required
                          value={seatNumber}
                          onChange={(event) => setSeatNumber(event.target.value)}
                          placeholder="e.g. CG2-05-18"
                        />
                      </label>
                    ) : null}
                  </>
                )}
                {workType === 'Other' && (
                  <label className="field">
                    <span>
                      Other work type <b aria-hidden="true">*</b>
                    </span>
                    <input
                      required
                      value={otherWorkType}
                      onChange={(event) => setOtherWorkType(event.target.value)}
                      placeholder="Describe your work type"
                    />
                  </label>
                )}
                <label className="field field-wide">
                  <span>Remarks</span>
                  <textarea
                    rows="2"
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Add remarks for today's attendance."
                  />
                </label>
                {['Work from home', 'Leave'].includes(workType) && (
                  <label className="field field-wide checkbox-field">
                    <input
                      type="checkbox"
                      required
                      checked={trackerCompleted}
                      onChange={(event) => setTrackerCompleted(event.target.checked)}
                    />
                    <span>
                      I confirm that my {workType === 'Leave' ? 'leave' : 'work-from-home'} tracker
                      has been completed.
                    </span>
                  </label>
                )}
                <label className="field field-wide checkbox-field">
                  <input
                    type="checkbox"
                    required
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                  <span>
                    I confirm that the information provided is accurate and reflects my work
                    location for today.
                  </span>
                </label>
              </>
            )}
            <div className="time-entry-form-actions field-wide">
              <Link className="button button-secondary" to={ROUTES.userDashboard}>
                Cancel
              </Link>
              <button className="button button-primary" type="submit">
                Submit {isTimeOut ? 'time-out' : 'time-in'}
              </button>
            </div>
          </form>
        </Panel>
        {isTimeOut ? (
          <aside className="time-entry-info-stack" aria-label="Time-out guidance">
            <InfoCard type="reminder" title="Important Reminders">
              <ul>
                <li>Submit your time-out at the end of your workday.</li>
                <li>Include all relevant accomplishments for today.</li>
                <li>Your record will be saved automatically.</li>
                <li>Contact your Bench Lead if you encounter issues.</li>
              </ul>
            </InfoCard>
            <InfoCard type="tips" title="Tips for Great Summary">
              <ul>
                <li>Be specific and concise.</li>
                <li>Include key deliverables, meetings, and learned skills.</li>
                <li>Mention any blockers or support needed.</li>
                <li>Focus on impact and progress.</li>
              </ul>
            </InfoCard>
          </aside>
        ) : (
          <aside className="time-entry-info-stack" aria-label="Attendance resources and reminders">
            <InfoCard type="reminder" title="Important Reminders">
              <ul>
                <li>Please submit your time-in before starting your workday.</li>
                <li>Your attendance will be routed to your lead for review.</li>
                <li>Contact your Bench Lead if you encounter issues.</li>
              </ul>
            </InfoCard>
            <Panel title="Attendance Links" eyebrow="Resources for your attendance">
              <div className="time-entry-links">
                <InfoCard type="links" title="Office Pulse">
                  <p>Use Office Pulse to check in and record your in-office attendance.</p>
                  <button className="button button-secondary" type="button" disabled>
                    Open Office Pulse <span aria-hidden="true">↗</span>
                  </button>
                </InfoCard>
                <InfoCard type="links" title="Bench Leave Tracker">
                  <p>Use the Bench Leave Tracker to submit leave and work-from-home requests.</p>
                  <button className="button button-secondary" type="button" disabled>
                    Open Bench Leave Tracker <span aria-hidden="true">↗</span>
                  </button>
                </InfoCard>
              </div>
            </Panel>
          </aside>
        )}
      </div>
      <Panel
        className="time-entry-records-panel"
        title={isTimeOut ? 'Recent Time-Out Submissions' : 'Recent Time-In Records'}
        eyebrow={
          isTimeOut
            ? 'Your latest time-out and accomplishment records'
            : 'Your latest time-in submissions'
        }
        action={
          <span className="time-entry-count">
            {visibleRecords.length} {visibleRecords.length === 1 ? 'record' : 'records'}
          </span>
        }
      >
        <DataTable
          columns={columns}
          rows={visibleRecords}
          rowKey={(record) => `${record.id}-${isTimeOut ? 'out' : 'in'}`}
          className="time-entry-table-scroll"
          emptyTitle={isTimeOut ? 'No time-out submissions yet' : 'No time-in records yet'}
          emptyDescription={
            isTimeOut
              ? 'Your time-out and daily accomplishments will appear here after submission.'
              : 'Your submitted attendance records will appear here.'
          }
        />
      </Panel>
      {!isTimeOut && checkedIn && (
        <p className="muted-copy">You have already recorded a time-in for this session.</p>
      )}
    </div>
  );
}
