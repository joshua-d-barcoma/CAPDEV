import { useMemo, useState } from 'react';
import { Dialog } from '../components/Dialog.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { getEmployeeLeaveBalances } from '../services/benchDataService.js';
import './CalendarPage.css';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_SCHEDULE = {
  Monday: 'Onsite',
  Tuesday: 'Onsite',
  Wednesday: 'Onsite',
  Thursday: 'Onsite',
  Friday: 'Work from home',
};

function monthLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calendarRequestType(request) {
  const requestType = request?.requestType?.toLowerCase();
  if (['leave', 'sick leave', 'vacation leave'].includes(requestType)) return 'leave';
  if (requestType === 'work from home') return 'remote';
  return null;
}

function getDayStatus(date, attendance, request, schedule) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  if (isWeekend) return { type: 'weekend', label: 'Weekend', source: 'Weekend · Non-working day' };

  if (request && calendarRequestType(request)) {
    return {
      type: calendarRequestType(request),
      label: request.requestType,
      source:
        calendarRequestType(request) === 'leave'
          ? 'Leave · No check-in required'
          : request.status === 'Approved'
            ? 'Approved request'
            : 'Request pending review',
      request,
    };
  }

  if (attendance) {
    const status = attendance.status?.toLowerCase() ?? '';
    const workType = attendance.workType?.toLowerCase() ?? '';
    if (status.includes('absence') || status.includes('late') || status.includes('exception')) {
      return { type: 'exception', label: 'Exception', source: attendance.status, attendance };
    }
    if (workType === 'leave' || status.includes('leave')) {
      return { type: 'leave', label: 'Leave', source: attendance.status, attendance };
    }
    if (workType === 'work from home') {
      return { type: 'remote', label: 'Work from home', source: 'Attendance recorded', attendance };
    }
    if (workType === 'onsite') {
      return { type: 'onsite', label: 'Onsite', source: 'Attendance recorded', attendance };
    }
  }

  const plannedWorkType =
    schedule[WEEKDAYS[date.getDay()]] ?? DEFAULT_SCHEDULE[WEEKDAYS[date.getDay()]];
  return plannedWorkType === 'Work from home'
    ? { type: 'remote', label: 'Work from home', source: 'Scheduled' }
    : { type: 'onsite', label: 'Onsite', source: 'Scheduled' };
}

function CalendarMetricIcon({ type }) {
  if (type === 'onsite') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V8l8-4 8 4v12M2 20h20M9 20v-6h6v6M8 9h.01M12 9h.01M16 9h.01" />
      </svg>
    );
  }
  if (type === 'remote') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="12" rx="1.5" />
        <path d="M2 20h20M9 17l-1 3m7-3 1 3" />
      </svg>
    );
  }
  if (type === 'leave') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M3 12h12m-4-4 4 4-4 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5m0 3h.01" />
    </svg>
  );
}

