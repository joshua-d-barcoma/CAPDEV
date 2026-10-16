import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';

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

export default function TimeEntryPage() {
  const isTimeOut = useLocation().pathname.endsWith('time-out');
  const { employees, checkedIn, submitAttendance, setCheckedIn } = useBenchData();
  const alex = employees.find((employee) => employee.name === 'Alex Santos');
  const capabilities =
    alex && !standardCapabilities.includes(alex.capability)
      ? [...standardCapabilities, alex.capability]
      : standardCapabilities;
  const [workType, setWorkType] = useState('Onsite');
  const [location, setLocation] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [otherWorkType, setOtherWorkType] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [capability, setCapability] = useState(alex?.capability ?? '');
  const [acknowledged, setAcknowledged] = useState(false);
  const [trackerCompleted, setTrackerCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError('');
    if (isTimeOut) {
      if (!checkedIn) {
        setError('You need to record your time-in before submitting time-out.');
        return;
      }
      if (setCheckedIn(false)) setMessage('Your time-out has been recorded. Have a great evening!');
      return;
    }
    if (checkedIn) {
      setError('Your time-in is already recorded. Submit time-out before starting another entry.');
      return;
    }
    if (!alex || !capability || !acknowledged || (workType === 'Onsite' && !location)) {
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
      date: new Date().toISOString().slice(0, 10),
      timeIn: new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(
        new Date(),
      ),
      workType: workType === 'Other' ? otherWorkType : workType,
      location: workType !== 'Onsite' ? '—' : location === 'Other' ? otherLocation : location,
      status: workType === 'Leave' ? 'Vacation Leave' : 'Present',
      seatNumber: workType === 'Onsite' ? seatNumber : '',
    };
    if (submitAttendance(record)) setMessage('Your time-in has been recorded successfully.');
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personal Workspace"
        title={isTimeOut ? 'Time Out' : 'Time In'}
        description={
          isTimeOut
            ? 'Complete your workday and record your time-out.'
            : 'Record your work location and attendance for today.'
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
      <Panel
        title={isTimeOut ? 'End-of-day check-out' : 'Daily attendance declaration'}
        eyebrow={new Date().toLocaleDateString()}
      >
        <form className="form-grid attendance-form" onSubmit={submit}>
          <label className="field">
            <span>Employee</span>
            <input value={alex?.name ?? 'Alex Santos'} readOnly />
          </label>
          <label className="field">
            <span>
              Employee ID <b aria-hidden="true">*</b>
            </span>
            <input required placeholder="Enter your employee ID" />
          </label>
          {!isTimeOut && (
            <>
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
                  Work type <b aria-hidden="true">*</b>
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
                  <option value="">Select work type</option>
                  {workTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              {workType === 'Onsite' && (
                <>
                  <label className="field">
                    <span>
                      Office location <b aria-hidden="true">*</b>
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
                  {location === 'Other' && (
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
                  )}
                  {location && location !== 'Other' && (
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
                  )}
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
                  I confirm that the information provided is accurate and reflects my work location
                  for today.
                </span>
              </label>
            </>
          )}
          {isTimeOut && (
            <label className="field field-wide">
              <span>End-of-day notes</span>
              <textarea rows="4" placeholder="Share a brief summary of today's work." />
            </label>
          )}
          <div className="form-actions field-wide">
            <Link className="button button-secondary" to={ROUTES.userDashboard}>
              Cancel
            </Link>
            <button className="button button-primary" type="submit">
              {isTimeOut ? 'Submit time-out' : 'Submit time-in'}
            </button>
          </div>
        </form>
      </Panel>
      {!isTimeOut && checkedIn && (
        <p className="muted-copy">You have already recorded a time-in for this session.</p>
      )}
    </div>
  );
}
