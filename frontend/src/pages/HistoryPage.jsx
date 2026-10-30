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
    </div>
  );
}
