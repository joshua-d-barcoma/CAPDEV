import { useMemo, useState } from 'react';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const historyPages = [
  [
    { iso: getLocalDateValue(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), timeIn: '8:38 AM', timeOut: '5:24 PM', hours: '8hrs 46m', status: 'Present' },
    { iso: '2026-10-12', date: 'Oct 12, 2026', timeIn: '8:42 AM', timeOut: '5:11 PM', hours: '8hrs 29m', status: 'Present' },
    { iso: '2026-10-11', date: 'Oct 11, 2026', timeIn: '9:42 AM', timeOut: '5:31 PM', hours: '8hrs', status: 'Present' },
    { iso: '2026-10-10', date: 'Oct 10, 2026', timeIn: 'On Leave', timeOut: 'Blocked', hours: '-', status: 'Absent' },
    { iso: '2026-10-09', date: 'Oct 09, 2026', timeIn: 'Unapproved', timeOut: 'Blocked', hours: '-', status: 'On Leave' },
    { iso: '2026-10-08', date: 'Oct 08, 2026', timeIn: '8:42 AM', timeOut: '5:31 PM', hours: '8hrs 49m', status: 'Present' },
    { iso: '2026-10-07', date: 'Oct 07, 2026', timeIn: '8:42 AM', timeOut: '5:31 PM', hours: '8hrs 49m', status: 'Present' },
  ],
  [
    { iso: '2026-10-06', date: 'Oct 06, 2026', timeIn: '8:40 AM', timeOut: '5:20 PM', hours: '8hrs 40m', status: 'Present' },
    { iso: '2026-10-05', date: 'Oct 05, 2026', timeIn: '9:01 AM', timeOut: '5:31 PM', hours: '8hrs 30m', status: 'Present' },
    { iso: '2026-10-04', date: 'Oct 04, 2026', timeIn: 'No Record', timeOut: 'Blocked', hours: '-', status: 'Absent' },
    { iso: '2026-10-03', date: 'Oct 03, 2026', timeIn: '8:55 AM', timeOut: '12:30 PM', hours: '3hrs 35m', status: 'On Leave' },
    { iso: '2026-10-02', date: 'Oct 02, 2026', timeIn: '8:32 AM', timeOut: '5:17 PM', hours: '8hrs 45m', status: 'Present' },
    { iso: '2026-10-01', date: 'Oct 01, 2026', timeIn: '8:45 AM', timeOut: '5:34 PM', hours: '8hrs 49m', status: 'Present' },
  ],
  [
    { iso: '2026-09-30', date: 'Sep 30, 2026', timeIn: '8:44 AM', timeOut: '5:30 PM', hours: '8hrs 46m', status: 'Present' },
    { iso: '2026-09-29', date: 'Sep 29, 2026', timeIn: '8:51 AM', timeOut: '5:29 PM', hours: '8hrs 38m', status: 'Present' },
    { iso: '2026-09-28', date: 'Sep 28, 2026', timeIn: '8:38 AM', timeOut: '5:22 PM', hours: '8hrs 44m', status: 'Present' },
    { iso: '2026-09-27', date: 'Sep 27, 2026', timeIn: 'No Record', timeOut: 'Blocked', hours: '-', status: 'Absent' },
    { iso: '2026-09-26', date: 'Sep 26, 2026', timeIn: 'No Record', timeOut: 'Blocked', hours: '-', status: 'Absent' },
    { iso: '2026-09-25', date: 'Sep 25, 2026', timeIn: '8:49 AM', timeOut: '5:31 PM', hours: '8hrs 42m', status: 'Present' },
  ],
];

