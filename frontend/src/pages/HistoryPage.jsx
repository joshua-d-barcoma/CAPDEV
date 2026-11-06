import { useMemo, useState } from 'react';
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
  const demoAttendanceRecords = useMemo(() => {
    if (!employee?.id) return [];

    const statuses = ['Present', 'Present', 'Present', 'Present', 'Exception', 'Absent'];
    const records = [];
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (records.length < 40) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const status = statuses[records.length % statuses.length];
        const exception = status === 'Exception';
        const absent = status === 'Absent';

        records.push({
          id: `demo-attendance-${date}`,
          employeeId: employee.id,
          date,
          timeIn: absent ? null : exception ? '9:22 AM' : records.length % 3 === 0 ? '8:47 AM' : '8:55 AM',
          timeOut: absent ? null : records.length % 4 === 0 ? '6:03 PM' : '5:35 PM',
          status,
          workType: records.length % 2 === 0 ? 'Onsite' : 'Work from home',
        });
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    return records;
  }, [employee?.id]);

  const personalRecords = useMemo(
    () => {
      const realRecords = attendanceRecords.filter((record) => record.employeeId === employee?.id);
      const realDates = new Set(realRecords.map((record) => record.date));
      const extraRecords = demoAttendanceRecords.filter((record) => !realDates.has(record.date));

      return [...realRecords, ...extraRecords]
        .sort((first, second) => second.date.localeCompare(first.date));
    },
    [attendanceRecords, demoAttendanceRecords, employee?.id],
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
  const availablePageCount = Math.max(1, Math.ceil(periodRecords.length / PAGE_SIZE));
  const displayedPageCount = 5;
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
  }

  return (
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
          icon="check"
          tone="green"
        />
        <StatCard
          label="On Leave"
          value={leaveDays}
          detail="Recorded leave days"
          icon="arrow-up-right"
          tone="blue"
        />
        <StatCard
          label="Absent Days"
          value={absentDays}
          detail="Attendance marked absent"
          icon="ex-mark"
          tone="red"
        />

        <StatCard
          label="Exception"
          value={exceptionDays}
          detail="Attendance requiring review"
          icon="alert"
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
          <nav className="history-page-buttons" aria-label="Attendance history pages">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ‹ Previous
            </button>

            {Array.from({ length: displayedPageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={pageNumber === page ? 'active' : ''}
                aria-current={pageNumber === page ? 'page' : undefined}
                disabled={pageNumber > availablePageCount}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= availablePageCount}
              onClick={() => setPage((current) => Math.min(availablePageCount, current + 1))}
            >
              Next ›
            </button>
          </nav>
        </div>
      </Panel>
    </div>
  );
}
