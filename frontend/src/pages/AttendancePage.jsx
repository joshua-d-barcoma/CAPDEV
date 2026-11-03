import { useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { DateFilter } from '../components/DateFilter.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { filterEmployees, getEmployeeFilterOptions } from '../utils/employeeInsights.js';
import { isDateInRange } from '../utils/dateFilters.js';
import { getEmployeeName } from '../utils/formatters.js';

const iconPaths = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path d="m8 12 2.5 2.5L16 9" stroke="#fff" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path d="M12 7v6m0 4h.01" stroke="#fff" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v6h5M9 13h7m-7 4h7" />
    </>
  ),
  bars: (
    <>
      <rect x="4" y="12" width="3" height="8" rx="1" fill="currentColor" stroke="none" />
      <rect x="9" y="5" width="3" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="9" width="3" height="11" rx="1" fill="currentColor" stroke="none" />
      <rect x="19" y="3" width="2" height="17" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
};

function AttendanceIcon({ name, className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function FilterSelect({ label, value, onChange, children, icon, className = '' }) {
  return (
    <label className={`attendance-filter${icon ? ' has-icon' : ''} ${className}`.trim()}>
      {icon && <AttendanceIcon name={icon} />}
      <span className="visually-hidden">{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function formatCompactDate(date) {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${year.slice(2)}-${month}-${day}`;
}

function getMinutesAfterMidnight(time) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time ?? '');
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

function getLatestAttendanceRange(records) {
  const dates = records.map((record) => record.date).sort();
  const latestDate = dates[dates.length - 1];
  return latestDate ? { start: latestDate, end: latestDate } : null;
}

function MetricCard({ label, value, detail, note, icon, tone }) {
  return (
    <article className={`attendance-metric-card ${tone}`}>
      <div className="attendance-metric-heading">
        <span className="attendance-metric-icon">
          <AttendanceIcon name={icon} />
        </span>
        <span>{label}</span>
      </div>
      <strong className="attendance-metric-value">{value}</strong>
      <span className="attendance-metric-detail">{detail}</span>
      {note && <span className="attendance-metric-note">{note}</span>}
    </article>
  );
}

export default function AttendancePage() {
  const { employees, attendanceRecords } = useBenchData();
  const options = useMemo(() => getEmployeeFilterOptions(employees), [employees]);
  const [query, setQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() =>
    getLatestAttendanceRange(attendanceRecords),
  );
  const [filters, setFilters] = useState({
    capability: '',
    careerLevel: '',
    skill: '',
    attendance: '',
    location: '',
    joiningDate: null,
    rollInDate: null,
  });
  const scopedEmployees = useMemo(
    () =>
      filterEmployees(
        employees,
        {
          ...filters,
          attendance: '',
        },
        query,
      ),
    [employees, filters, query],
  );
  const scopedEmployeeIds = useMemo(
    () => new Set(scopedEmployees.map((employee) => employee.id)),
    [scopedEmployees],
  );
  const records = useMemo(
    () =>
      attendanceRecords
        .filter(
          (record) =>
            scopedEmployeeIds.has(record.employeeId) &&
            (!attendanceDate || isDateInRange(record.date, attendanceDate)) &&
            (!filters.attendance || record.status === filters.attendance),
        )
        .sort((first, second) => second.date.localeCompare(first.date)),
    [attendanceDate, attendanceRecords, filters.attendance, scopedEmployeeIds],
  );
  const presentRecords = records.filter((record) => record.status === 'Present');
  const leaveRecords = records.filter((record) => record.status === 'Vacation Leave');
  const absenceRecords = records.filter((record) => record.status === 'Unapproved Absence');
  const lateRecords = records.filter((record) => {
    const time = getMinutesAfterMidnight(record.timeIn);
    return record.status === 'Present' && time !== null && time > 9 * 60;
  });
  const eligibleRecords = records.filter((record) => record.status !== 'Vacation Leave');
  const attendanceRate = eligibleRecords.length
    ? Math.round((presentRecords.length / eligibleRecords.length) * 100)
    : 0;
  const onsiteRecords = presentRecords.filter((record) => record.workType === 'Onsite');
  const rtoRate = presentRecords.length
    ? Math.round((onsiteRecords.length / presentRecords.length) * 100)
    : 0;
  const exceptions = [
    ...absenceRecords.map((record) => ({ ...record, exceptionStatus: 'Unapproved absence' })),
    ...lateRecords.map((record) => ({ ...record, exceptionStatus: 'Late check-in' })),
  ];
  const compliance = useMemo(() => {
    const byCapability = new Map();
    records.forEach((record) => {
      const employee = employees.find((entry) => entry.id === record.employeeId);
      if (!employee?.capability || record.status === 'Vacation Leave') return;
      const current = byCapability.get(employee.capability) ?? { total: 0, present: 0 };
      current.total += 1;
      if (record.status === 'Present') current.present += 1;
      byCapability.set(employee.capability, current);
    });
    return [...byCapability.entries()]
      .map(([capability, counts]) => ({
        capability,
        present: counts.present,
        total: counts.total,
        rate: counts.total ? Math.round((counts.present / counts.total) * 100) : 0,
      }))
      .sort((first, second) => first.capability.localeCompare(second.capability));
  }, [employees, records]);
  const resetFilters = () => {
    setQuery('');
    setAttendanceDate(getLatestAttendanceRange(attendanceRecords));
    setFilters({
      capability: '',
      careerLevel: '',
      skill: '',
      attendance: '',
      location: '',
      joiningDate: null,
      rollInDate: null,
    });
  };

  const getRecordStatus = (record) => {
    if (record.status === 'Vacation Leave') return 'On Leave';
    if (record.status === 'Unapproved Absence') return 'Absent';
    if (lateRecords.some((entry) => entry.id === record.id)) return 'Late';
    return 'Present';
  };
  const getRecordTone = (record) =>
    `attendance-row-${getRecordStatus(record).toLowerCase().replace(' ', '-')}`;
  const columns = [
    { key: 'date', label: 'Date', render: (record) => formatCompactDate(record.date) },
    {
      key: 'employee',
      label: 'Employee',
      render: (record) => {
        const status = getRecordStatus(record);
        return (
          <strong
            className={`attendance-employee-name is-${status.toLowerCase().replace(' ', '-')}`}
          >
            {getEmployeeName(record.employeeId, employees)}
          </strong>
        );
      },
    },
    {
      key: 'timeIn',
      label: 'Time In',
      render: (record) => (record.status === 'Vacation Leave' ? 'On Leave' : record.timeIn),
    },
    {
      key: 'timeOut',
      label: 'Time Out',
      render: (record) =>
        record.status === 'Vacation Leave' ? 'Blocked' : (record.timeOut ?? '—'),
    },
    { key: 'hours', label: 'Hours', render: formatHours },
    {
      key: 'status',
      label: 'Status',
      render: (record) => <StatusBadge status={getRecordStatus(record)} />,
    },
  ];
  const exceptionColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (record) => <strong>{getEmployeeName(record.employeeId, employees)}</strong>,
    },
    {
      key: 'capability',
      label: 'Capability',
      render: (record) =>
        employees.find((employee) => employee.id === record.employeeId)?.capability || '—',
    },
    {
      key: 'careerLevel',
      label: 'CL',
      render: (record) =>
        employees.find((employee) => employee.id === record.employeeId)?.careerLevel || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (record) => (
        <StatusBadge
          status={record.exceptionStatus === 'Late check-in' ? 'Late check-in' : 'NCNS'}
        />
      ),
    },
    {
      key: 'infractions',
      label: 'Infractions MTD',
      render: (record) =>
        employees.find((employee) => employee.id === record.employeeId)?.absenceDays || 1,
    },
    {
      key: 'nextStep',
      label: 'Next Step',
      render: (record) =>
        record.exceptionStatus === 'Late check-in'
          ? 'Review attendance pattern'
          : 'Confirm leave or exception status',
    },
  ];

  return (
    <div className="page-stack attendance-page">
      <section className="attendance-hero-banner">
        <div className="attendance-heading-copy">
          <h1>ATTENDANCE MANAGEMENT</h1>
          <p>Monitor today’s attendance, time-in records, and compliance.</p>
        </div>
        <div className="attendance-banner-filters">
          <FilterSelect
            label="Filter by location"
            value={filters.location}
            onChange={(value) => setFilters((current) => ({ ...current, location: value }))}
          >
            <option value="">All Locations</option>
            {options.locations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Filter by capability"
            value={filters.capability}
            onChange={(value) => setFilters((current) => ({ ...current, capability: value }))}
          >
            <option value="">All Capabilities</option>
            {options.capabilities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
        </div>
      </section>

      <section className="attendance-metrics-grid" aria-label="Attendance summary">
        <MetricCard
          label="Today’s Attendance"
          value={`${attendanceRate}%`}
          detail={`${presentRecords.length} of ${eligibleRecords.length} present`}
          note={`${presentRecords.length} Present`}
          icon="check"
          tone="purple"
        />
        <MetricCard
          label="Overall RTO Compliance"
          value={`${rtoRate}%`}
          detail="Guidance: Mon–Thu onsite · Fri WFH"
          note="CG2 Primary Site"
          icon="bars"
          tone="violet"
        />
        <MetricCard
          label="Exceptions"
          value={exceptions.length}
          detail="Attendance records needing review"
          note={exceptions.length ? `${exceptions.length} requiring review` : ''}
          icon="alert"
          tone="red"
        />
        <MetricCard
          label="Absences"
          value={absenceRecords.length}
          detail="Expected onsite but not present"
          note={absenceRecords.length ? `${absenceRecords.length} Unexcused` : ''}
          icon="alert"
          tone="red"
        />
        <MetricCard
          label="Tardiness Count"
          value={lateRecords.length}
          detail="Present after 9:00 AM"
          note={
            lateRecords.length
              ? `${getEmployeeName(lateRecords[0].employeeId, employees)} · Late Check-in`
              : ''
          }
          icon="alert"
          tone="orange"
        />
        <MetricCard
          label="Active Non-Compliance"
          value={absenceRecords.length}
          detail="Active cases requiring follow-up"
          note="Requires review"
          icon="alert"
          tone="pink"
        />
      </section>

      <Panel
        eyebrow="RTO Compliance"
        title="Compliance by Capability"
        action={<span className="attendance-guidance-pill">CG2 Primary Reporting Site</span>}
        className="attendance-compliance-panel"
      >
        <p className="panel-description">Guidance: Mon–Thu onsite, Friday work from home.</p>
        {compliance.length ? (
          <div className="attendance-compliance-list">
            {compliance.map((item, index) => (
              <div
                className={`attendance-compliance-row tone-${index % 4} chart-data-tooltip`}
                data-chart-tooltip={`${item.capability}: ${item.present} of ${item.total} attendance records present (${item.rate}%)`}
                title={`${item.capability}: ${item.present} of ${item.total} attendance records present (${item.rate}%)`}
                key={item.capability}
              >
                <span>{item.capability}</span>
                <div className="attendance-compliance-track">
                  <i style={{ width: `${item.rate}%` }} />
                </div>
                <strong>{item.rate}%</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="attendance-empty-note">
            No capability data is available for these filters.
          </p>
        )}
      </Panel>

      <Panel
        title="Unapproved Absences"
        eyebrow="Attendance Alert"
        className="attendance-alert-panel"
      >
        <p className="panel-description">
          Employees with attendance records requiring admin review.
        </p>
        {absenceRecords.length ? (
          <div className="attendance-alert-list">
            {absenceRecords.map((record) => {
              const employee = employees.find((entry) => entry.id === record.employeeId);
              const absenceDays = employee?.absenceDays ?? 1;
              return (
                <article className="attendance-alert-card" key={record.id}>
                  <div className="attendance-alert-person">
                    <strong>{getEmployeeName(record.employeeId, employees)}</strong>
                    <span>Attendance requires review</span>
                  </div>
                  <span className="attendance-absence-days">
                    <strong>{absenceDays}</strong>{' '}
                    {absenceDays === 1 ? 'day absent' : 'days absent'}
                  </span>
                  <span className="attendance-alert-message">
                    {absenceDays >= 3 && <AttendanceIcon name="alert" />}
                    {absenceDays >= 3
                      ? `${absenceDays} or more days absent. May require action.`
                      : 'Unapproved absence requires review.'}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="attendance-empty-note">No unapproved absences for the selected filters.</p>
        )}
      </Panel>

      <Panel
        title="Attendance Records"
        eyebrow="Daily Attendance"
        action={
          <button className="button button-primary attendance-export" type="button">
            <AttendanceIcon name="file" />
            Export Report
          </button>
        }
        className="attendance-records-panel"
      >
        <p className="panel-description">
          Filter employee attendance by date, range, and employee details.
        </p>
        <div className="attendance-record-filters">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search employees..."
            label="Search attendance"
          />
          <div className="attendance-record-filter-row">
            <DateFilter
              label="Attendance date"
              value={attendanceDate}
              onChange={setAttendanceDate}
            />
            <FilterSelect
              label="Filter by career level"
              value={filters.careerLevel}
              onChange={(value) => setFilters((current) => ({ ...current, careerLevel: value }))}
            >
              <option value="">All Career Levels</option>
              {options.careerLevels.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Filter by skill"
              value={filters.skill}
              onChange={(value) => setFilters((current) => ({ ...current, skill: value }))}
            >
              <option value="">All Skills</option>
              {options.skills.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Filter by attendance status"
              value={filters.attendance}
              onChange={(value) => setFilters((current) => ({ ...current, attendance: value }))}
            >
              <option value="">All Attendance</option>
              <option value="Present">Present</option>
              <option value="Unapproved Absence">Absent</option>
              <option value="Vacation Leave">On Leave</option>
            </FilterSelect>
            <DateFilter
              label="Roll-in date"
              value={filters.rollInDate}
              onChange={(value) => setFilters((current) => ({ ...current, rollInDate: value }))}
            />
            <DateFilter
              label="Join date"
              value={filters.joiningDate}
              onChange={(value) => setFilters((current) => ({ ...current, joiningDate: value }))}
            />
            <button
              type="button"
              className="button button-reset attendance-reset-button"
              onClick={resetFilters}
            >
              Reset all
            </button>
          </div>
        </div>
        <p className="attendance-filter-note">
          Employee, capability and date filters apply to all metrics, exceptions and records.
        </p>
        <DataTable
          columns={columns}
          rows={records}
          rowKey={(record) => record.id}
          emptyTitle="No attendance records"
          emptyDescription="There are no records matching these filters."
          className="attendance-records-table"
          rowClassName={getRecordTone}
        />
        <div className="attendance-record-summary">
          <AttendanceIcon name="info" />
          <span>
            Showing {records.length} of {scopedEmployees.length} employee records · Displayed rows:{' '}
            {presentRecords.length} present
            {lateRecords.length ? ` (including ${lateRecords.length} late)` : ''},{' '}
            {leaveRecords.length} on leave, {absenceRecords.length} absent.
          </span>
        </div>
      </Panel>

      <Panel
        title="Exceptions to Follow Up"
        eyebrow="Follow-up Required"
        action={<span className="attendance-count-pill">{exceptions.length}</span>}
        className="attendance-exceptions-panel"
      >
        <p className="panel-description">
          Attendance and RTO exceptions for bench resources that need review.
        </p>
        <DataTable
          columns={exceptionColumns}
          rows={exceptions}
          rowKey={(record) => record.id}
          emptyTitle="No exceptions to follow up"
          emptyDescription="There are no attendance exceptions for the selected filters."
          className="attendance-exceptions-table"
        />
      </Panel>
    </div>
  );
}
