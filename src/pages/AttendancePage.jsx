import { useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
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
  const records = useMemo(
    () =>
      attendanceRecords.filter((record) => {
        const name = getEmployeeName(record.employeeId, employees);
        return (
          `${name} ${record.workType} ${record.location}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (statusFilter === 'All statuses' || record.status === statusFilter)
        );
      }),
    [attendanceRecords, employees, query, statusFilter],
  );
  const present = attendanceRecords.filter((record) => record.status === 'Present').length;
  const exceptions = attendanceRecords.filter(
    (record) => record.status === 'Unapproved Absence',
  ).length;
  const late = attendanceRecords.filter(
    (record) => record.timeIn !== '—' && record.timeIn > '09:00 AM',
  ).length;

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
      <PageHeader
        eyebrow="Attendance Management"
        title="Attendance"
        description="Monitor employee attendance and time-in records."
      />
      <div className="stat-grid stat-grid-five">
        <StatCard label="Total Bench" value={employees.length} detail="Active resources" icon="♙" />
        <StatCard
          label="Present Today"
          value={present}
          detail={
            employees.length
              ? `${Math.round((present / employees.length) * 100)}% attendance`
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
      <Panel title="Attendance records" eyebrow="Daily register">
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