export default function CalendarPage() {
  const {
    employees,
    attendanceRecords,
    employeeSchedules,
    scheduleRequests,
    submitScheduleRequest,
  } = useBenchData();
  const employee = employees.find((item) => item.name === 'Alex Santos');
  const schedule = employee
    ? (employeeSchedules[employee.id] ?? DEFAULT_SCHEDULE)
    : DEFAULT_SCHEDULE;
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(today));
  const [requestType, setRequestType] = useState('Vacation leave');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestError, setRequestError] = useState('');
  const employeeAttendance = useMemo(
    () => attendanceRecords.filter((record) => record.employeeId === employee?.id),
    [attendanceRecords, employee?.id],
  );
  const employeeRequests = useMemo(
    () =>
      scheduleRequests.filter(
        (request) => request.employeeId === employee?.id && request.kind === 'calendar',
      ),
    [employee?.id, scheduleRequests],
  );
  const leaveBalances = getEmployeeLeaveBalances(
    employee?.id,
    employeeAttendance,
    employeeRequests,
  );
  const attendanceByDate = useMemo(
    () => new Map(employeeAttendance.map((record) => [record.date, record])),
    [employeeAttendance],
  );
  const requestByDate = useMemo(() => {
    const requests = [...employeeRequests].sort((a, b) =>
      a.status === 'Approved' ? -1 : b.status === 'Approved' ? 1 : 0,
    );
    return new Map(requests.map((request) => [request.date, request]));
  }, [employeeRequests]);
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dayCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: dayCount }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= daysInMonth
        ? { id: `${year}-${monthIndex}-${day}`, day }
        : { id: `empty-${index}`, day: null };
    });
  }, [month]);
  const monthStatuses = useMemo(() => {
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const key = dateKey(date);
      return getDayStatus(date, attendanceByDate.get(key), requestByDate.get(key), schedule);
    });
  }, [attendanceByDate, month, requestByDate, schedule]);
  const metrics = {
    onsite: monthStatuses.filter((status) => status.type === 'onsite').length,
    remote: monthStatuses.filter((status) => status.type === 'remote').length,
    leave: monthStatuses.filter((status) => status.type === 'leave').length,
    exception: monthStatuses.filter((status) => status.type === 'exception').length,
  };
  const selectedDateObject = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const selectedStatus = selectedDateObject
    ? getDayStatus(
        selectedDateObject,
        attendanceByDate.get(selectedDate),
        requestByDate.get(selectedDate),
        schedule,
      )
    : null;
  const selectedAttendance = selectedStatus?.attendance;
  const weekStart = selectedDateObject
    ? new Date(
        selectedDateObject.getFullYear(),
        selectedDateObject.getMonth(),
        selectedDateObject.getDate() - ((selectedDateObject.getDay() + 6) % 7),
      )
    : today;
  const selectedWeek = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + index,
    );
    const key = dateKey(date);
    return {
      status: getDayStatus(date, attendanceByDate.get(key), requestByDate.get(key), schedule),
      plannedWorkType:
        schedule[WEEKDAYS[date.getDay()]] ?? DEFAULT_SCHEDULE[WEEKDAYS[date.getDay()]],
    };
  });
  const requiredOnsiteDays = selectedWeek.filter(
    ({ status, plannedWorkType }) =>
      plannedWorkType === 'Onsite' &&
      !(status.type === 'leave' && (status.request?.status === 'Approved' || status.attendance)),
  ).length;
  const completedOnsiteDays = selectedWeek.filter(
    ({ status }) => status.type === 'onsite' && status.source === 'Attendance recorded',
  ).length;
  const rtoCompliance = requiredOnsiteDays
    ? Math.round((completedOnsiteDays / requiredOnsiteDays) * 100)
    : 0;

  function changeMonth(amount) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth));
  }

  function goToToday() {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(dateKey(today));
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!selectedDate || !employee) {
      setRequestError('Select a date on the calendar before submitting a request.');
      return;
    }
    if ([0, 6].includes(new Date(`${selectedDate}T00:00:00`).getDay())) {
      setRequestError('Weekends are non-working days; no attendance or leave request is needed.');
      return;
    }
    const leaveBalance = leaveBalances[requestType];
    if (leaveBalance && leaveBalance.remaining === 0) {
      setRequestError(`No ${requestType} balance remains.`);
      return;
    }
    if (leaveBalance) {
      const alreadyRequested = employeeRequests.some(
        (request) =>
          request.date === selectedDate &&
          request.status !== 'Rejected' &&
          request.requestType?.toLowerCase() === requestType.toLowerCase(),
      );
      const alreadyRecorded = employeeAttendance.some(
        (record) =>
          record.date === selectedDate &&
          [record.status, record.workType].some(
            (value) => value?.toLowerCase() === requestType.toLowerCase(),
          ),
      );
      if (alreadyRequested || alreadyRecorded) {
        setRequestError(`A ${requestType} request already exists for this date.`);
        return;
      }
    }
    if (
      submitScheduleRequest({
        employeeId: employee.id,
        employeeName: employee.name,
        requestType,
        date: selectedDate,
        notes: notes.trim(),
      })
    ) {
      setMessage(
        leaveBalance
          ? `${requestType} recorded for ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}. No check-in or time-out is required.`
          : `${requestType} request submitted for ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}.`,
      );
      setIsRequestOpen(false);
      setNotes('');
      setRequestError('');
    }
  }

  return (
    <div className="page-stack calendar-page">
      <PageHeader
        className="calendar-page-header"
        eyebrow="Personal Workspace"
        title="Calendar"
        description="Review your onsite, remote, leave, and attendance exception days."
      />
      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}
      <section className="calendar-metrics" aria-label="Monthly schedule summary">
        {[
          ['onsite', 'Onsite', metrics.onsite, 'Recorded or scheduled'],
          ['remote', 'Work from Home', metrics.remote, 'Remote work days'],
          ['leave', 'Leave', metrics.leave, 'Approved or recorded leave'],
          ['exception', 'Exceptions', metrics.exception, 'Attendance requiring review'],
        ].map(([type, label, value, detail]) => (
          <article className={`calendar-metric calendar-metric-${type}`} key={type}>
            <div className="calendar-metric-heading">
              <span className="calendar-metric-icon">
                <CalendarMetricIcon type={type} />
              </span>
              <span>{label}</span>
              <span className="calendar-metric-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <section className="calendar-leave-balances" aria-labelledby="calendar-leave-balances-title">
        <div className="calendar-leave-balances-heading">
          <h2 id="calendar-leave-balances-title">Leave balances</h2>
          <p>Annual leave credits available to use. Pending requests are reserved.</p>
        </div>
        <div className="calendar-leave-balance-grid">
          {Object.entries(leaveBalances).map(([type, balance]) => (
            <article className="calendar-metric calendar-metric-leave" key={type}>
              <div className="calendar-metric-heading">
                <span className="calendar-metric-icon">
                  <CalendarMetricIcon type="leave" />
                </span>
                <span>{type}</span>
              </div>
              <strong>{balance.remaining} days</strong>
              <small>
                {balance.used} used of {balance.entitlement}
                {balance.pending ? ` · ${balance.pending} pending` : ''}
              </small>
            </article>
          ))}
        </div>
      </section>
      <div className="calendar-dashboard-grid">
        <Panel className="calendar-panel">
          <div className="calendar-controls">
            <div>
              <span className="calendar-panel-eyebrow">MONTH VIEW</span>
              <h2>{monthLabel(month)}</h2>
            </div>
            <div className="calendar-month-actions">
              <button
                type="button"
                className="icon-button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="button button-secondary calendar-today-button"
                onClick={goToToday}
              >
                Today
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                ›
              </button>
            </div>
          </div>
          <div className="calendar-grid calendar-weekdays">
            {WEEKDAY_LABELS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid calendar-month-grid">
            {calendarDays.map((item) => {
              const date = item.day
                ? new Date(month.getFullYear(), month.getMonth(), item.day)
                : null;
              const key = date ? dateKey(date) : '';
              const status = date
                ? getDayStatus(date, attendanceByDate.get(key), requestByDate.get(key), schedule)
                : null;
              const isSelected = key === selectedDate;
              const isToday = key === dateKey(today);

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.day}
                  className={`calendar-day${isSelected ? ' selected' : ''}${isToday ? ' calendar-day-today' : ''}${status ? ` calendar-day-${status.type}` : ''}`}
                  aria-label={date ? `${date.toLocaleDateString()}: ${status.label}` : undefined}
                  aria-pressed={isSelected}
                  onClick={() => date && setSelectedDate(key)}
                >
                  {item.day && (
                    <>
                      <span className="calendar-day-number">{item.day}</span>
                      {status && (
                        <span className={`calendar-day-badge calendar-badge-${status.type}`}>
                          {status.label}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            {[
              ['onsite', 'Onsite'],
              ['remote', 'Work from Home'],
              ['leave', 'Leave'],
              ['exception', 'No attendance record / exception'],
              ['weekend', 'Weekend'],
            ].map(([type, label]) => (
              <span key={type}>
                <i className={`legend-dot legend-${type}`} />
                {label}
              </span>
            ))}
          </div>
          <p className="calendar-data-note">
            Calendar days show scheduled work types or saved attendance and request records.
          </p>
        </Panel>
        <div className="calendar-side-panels">
          <Panel className="calendar-selected-panel">
            <span className="calendar-panel-eyebrow">SELECTED DAY</span>
            <h2>
              {selectedDateObject
                ? new Intl.DateTimeFormat('en', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(selectedDateObject)
                : 'No date selected'}
            </h2>
            {selectedStatus && (
              <>
                <span className={`calendar-status-pill calendar-status-${selectedStatus.type}`}>
                  {selectedStatus.label}
                </span>
                <div className="calendar-day-information">
                  <strong>
                    {selectedAttendance?.timeIn && selectedAttendance.timeIn !== '—'
                      ? `Checked in at ${selectedAttendance.location || 'work location'} · ${selectedAttendance.timeIn}`
                      : selectedStatus.source}
                  </strong>
                  {selectedStatus.type === 'onsite' ? (
                    <p>
                      Onsite Monday–Thursday; Friday work from home, subject to your team’s current
                      policy.
                    </p>
                  ) : selectedStatus.type === 'remote' ? (
                    <p>
                      Remote work is scheduled for this day. Follow your team’s attendance and
                      availability policy.
                    </p>
                  ) : selectedStatus.type === 'leave' ? (
                    <p>{selectedStatus.label} · No check-in or time-out is required.</p>
                  ) : selectedStatus.type === 'exception' ? (
                    <p>Attendance needs review. Contact your admin for help with this record.</p>
                  ) : (
                    <p>This is a non-working weekend day.</p>
                  )}
                </div>
              </>
            )}
            <button
              type="button"
              className="button button-primary calendar-request-trigger"
              disabled={selectedStatus?.type === 'weekend'}
              onClick={() => {
                setRequestError('');
                setIsRequestOpen(true);
              }}
            >
              {selectedStatus?.type === 'weekend'
                ? 'Weekend · No attendance required'
                : '+ Request leave / work from home'}
            </button>
          </Panel>
          <Panel className="calendar-rto-panel">
            <div className="calendar-rto-heading">
              <div>
                <span className="calendar-panel-eyebrow">SELECTED WEEK</span>
                <h2>RTO Compliance</h2>
              </div>
              <span className={`calendar-rto-status${rtoCompliance === 100 ? ' on-track' : ''}`}>
                {rtoCompliance === 100 ? 'On track' : 'In progress'}
              </span>
            </div>
            <div className="calendar-rto-content">
              <div
                className="calendar-rto-ring"
                style={{ '--rto-progress': `${rtoCompliance}%` }}
                role="img"
                aria-label={`${rtoCompliance}% RTO compliance`}
              >
                <strong>{rtoCompliance}%</strong>
              </div>
              <div className="calendar-rto-copy">
                <strong>
                  Onsite {completedOnsiteDays} of {requiredOnsiteDays} required days
                </strong>
                <small>Based on recorded attendance for this week.</small>
                <small>Company policy</small>
                <small>Onsite Mon–Thu · Work from Home Fri</small>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      {isRequestOpen && (
        <Dialog
          title="Request Time Away"
          description="Sick and vacation leave are recorded immediately. Work-from-home requests are sent for review."
          className="calendar-request-dialog"
          onClose={() => {
            setIsRequestOpen(false);
            setRequestError('');
          }}
        >
          <form className="stacked-form" onSubmit={submitRequest}>
            <div className="calendar-request-date">
              <span>Selected date</span>
              <strong>
                {selectedDateObject
                  ? selectedDateObject.toLocaleDateString()
                  : 'Choose a date on the calendar'}
              </strong>
            </div>
            {requestError && (
              <p className="calendar-request-error" role="alert">
                {requestError}
              </p>
            )}
            <label className="field">
              <span>Request type</span>
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                <option value="Vacation leave">
                  Vacation leave ({leaveBalances['Vacation leave'].remaining} available)
                </option>
                <option value="Sick leave">
                  Sick leave ({leaveBalances['Sick leave'].remaining} available)
                </option>
                <option>Work from home</option>
              </select>
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea
                rows="4"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add context for your request."
              />
            </label>
            <button className="button button-primary" type="submit">
              Submit request
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