function DateFilter({ value, onChange }) {
  return (
    <div className="history-month-control">
      <label className="history-month-picker">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
        <input
          type="date"
          value={value}
          aria-label="Filter attendance by date"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {value && (
        <button
          type="button"
          className="history-date-clear"
          onClick={() => onChange('')}
          aria-label="Clear attendance date filter"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue());

  const rows = useMemo(() => {
    if (selectedDate) {
      return historyPages.flat().filter((row) => row.iso === selectedDate);
import { DataTable } from '../components/DataTable.jsx';
import { DateFilter } from '../components/DateFilter.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { isDateInRange } from '../utils/dateFilters.js';
import { formatDate } from '../utils/formatters.js';
import './HistoryPage.css';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PAGE_SIZE = 8;

function isLeaveRecord(record) {
  return /leave/i.test(`${record.status ?? ''} ${record.workType ?? ''}`);
}

function getHistoryStatus(record) {
  if (isLeaveRecord(record)) return 'On Leave';
  if (/absence|absent/i.test(record.status ?? '')) return 'Absent';
  if (/exception|late/i.test(record.status ?? '')) return 'Exception';
  return record.status || 'Present';
}

function getMinutesAfterMidnight(time) {
  const match = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(time ?? '');
  if (!match) return null;
  const [, hourText, minuteText, meridiem] = match;
  const hour = (Number(hourText) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + Number(minuteText);
}

function formatHours(record) {
  if (record.hours) return record.hours;
  const start = getMinutesAfterMidnight(record.timeIn);
  const end = getMinutesAfterMidnight(record.timeOut);
  if (start === null || end === null || end < start) return '—';
  const minutes = end - start;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function getInitialRange(records) {
  const latestDate = records
    .map((record) => record.date)
    .sort()
    .at(-1);
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const month = latestDate?.slice(0, 7) ?? currentMonth;
  const [year, monthNumber] = month.split('-').map(Number);
  const start = `${month}-01`;
  const lastDay = String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0');
  const end = `${month}-${lastDay}`;
  return { start, end };
}

export default function HistoryPage() {
  const {
    employees,
    attendanceRecords,
    employeeSchedules,
    scheduleRequests,
    submitScheduleRequest,
  } = useBenchData();
  const employee = employees.find((item) => item.name === 'Alex Santos');
  const personalRecords = useMemo(
    () =>
      attendanceRecords
        .filter((record) => record.employeeId === employee?.id)
        .sort((first, second) => second.date.localeCompare(first.date)),
    [attendanceRecords, employee?.id],
  );
  const [period, setPeriod] = useState(() => getInitialRange(personalRecords));
  const [schedule, setSchedule] = useState(null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const currentSchedule = employee ? employeeSchedules[employee.id] : null;
  const periodRecords = personalRecords.filter(
    (record) => !period || isDateInRange(record.date, period),
  );
  const presentDays = periodRecords.filter(
    (record) => getHistoryStatus(record) === 'Present',
  ).length;
  const leaveDays = periodRecords.filter(
    (record) => getHistoryStatus(record) === 'On Leave',
  ).length;
  const absentDays = periodRecords.filter((record) => getHistoryStatus(record) === 'Absent').length;
  const exceptionDays = periodRecords.filter(
    (record) => getHistoryStatus(record) === 'Exception',
  ).length;
  const pageCount = Math.max(1, Math.ceil(periodRecords.length / PAGE_SIZE));
  const pageRows = periodRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const requests = scheduleRequests.filter((request) => request.employeeId === employee?.id);
  const columns = [
    { key: 'date', label: 'Date', render: (record) => formatDate(record.date) },
    {
      key: 'timeIn',
      label: 'Time In',
      render: (record) => (isLeaveRecord(record) ? 'On Leave' : (record.timeIn ?? '—')),
    },
    {
      key: 'timeOut',
      label: 'Time Out',
      render: (record) => (isLeaveRecord(record) ? 'Not required' : (record.timeOut ?? '—')),
    },
    { key: 'hours', label: 'Hours', render: formatHours },
    {
      key: 'status',
      label: 'Status',
      render: (record) => <StatusBadge status={getHistoryStatus(record)} />,
    },
  ];

  function submitRequest() {
    if (!employee) return;
    const pending = requests.some(
      (request) => request.kind === 'schedule' && request.status === 'Pending',
    );
    if (pending) {
      setNotice('You already have a schedule request waiting for review.');
      return;
    }
    const saved = submitScheduleRequest({
      employeeId: employee.id,
      employeeName: employee.name,
      schedule: { ...schedule },
    });
    if (saved) {
      setEditing(false);
      setNotice('Your schedule change request has been sent for review.');
    }
    return historyPages[page];
  }, [page, selectedDate]);

  return (
    <div className="history-page page-stack">
      <section className="dashboard-banner history-banner">
        <div>
          <h1>Time In / Time Out History</h1>
          <p>Review your previous attendance records and hours worked.</p>
        </div>
      </section>

      <div className="history-stats">
        <article><span className="history-stat-icon purple">◷</span><div><small>Present Days</small><strong>4</strong><em>Recorded this month</em></div></article>
        <article><span className="history-stat-icon green">○</span><div><small>On Leave</small><strong>1</strong><em>Recorded leave days</em></div></article>
        <article><span className="history-stat-icon pink">◇</span><div><small>Absent Days</small><strong>1</strong><em>Attendance records marked absent</em></div></article>
        <article><span className="history-stat-icon red">⊘</span><div><small>Exceptional</small><strong>1</strong><em>Attendance records marked absent</em></div></article>
      </div>

      <section className="history-schedule-panel">
        <div className="history-schedule-heading">
          <div><small>Return To Office</small><h2>My RTO Schedule</h2><p>Your current weekly schedule. Work from home is subject to approval.</p></div>
          <button type="button" className="history-change-button">Request Schedule Change</button>
        </div>
        <div className="history-week-grid">
          {weekdays.map((day) => (
            <div className="history-week-card" key={day}>
              <strong>{day}</strong>
              <span>Onsite</span>
            </div>
          ))}
        </div>
        <button type="button" className="history-week-button"><strong>4x onsite / week</strong><span>Schedule changes are sent to your admin for approval.</span></button>
      </section>

      <section className="history-table-panel">
        <div className="history-table-heading">
         
          <div><small>My Attendance</small><h2>Attendance History</h2><p>Time-in, time-out, and calculated hours for each recorded day.</p></div>
        <div className="history-table-toolbar">
          
          <DateFilter
            value={selectedDate}
            onChange={(value) => {
              setSelectedDate(value);
              setPage(0);
            }}
          />
          <span className="records"><b>{rows.length}</b> Records</span>
        </div>
        </div>
        
        <div className="history-table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time-In</th><th>Time-Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.date}-${index}`}>
                  <td>{row.date}</td><td>{row.timeIn}</td><td className={row.timeOut === 'Blocked' ? 'blocked-cell' : ''}>{row.timeOut}</td><td><strong>{row.hours}</strong></td>
                  <td><span className={`history-status ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="history-no-records">No attendance records found for the selected date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="history-table-footer">
          <span>Showing 1-{rows.length} of records</span>
          <div className="history-pagination" aria-label="Attendance pages">
            <button type="button" disabled={Boolean(selectedDate) || page === 0} onClick={() => setPage((current) => current - 1)} aria-label="Previous page">‹</button>
            {[0, 1, 2].map((number) => <button type="button" key={number} disabled={Boolean(selectedDate)} className={page === number ? 'active' : ''} onClick={() => setPage(number)}>{number + 1}</button>)}
            <button type="button" disabled={Boolean(selectedDate) || page === 2} onClick={() => setPage((current) => current + 1)} aria-label="Next page">›</button>
          </div>
        </div>
      </section>
    <div className="page-stack history-page">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Time In / Time Out History"
        description="Review your previous attendance records and hours worked."
      />

      <section className="stat-grid history-metrics" aria-label="Attendance summary">
        <StatCard
          label="Present Days"
          value={presentDays}
          detail="Recorded attendance"
          icon="✓"
          tone="purple"
        />
        <StatCard
          label="On Leave"
          value={leaveDays}
          detail="Recorded leave days"
          icon="↗"
          tone="green"
        />
        <StatCard
          label="Absent Days"
          value={absentDays}
          detail="Attendance marked absent"
          icon="!"
          tone="red"
        />
        <StatCard
          label="Exception"
          value={exceptionDays}
          detail="Attendance requiring review"
          icon="!"
          tone="orange"
        />
      </section>

      {notice && (
        <div className="success-message" role="status">
          {notice}
        </div>
      )}

      <Panel
        title="My RTO Schedule"
        eyebrow="Return To Office"
        className="history-schedule-panel"
        action={
          editing ? null : (
            <button
              className="button button-secondary"
              onClick={() => {
                setNotice('');
                setSchedule({ ...(currentSchedule ?? {}) });
                setEditing(true);
              }}
            >
              Request Schedule Change
            </button>
          )
        }
      >
        <p className="panel-description">Your current weekly onsite and work-from-home schedule.</p>
        <div className="schedule-list history-schedule-list">
          {weekdays.map((day) => (
            <div className="schedule-row history-schedule-day" key={day}>
              <strong>{day}</strong>
              {editing ? (
                <select
                  aria-label={`${day} work location`}
                  value={(schedule ?? currentSchedule)?.[day] ?? 'Onsite'}
                  onChange={(event) =>
                    setSchedule((current) => ({
                      ...(current ?? currentSchedule),
                      [day]: event.target.value,
                    }))
                  }
                >
                  <option>Onsite</option>
                  <option>Work from home</option>
                </select>
              ) : (
                <span className="history-schedule-location">
                  {(currentSchedule?.[day] ?? 'Onsite') === 'Work from home'
                    ? 'Work from home'
                    : 'Onsite'}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="history-schedule-footer">
          <span>
            {weekdays.filter((day) => currentSchedule?.[day] !== 'Work from home').length}x onsite /
            week
          </span>
          <small>Schedule changes are sent to your admin for approval.</small>
        </div>
        {editing && (
          <div className="form-actions">
            <button
              className="button button-secondary"
              onClick={() => {
                setSchedule(null);
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button className="button button-primary" onClick={submitRequest}>
              Submit for approval
            </button>
          </div>
        )}
        {requests.map((request) => (
          <div className="request-row" key={request.id}>
            <span>
              {request.kind === 'calendar'
                ? `${request.requestType ?? 'Calendar'} request`
                : 'Schedule request'}{' '}
              · {formatDate(request.submittedAt.slice(0, 10))}
            </span>
            <StatusBadge status={request.status} />
          </div>
        ))}
      </Panel>

      <Panel
        title="Attendance History"
        eyebrow="My Attendance"
        className="history-records-panel"
        action={
          <div className="history-table-controls">
            <DateFilter
              label="Select date period"
              value={period}
              onChange={(nextPeriod) => {
                setPeriod(nextPeriod);
                setPage(1);
              }}
              alignRight
            />
            <span className="history-record-count">{periodRecords.length} Records</span>
          </div>
        }
      >
        <p className="panel-description">
          Time-in, time-out, and calculated hours for each recorded day.
        </p>
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(record) => record.id}
          className="history-records-table"
          emptyTitle="No attendance history for this period"
          emptyDescription="Your time-in and time-out records will appear here."
        />
        <div className="history-pagination">
          <span>
            Showing {periodRecords.length ? (page - 1) * PAGE_SIZE + 1 : 0} to{' '}
            {Math.min(page * PAGE_SIZE, periodRecords.length)} of {periodRecords.length} records
          </span>
          <div>
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ‹
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
