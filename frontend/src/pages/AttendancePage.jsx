import { useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { EmployeeScopeFilters } from '../components/EmployeeScopeFilters.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { filterEmployees } from '../utils/employeeInsights.js';
import { getEmployeeName } from '../utils/formatters.js';

const compliance = [
  { capability: 'Hybrid Cloud', rate: 88 },
  { capability: 'Cloud Customer Edge', rate: 92 },
  { capability: 'Network', rate: 76 },
  { capability: 'Service Management', rate: 84 },
];

export default function AttendancePage() {
  const { employees, attendanceRecords } = useBenchData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [scopeFilters, setScopeFilters] = useState({ location: '', capability: '' });
  const scopedEmployees = useMemo(
    () => filterEmployees(employees, scopeFilters),
    [employees, scopeFilters],
  );
  const scopedEmployeeIds = useMemo(
    () => new Set(scopedEmployees.map((employee) => employee.id)),
    [scopedEmployees],
  );
  const scopedAttendanceRecords = useMemo(
    () =>
      attendanceRecords.filter(
        (record) =>
          (!scopeFilters.location && !scopeFilters.capability) ||
          scopedEmployeeIds.has(record.employeeId),
      ),
    [attendanceRecords, scopeFilters, scopedEmployeeIds],
  );
  const records = useMemo(
    () =>
      scopedAttendanceRecords.filter((record) => {
        const name = getEmployeeName(record.employeeId, employees);
        return (
          `${name} ${record.workType} ${record.location}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (statusFilter === 'All statuses' || record.status === statusFilter)
        );
      }),
    [employees, query, scopedAttendanceRecords, statusFilter],
  );
  const present = scopedAttendanceRecords.filter((record) => record.status === 'Present').length;
  const exceptions = scopedAttendanceRecords.filter(
    (record) => record.status === 'Unapproved Absence',
  ).length;
  const late = scopedAttendanceRecords.filter(
    (record) => record.timeIn !== '—' && record.timeIn > '09:00 AM',
  ).length;

  const handleExport = () => {
    if (records.length === 0) return;

    const csvRows = [
      ['Employee', 'Date', 'Time In', 'Work Type', 'Location', 'Status'],
      ...records.map((record) => [
        getEmployeeName(record.employeeId, employees),
        record.date,
        record.timeIn,
        record.workType,
        record.location,
        record.status,
      ]),
    ];
    // Quote every field and double embedded quotes so commas and quotes remain valid CSV.
    const csvContent = csvRows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const date = new Date();
    const dateStamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    downloadLink.href = downloadUrl;
    downloadLink.download = `attendance-report-${dateStamp}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (record) => <strong>{getEmployeeName(record.employeeId, employees)}</strong>,
    },
    { key: 'date', label: 'Date' },
    { key: 'timeIn', label: 'Time in' },
    { key: 'workType', label: 'Work type' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: (record) => <StatusBadge status={record.status} /> },
  ];

  return (
    <div className="page-stack">
      <section
        className="dashboard-banner employee-scope-banner"
        aria-labelledby="attendance-title"
      >
        <div className="employee-scope-banner-heading">
          <div className="dashboard-banner-copy">
            <h1 id="attendance-title">Attendance</h1>
            <p>
              Monitor employee attendance, time-in records, compliance, and follow-up exceptions.
            </p>
          </div>
        </div>
        <div className="employee-scope-banner-controls">
          <EmployeeScopeFilters
            employees={employees}
            location={scopeFilters.location}
            capability={scopeFilters.capability}
            onChange={(name, value) =>
              setScopeFilters((current) => ({ ...current, [name]: value }))
            }
          />
        </div>
      </section>
      <div className="stat-grid stat-grid-five">
        <StatCard
          label="Total Bench"
          value={scopedEmployees.length}
          detail="Active resources"
          icon="♙"
        />
        <StatCard
          label="Present Today"
          value={present}
          detail={
            scopedEmployees.length
              ? `${Math.round((present / scopedEmployees.length) * 100)}% attendance`
              : 'No employees'
          }
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Tardiness Count"
          value={late}
          detail="Present after 9:00 AM"
          tone="orange"
          icon="◷"
        />
        <StatCard
          label="Non-Compliance"
          value={exceptions}
          detail="Active cases"
          tone="red"
          icon="!"
        />
        <StatCard
          label="RTO Compliance"
          value="85%"
          detail="Onsite schedule compliance"
          tone="blue"
          icon="↗"
        />
      </div>
      <Panel
        eyebrow="Attendance & RTO"
        title="RTO Compliance by Capability"
        className="compliance-panel"
      >
        <p className="panel-description">
          Current guidance: onsite Monday–Thursday; Friday work from home.
        </p>
        <div className="bar-list">
          {compliance.map((item) => (
            <div className="bar-row" key={item.capability}>
              <span>{item.capability}</span>
              <div className="bar-track">
                <i style={{ width: `${item.rate}%` }} />
              </div>
              <strong>{item.rate}%</strong>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Attendance records"
        eyebrow="Daily register"
        action={
          <button
            className="button button-secondary"
            type="button"
            onClick={handleExport}
            disabled={records.length === 0}
          >
            Export Report
          </button>
        }
      >
        <div className="table-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search employee or location"
            label="Search attendance"
          />
          <label className="select-control">
            <span className="visually-hidden">Filter by attendance status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All statuses</option>
              <option>Present</option>
              <option>Unapproved Absence</option>
              <option>Vacation Leave</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={columns}
          rows={records}
          rowKey={(record) => record.id}
          emptyTitle="No attendance records"
          emptyDescription="There are no records matching these filters."
        />
      </Panel>
    </div>
  );
}
