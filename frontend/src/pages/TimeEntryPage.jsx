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

  const {
    employees,
    checkedIn,
    submitAttendance,
    setCheckedIn,
  } = useBenchData();

  const alex = employees.find(
    (employee) => employee.name === 'Alex Santos',
  );

  const capabilities =
    alex && !standardCapabilities.includes(alex.capability)
      ? [...standardCapabilities, alex.capability]
      : standardCapabilities;

  // Form fields
  const [employeeId, setEmployeeId] = useState('');
  const [workType, setWorkType] = useState('');
  const [location, setLocation] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [otherWorkType, setOtherWorkType] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [capability, setCapability] = useState(
    alex?.capability ?? '',
  );

  const [acknowledged, setAcknowledged] =
    useState(false);

  const [trackerCompleted, setTrackerCompleted] =
    useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Current date
  const currentDate = new Date().toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    },
  );

  // Current time
  const currentTime = new Date().toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  function submit(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    // TIME OUT
    if (isTimeOut) {
      if (!checkedIn) {
        setError(
          'You need to record your time-in before submitting time-out.',
        );
        return;
      }

      if (setCheckedIn(false)) {
        setMessage(
          'Your time-out has been recorded. Have a great evening!',
        );
      }

      return;
    }

    // Already checked in
    if (checkedIn) {
      setError(
        'Your time-in is already recorded. Submit time-out before starting another entry.',
      );
      return;
    }

    // EID validation
    if (!employeeId.trim()) {
      setError('Please enter your EID.');
      return;
    }

    // General validation
    if (!alex || !capability || !workType) {
      setError(
        'Please complete all required fields.',
      );
      return;
    }

    // Onsite validation
    if (
      workType === 'Onsite' &&
      !location
    ) {
      setError(
        'Please select your office location.',
      );
      return;
    }

    if (
      workType === 'Onsite' &&
      location === 'Other' &&
      !otherLocation.trim()
    ) {
      setError(
        'Please enter your office location.',
      );
      return;
    }

    if (
      workType === 'Onsite' &&
      location !== 'Other' &&
      !seatNumber.trim()
    ) {
      setError(
        'Please enter your seat number.',
      );
      return;
    }

    // Other work setup
    if (
      workType === 'Other' &&
      !otherWorkType.trim()
    ) {
      setError(
        'Please describe your work setup.',
      );
      return;
    }

    // WFH / Leave tracker
    if (
      ['Work from home', 'Leave'].includes(workType) &&
      !trackerCompleted
    ) {
      setError(
        'Please confirm that your tracker has been completed.',
      );
      return;
    }

    if (!acknowledged) {
      setError(
        'Please acknowledge the attendance declaration.',
      );
      return;
    }

    const record = {
      employeeId: employeeId.trim(),

      date: new Date()
        .toISOString()
        .slice(0, 10),

      timeIn: new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),

      workType:
        workType === 'Other'
          ? otherWorkType
          : workType,

      location:
        workType !== 'Onsite'
          ? '—'
          : location === 'Other'
            ? otherLocation
            : location,

      remarks: remarks.trim(),

      status:
        workType === 'Leave'
          ? 'Vacation Leave'
          : 'Present',

      seatNumber:
        workType === 'Onsite'
          ? seatNumber
          : '',

      capability,
    };

    if (submitAttendance(record)) {
      setMessage(
        'Your time-in has been recorded successfully.',
      );
    }
  }

  return (

    <div className="page-stack">

   
      <PageHeader
      
        title={
          isTimeOut
            ? 'Time Out'
            : 'MY TIME IN & ATTENDANCE'
        }
        description={
          isTimeOut
            ? 'Complete your workday and record your time-out.'
            : 'Record your time-in and access the required attendance systems.'
        }
      />

      
      {message && (
        <div
          className="success-message"
          role="status"
        >
          {message}{' '}

          <Link to={ROUTES.userDashboard}>
            Return to dashboard
          </Link>
        </div>
      )}

   
      {error && (
        <div
          className="inline-error"
          role="alert"
        >
          {error}
        </div>
      )}




      <div className="attendance-page-grid">

   
        <Panel
          title={
            isTimeOut ? 'End-of-day check-out'  : 'Time-In Attendance Form' }
          eyebrow={ isTimeOut
              ? new Date().toLocaleDateString()
              : 'Record your time-in and access the required attendance systems.'
          }
        >
          <form
            className="form-grid attendance-form"
            onSubmit={submit}
          >

            {!isTimeOut && (
              <>
                <label className="field field-wide">
                  <span>
                    EID{' '}
                    <b aria-hidden="true">
                      *
                    </b>
                  </span>

                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(event) =>
                      setEmployeeId(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your EID"
                  />
                </label>


                <label className="field field-wide">
                  <span>Date</span>

                  <input
                    type="text"
                    value={currentDate}
                    readOnly
                  />
                </label>

                <label className="field field-wide">
                  <span>Time In</span>

                  <input
                    type="text"
                    value={currentTime}
                    readOnly
                  />
                </label>

                <label className="field field-wide">
                  <span>
                    Work Setup{' '}
                    <b aria-hidden="true">
                      *
                    </b>
                  </span>

                  <select
                    required
                    value={workType}
                    onChange={(event) => {
                      setWorkType(
                        event.target.value,
                      );

                      setLocation('');
                      setOtherLocation('');
                      setOtherWorkType('');
                      setSeatNumber('');
                      setTrackerCompleted(false);
                    }}
                  >
                    <option value="">
                      Select work setup
                    </option>

                    {workTypes.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}

                  </select>
                </label>

                {workType === 'Onsite' && (
                  <label className="field field-wide">
                    <span>
                      Location{' '}
                      <b aria-hidden="true">
                        *
                      </b>
                    </span>

                    <select
                      required
                      value={location}
                      onChange={(event) =>
                        setLocation(
                          event.target.value,
                        )
                      }
                    >
                      <option value="">
                        Select location
                      </option>

                      <option value="Mandaluyong, Robinsons Cybergate Tower 2">
                        Mandaluyong, Robinsons Cybergate Tower 2
                      </option>

                      <option value="Cebu IT Park, Cyberzone 2">
                        Cebu IT Park, Cyberzone 2
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>
                  </label>
                )}

                {workType === 'Onsite' &&
                  location === 'Other' && (

                    <label className="field field-wide">
                      <span>
                        Other Office Location{' '}
                        <b aria-hidden="true">
                          *
                        </b>
                      </span>

                      <input
                        required
                        type="text"
                        value={otherLocation}
                        onChange={(event) =>
                          setOtherLocation(
                            event.target.value,
                          )
                        }
                        placeholder="Enter office location"
                      />
                    </label>
                  )}

                {workType === 'Onsite' &&
                  location &&
                  location !== 'Other' && (

                    <label className="field field-wide">
                      <span>
                        Seat Number{' '}
                        <b aria-hidden="true">
                          *
                        </b>
                      </span>

                      <input
                        required
                        type="text"
                        value={seatNumber}
                        onChange={(event) =>
                          setSeatNumber(
                            event.target.value,
                          )
                        }
                        placeholder="e.g. CG2-05-18"
                      />
                    </label>
                  )}

                {workType === 'Other' && (

                  <label className="field field-wide">
                    <span>
                      Other Work Setup{' '}
                      <b aria-hidden="true">
                        *
                      </b>
                    </span>

                    <input
                      required
                      type="text"
                      value={otherWorkType}
                      onChange={(event) =>
                        setOtherWorkType(
                          event.target.value,
                        )
                      }
                      placeholder="Describe your work setup"
                    />
                  </label>
                )}

                <label className="field field-wide">
                  <span>Remarks</span>

                  <textarea
                    rows="3"
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
                  />
                </label>

                {[
                  'Work from home',
                  'Leave',
                ].includes(workType) && (

                  <label className="field field-wide checkbox-field">

                    <input
                      type="checkbox"
                      required
                      checked={
                        trackerCompleted
                      }
                      onChange={(event) =>
                        setTrackerCompleted(
                          event.target.checked,
                        )
                      }
                    />

                    <span>
                      I confirm that my{' '}
                      {workType === 'Leave'
                        ? 'leave'
                        : 'work-from-home'}{' '}
                      tracker has been
                      completed.
                    </span>

                  </label>
                )}

                <label className="field field-wide checkbox-field">

                  <input
                    type="checkbox"
                    required
                    checked={acknowledged}
                    onChange={(event) =>
                      setAcknowledged(
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    I confirm that the
                    information provided is
                    accurate and reflects my
                    work location for today.
                  </span>

                </label>

              </>
            )}

            {isTimeOut && (

              <label className="field field-wide">

                <span>
                  End-of-day notes
                </span>

                <textarea
                  rows="4"
                  placeholder="Share a brief summary of today's work."
                />

              </label>

            )}

            <div className="form-actions field-wide">

              <Link
                className="button button-secondary"
                to={ROUTES.userDashboard}
              >
                Cancel
              </Link>

              <button
                className="button button-primary"
                type="submit"
              >
                {isTimeOut
                  ? 'Submit time-out'
                  : 'Submit'}
              </button>

            </div>

          </form>




        </Panel>

<Panel>
                  
  <div className="attendance-card">

    <div className="card-title">
      <div className="title-icon">↗</div>
      <div>
        <h3>Attendance Links</h3>
        <p>Access the required links for your attendance.</p>
      </div>
    </div>



    <div className="attendance-link-box">

      <div className="link-icon">〽</div>

      <div className="link-info">
        <h3>Office Pulse</h3>
        <p>
          Go to pulse for the official time
          and attendance records.
        </p>
      </div>

      <a
        className="open-link"
        href="#"
      >
        ↗ Open Pulse
      </a>

    </div>


   
    <div className="attendance-link-box bmt-box">

      <div className="link-icon">♙</div>

      <div className="link-info">
        <h3>BMT</h3>
        <p>
          Go to BMT for additional
          attendance management.
        </p>
      </div>

      <a
        className="open-link"
        href="#"
      >
        ↗ Open BMT
      </a>

    </div>


    <div className="reminder-box">

      <h4>ⓘ Important Reminders</h4>

      <p>• Please submit your Time In before starting your work.</p>
      <p>• Your attendance will be routed to Pulse and BMT.</p>
      <p>• Contact your Bench Lead if you encounter issues.</p>

    </div>

  </div>

  </Panel> 

      </div>

      {!isTimeOut && checkedIn && (
        <p className="muted-copy">
          You have already recorded a
          time-in for this session.
        </p>
      )}

    </div>
  );
}