import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { EmployeeForm } from '../components/EmployeeForm.jsx';
import { Panel } from '../components/Panel.jsx';
import { SearchInput } from '../components/SearchInput.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { getEmployeeRoute } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { getBenchTenureCounts, getCareerLevelCounts } from '../utils/employeeInsights.js';
import { formatDate } from '../utils/formatters.js';

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useBenchData();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All locations');
  const [dialogEmployee, setDialogEmployee] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesSearch = `${employee.name} ${employee.capability} ${employee.skills.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch && (location === 'All locations' || employee.workLocation === location)
        );
      }),
    [employees, location, search],
  );
  const tenureBuckets = useMemo(() => getBenchTenureCounts(employees), [employees]);
  const careerLevels = useMemo(() => getCareerLevelCounts(employees), [employees]);
  const careerLevelColors = ['#d9c1e9', '#c79be0', '#b875dc', '#a900e8', '#8700c7', '#5c1680'];
  const careerLevelTotal = careerLevels.reduce((total, item) => total + item.count, 0);
  let careerLevelProgress = 0;
  const careerDonut = careerLevels
    .map((item, index) => {
      const start = careerLevelProgress;
      careerLevelProgress += careerLevelTotal ? (item.count / careerLevelTotal) * 100 : 0;
      return `${careerLevelColors[index]} ${start}% ${careerLevelProgress}%`;
    })
    .join(', ');

  function saveEmployee(values) {
    const saved = dialogEmployee ? updateEmployee(dialogEmployee.id, values) : addEmployee(values);
    if (saved) {
      setFormOpen(false);
      setDialogEmployee(null);
    }
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (employee) => (
        <Link className="employee-link" to={getEmployeeRoute(employee.name)}>
          <span className="avatar-small">
            {employee.name
              .split(' ')
              .map((part) => part[0])
              .join('')}
          </span>
          <span>
            <strong>{employee.name}</strong>
            <small>{employee.careerLevel}</small>
          </span>
        </Link>
      ),
    },
    { key: 'capability', label: 'Capability' },
    { key: 'workLocation', label: 'Location' },
    {
      key: 'skills',
      label: 'Key skills',
      render: (employee) => (
        <span className="skill-inline">{employee.skills.slice(0, 3).join(' · ')}</span>
      ),
    },
    {
      key: 'attendanceStatus',
      label: 'Attendance',
      render: (employee) => <StatusBadge status={employee.attendanceStatus} />,
    },
    {
      key: 'rollInDate',
      label: 'Roll-in date',
      render: (employee) => formatDate(employee.rollInDate),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (employee) => (
        <div className="row-actions">
          <button
            className="text-button"
            aria-label={`Edit ${employee.name}`}
            onClick={() => {
              setDialogEmployee(employee);
              setFormOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="text-button danger-text"
            aria-label={`Delete ${employee.name}`}
            onClick={() => setDeleteTarget(employee)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <section className="dashboard-banner employee-banner" aria-labelledby="employees-title">
        <div className="dashboard-banner-copy">
          <h1 id="employees-title">Employees</h1>
          <p>Monitor bench employees, attendance, skills, and deployment readiness.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="button button-light"
            onClick={() => {
              setDialogEmployee(null);
              setFormOpen(true);
            }}
          >
            ＋ Add employee
          </button>
        </div>
      </section>
      <div className="stat-grid">
        <StatCard
          label="Total Bench Employees"
          value={employees.length}
          detail="Active bench employees"
          icon="♙"
        />
        <StatCard
          label="Present Today"
          value={employees.filter((employee) => employee.attendanceStatus === 'Present').length}
          detail="Attendance records"
          tone="green"
          icon="✓"
        />
        <StatCard
          label="Active Non-Compliance"
          value={
            employees.filter((employee) => employee.attendanceStatus === 'Unapproved Absence')
              .length
          }
          detail="Requires follow-up"
          tone="orange"
          icon="!"
        />
        <StatCard
          label="Capabilities"
          value={new Set(employees.map((employee) => employee.capability)).size}
          detail="Across the bench"
          tone="blue"
          icon="◇"
        />
      </div>

      <div className="employee-insights-grid">
        <Panel title="Time in bench" eyebrow="Employee aging">
          <div className="tenure-grid">
            {tenureBuckets.map((bucket) => (
              <div className="tenure-card" key={bucket.label}>
                <strong>{bucket.count}</strong>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Career levels" eyebrow="CL mix">
          <div className="career-level-content">
            <div
              className={`career-level-donut${careerLevelTotal ? '' : ' is-empty'}`}
              role="img"
              aria-label={`${careerLevelTotal} employees across career levels`}
              style={{
                '--career-level-donut': careerLevelTotal
                  ? `conic-gradient(${careerDonut})`
                  : undefined,
              }}
            >
              <span>
                <strong>{careerLevelTotal}</strong>
                <small>employees</small>
              </span>
            </div>
            <ul className="career-level-legend" aria-label="Employee count by career level">
              {careerLevels.map((item, index) => (
                <li key={item.level}>
                  <span className="career-level-key">
                    <i style={{ backgroundColor: careerLevelColors[index] }} />
                    {item.level}
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Employee directory" eyebrow={`${filteredEmployees.length} resources`}>
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, capability, or skill"
            label="Search employees"
          />
          <label className="select-control">
            <span className="visually-hidden">Filter by location</span>
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              <option>All locations</option>
              <option>Manila</option>
              <option>Cebu</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={columns}
          rows={filteredEmployees}
          rowKey={(employee) => employee.id}
          emptyTitle="No employees found"
          emptyDescription="Adjust the search or location filter."
        />
      </Panel>

      {formOpen && (
        <EmployeeForm
          employee={dialogEmployee}
          onSubmit={saveEmployee}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete employee?"
          message={`Remove ${deleteTarget.name} and their attendance records from this demo workspace?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteEmployee(deleteTarget.id)) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
