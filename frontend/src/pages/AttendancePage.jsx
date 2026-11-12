import { useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable.jsx';
import { DateFilter } from '../components/DateFilter.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useBenchData } from '../hooks/useBenchData.js';
import { DEMO_ACCOUNTS } from '../utils/demoAccounts.js';
import { filterEmployees, getEmployeeFilterOptions } from '../utils/employeeInsights.js';
import { isDateInRange } from '../utils/dateFilters.js';
import { getEmployeeName } from '../utils/formatters.js';
import { formatAttendanceTime } from '../utils/timeEntry.js';

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
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (isoDate) return `${isoDate[1].slice(2)}-${isoDate[2]}-${isoDate[3]}`;
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat('en', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(parsedDate);
}

function getMinutesAfterMidnight(time) {
  const match = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(formatAttendanceTime(time));
  if (!match) return null;
  const [, hourText, minuteText, meridiem] = match;
  const hour = (Number(hourText) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + Number(minuteText);
}

function getRecordStatus(record) {
  if (/leave/i.test(`${record.status ?? ''} ${record.workType ?? ''}`)) return 'On Leave';
  const hasTimeIn = formatAttendanceTime(record.timeIn) !== '—';
  const time = getMinutesAfterMidnight(record.timeIn);
  if (
    hasTimeIn &&
    (/late|exception/i.test(record.status ?? '') || (time !== null && time > 9 * 60))
  ) {
    return 'Late';
  }
  if (hasTimeIn) return 'Present';
  if (/absence|absent|ncns|unapproved/i.test(record.status ?? '')) return 'Absent';
  return record.status || 'Present';
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
  const attendanceEmployees = useMemo(
    () => [
      ...employees,
      ...DEMO_ACCOUNTS.filter((account) => account.profile.attendanceEmployeeId).map((account) => ({
        id: account.profile.attendanceEmployeeId,
        name: account.name,
        capability: account.profile.capability,
        careerLevel: `CL${account.profile.level.replace(/^L/i, '')}`,
        skills: account.profile.skills
          ? account.profile.skills.split(',').map((skill) => skill.trim())
          : [],
        workLocation: account.profile.location,
        attendanceStatus: 'Present',
        absenceDays: 0,
      })),
    ],
    [employees],
  );
  const options = useMemo(
    () => getEmployeeFilterOptions(attendanceEmployees),
    [attendanceEmployees],
  );
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
        attendanceEmployees,
        {
          ...filters,
          attendance: '',
        },
        query,
      ),
    [attendanceEmployees, filters, query],
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
            (!filters.attendance ||
              (filters.attendance === 'Present'
                ? ['Present', 'Late'].includes(getRecordStatus(record))
                : filters.attendance === 'Unapproved Absence'
                  ? getRecordStatus(record) === 'Absent'
                  : filters.attendance === 'Vacation Leave'
                    ? getRecordStatus(record) === 'On Leave'
                    : true)),
        )
        .sort((first, second) => second.date.localeCompare(first.date)),
    [attendanceDate, attendanceEmployees, attendanceRecords, filters.attendance, scopedEmployeeIds],
  );
  const presentRecords = records.filter((record) =>
    ['Present', 'Late'].includes(getRecordStatus(record)),
  );
  const leaveRecords = records.filter((record) => getRecordStatus(record) === 'On Leave');
  const absenceRecords = records.filter((record) => getRecordStatus(record) === 'Absent');
  const lateRecords = records.filter((record) => getRecordStatus(record) === 'Late');
  const eligibleRecords = records.filter((record) => getRecordStatus(record) !== 'On Leave');
  const attendanceRate = eligibleRecords.length
    ? Math.round((presentRecords.length / eligibleRecords.length) * 100)
    : 0;
  const onsiteRecords = records.filter(
    (record) => getRecordStatus(record) !== 'On Leave' && record.workType === 'Onsite',
  );
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
      const employee = attendanceEmployees.find((entry) => entry.id === record.employeeId);
      const capability = record.capability || employee?.capability;
      if (!capability || getRecordStatus(record) === 'On Leave') return;
      const current = byCapability.get(capability) ?? { total: 0, present: 0 };
      current.total += 1;
      if (['Present', 'Late'].includes(getRecordStatus(record))) current.present += 1;
      byCapability.set(capability, current);
    });
    return [...byCapability.entries()]
      .map(([capability, counts]) => ({
        capability,
        present: counts.present,
        total: counts.total,
        rate: counts.total ? Math.round((counts.present / counts.total) * 100) : 0,
      }))
      .sort((first, second) => first.capability.localeCompare(second.capability));
  }, [attendanceEmployees, records]);
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
            {record.employeeName || getEmployeeName(record.employeeId, attendanceEmployees)}
          </strong>
        );
      },
    },
    {
      key: 'timeIn',
      label: 'Time In (PH)',
      render: (record) =>
        getRecordStatus(record) === 'On Leave' ? 'On Leave' : formatAttendanceTime(record.timeIn),
    },
    {
      key: 'timeOut',
      label: 'Time Out',
      render: (record) =>
        getRecordStatus(record) === 'On Leave' ? 'Not required' : formatAttendanceTime(record.timeOut),
    },
    {
      key: 'accomplishments',
      label: 'EOD',
      render: (record) =>
        record.accomplishments ?? record.eod ?? record.dailyAccomplishments ?? '—',
    },
    {
      key: 'workType',
      label: 'Work Type',
      render: (record) => record.workType ?? record.workMode ?? '—',
    },
    {
      key: 'location',
      label: 'Location',
      render: (record) => {
        if (record.location && record.location !== '—') return record.location;
        return /work from home|wfh/i.test(record.workType ?? record.workMode ?? '')
          ? 'Work from home'
          : '—';
      },
    },
    {
      key: 'seatNumber',
      label: 'Seat Number',
      render: (record) => record.seatNumber ?? record.seat_number ?? '—',
    },
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
      render: (record) => (
        <strong>
          {record.employeeName || getEmployeeName(record.employeeId, attendanceEmployees)}
        </strong>
      ),
    },
    {
      key: 'capability',
      label: 'Capability',
      render: (record) =>
        record.capability ||
        attendanceEmployees.find((employee) => employee.id === record.employeeId)?.capability ||
        '—',
    },
    {
      key: 'careerLevel',
      label: 'CL',
      render: (record) =>
        attendanceEmployees.find((employee) => employee.id === record.employeeId)?.careerLevel ||
        '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (record) => (
        <StatusBadge
          status={
            record.exceptionStatus === 'Late check-in' || getRecordStatus(record) === 'Late'
              ? 'Late check-in'
              : 'NCNS'
          }
        />
      ),
    },
    {
      key: 'infractions',
      label: 'Infractions MTD',
      render: (record) =>
        attendanceEmployees.find((employee) => employee.id === record.employeeId)?.absenceDays ||
        1,
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
              ? `${lateRecords[0].employeeName || getEmployeeName(lateRecords[0].employeeId, attendanceEmployees)} · Late Check-in`
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
              const employee = attendanceEmployees.find((entry) => entry.id === record.employeeId);
              const absenceDays = employee?.absenceDays ?? 1;
              return (
                <article className="attendance-alert-card" key={record.id}>
                  <div className="attendance-alert-person">
                    <strong>
                      {record.employeeName || getEmployeeName(record.employeeId, attendanceEmployees)}
                    </strong>
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
