import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { useBenchData } from '../hooks/useBenchData.js';

function monthLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

export default function CalendarPage() {
  const { employees, attendanceRecords, submitScheduleRequest } = useBenchData();
  const alex = employees.find((employee) => employee.name === 'Alex Santos');
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [requestType, setRequestType] = useState('Leave');
  const [message, setMessage] = useState('');
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, (_, index) => ({ id: `empty-${index}`, day: null })),
      ...Array.from({ length: daysInMonth }, (_, index) => ({
        id: `${year}-${monthIndex}-${index + 1}`,
        day: index + 1,
      })),
    ];
  }, [month]);
  const visibleMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const attendanceByDay = new Set(
    attendanceRecords
      .filter((record) => record.employeeId === alex?.id && record.date.startsWith(visibleMonth))
      .map((record) => Number(record.date.slice(8, 10))),
  );

  function changeMonth(amount) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    setSelectedDate('');
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!selectedDate || !alex) {
      setMessage('Select a date on the calendar before submitting a request.');
      return;
    }
    const dayString = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    if (
      submitScheduleRequest({
        employeeId: alex.id,
        employeeName: alex.name,
        requestType,
        date: dayString,
      })
    ) {
      setMessage(
        `${requestType} request submitted for ${new Date(`${dayString}T00:00:00`).toLocaleDateString()}.`,
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personal Workspace"
        title="My Calendar"
        description="View attendance days and submit a request for planned leave or schedule changes."
      />
      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}
      <div className="two-column-grid calendar-layout">
        <Panel className="calendar-panel">
          <div className="calendar-controls">
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>
            <h2>{monthLabel(month)}</h2>
            <button className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}>
              ›
            </button>
          </div>
          <div className="calendar-grid calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.day}
                className={`calendar-day${item.day === selectedDate ? ' selected' : ''}${item.day && attendanceByDay.has(item.day) ? ' has-attendance' : ''}`}
                aria-label={
                  item.day
                    ? new Date(month.getFullYear(), month.getMonth(), item.day).toLocaleDateString()
                    : undefined
                }
                aria-pressed={item.day === selectedDate}
                onClick={() => item.day && setSelectedDate(item.day)}
              >
                {item.day}
                {item.day && attendanceByDay.has(item.day) && (
                  <i aria-label="Attendance recorded" />
                )}
              </button>
            ))}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="legend-dot" /> Attendance recorded
            </span>
            <span>
              <i className="legend-dot selected-dot" /> Selected date
            </span>
          </div>
        </Panel>
        <Panel title="Request time away" eyebrow="Calendar request">
          <form className="stacked-form" onSubmit={submitRequest}>
            <p className="panel-description">
              {selectedDate
                ? `Selected ${new Date(month.getFullYear(), month.getMonth(), selectedDate).toLocaleDateString()}`
                : 'Choose a date from the calendar first.'}
            </p>
            <label className="field">
              <span>Request type</span>
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                <option>Leave</option>
                <option>Work from home</option>
                <option>Attendance correction</option>
              </select>
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea rows="4" placeholder="Add context for your request." />
            </label>
            <button className="button button-primary" type="submit">
              Submit request
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
