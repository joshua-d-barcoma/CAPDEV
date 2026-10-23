import { useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { EmployeeScopeFilters } from '../components/EmployeeScopeFilters.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { filterEmployees } from '../utils/employeeInsights.js';
import { formatDate } from '../utils/formatters.js';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function HistoryPage() {
  const {
    employees,
    attendanceRecords,
    employeeSchedules,
    scheduleRequests,
    submitScheduleRequest,
  } = useBenchData();
  const alex = employees.find((employee) => employee.name === 'Alex Santos');
  const [schedule, setSchedule] = useState(null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [scopeFilters, setScopeFilters] = useState({ location: '', capability: '' });
  const currentSchedule = alex ? employeeSchedules[alex.id] : null;
  const scopedEmployee = alex ? filterEmployees([alex], scopeFilters)[0] : null;
  const personalHistory = attendanceRecords.filter(
    (record) => record.employeeId === scopedEmployee?.id,
  );
  const columns = [
    { key: 'date', label: 'Date', render: (record) => formatDate(record.date) },
    { key: 'timeIn', label: 'Time in' },
    { key: 'workType', label: 'Work type' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: (record) => <StatusBadge status={record.status} /> },
  ];

  function submitRequest() {
    if (!alex) return;
    const pending = scheduleRequests.some(
      (request) =>
        request.employeeId === alex.id &&
        request.kind === 'schedule' &&
        request.status === 'Pending',
    );
    if (pending) {
      setNotice('You already have a schedule request waiting for review.');
      return;
    }
    const saved = submitScheduleRequest({
      employeeId: alex.id,
      employeeName: alex.name,
      schedule: { ...schedule },
    });
    if (saved) {
      setEditing(false);
      setNotice('Your schedule change request has been sent for review.');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Personal Workspace"
        title="Attendance History"
        description="Review your attendance records and team schedule."
      />
      {notice && (
        <div className="success-message" role="status">
          {notice}
        </div>
      )}
      <EmployeeScopeFilters
        employees={employees}
        location={scopeFilters.location}
        capability={scopeFilters.capability}
        onChange={(name, value) => setScopeFilters((current) => ({ ...current, [name]: value }))}
      />
      <Panel title="My attendance" eyebrow="Recent records">
        <DataTable
          columns={columns}
          rows={personalHistory}
          rowKey={(record) => record.id}
          emptyTitle="No attendance history yet"
          emptyDescription="Your time-in records will appear here."
        />
      </Panel>
      <Panel title="Regular team schedule" eyebrow="Return to office">
        <p className="panel-description">
          Current guidance: onsite Monday–Thursday; Friday work from home.
        </p>
        <div className="schedule-list">
          {weekdays.map((day) => (
            <div className="schedule-row" key={day}>
              <strong>{day}</strong>
              {editing ? (
                <select
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
                <StatusBadge status={currentSchedule?.[day] ?? 'Onsite'} />
              )}
            </div>
          ))}
        </div>
        <div className="form-actions">
          {editing ? (
            <>
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
            </>
          ) : (
            <button
              className="button button-secondary"
              onClick={() => {
                setSchedule({ ...(currentSchedule ?? {}) });
                setEditing(true);
              }}
            >
              Request schedule change
            </button>
          )}
        </div>
        {scheduleRequests
          .filter((request) => request.employeeId === alex?.id)
          .map((request) => (
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
    </div>
  );
}
