import { useMemo, useState } from 'react';
import { normalizeEmployeeStatus } from '../constants/employeeStatuses.js';
import { formatDate } from '../utils/formatters.js';

const PAGE_SIZE = 5;

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function displayChangeValue(key, value) {
  if (key === 'employeeStatus') return normalizeEmployeeStatus(value);
  if (Array.isArray(value)) return value.join(', ') || '—';
  return value || '—';
}

function EmployeeCell({ employee }) {
  return (
    <span className="employee-import-review-person">
      <span className="avatar-small">{getInitials(employee.name)}</span>
      <span>
        <strong>{employee.name}</strong>
        <small>{employee.careerLevel}</small>
      </span>
    </span>
  );
}

function EmployeeStatus({ status }) {
  const employeeStatus = normalizeEmployeeStatus(status);
  return (
    <span className={`employee-import-status is-${getStatusClass(employeeStatus)}`}>
      {employeeStatus}
    </span>
  );
}

function ReviewTable({ title, description, rows, columns, emptyMessage }) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const locations = useMemo(
    () => [...new Set(rows.map(({ employee }) => employee.workLocation).filter(Boolean))].sort(),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ employee, changedFields = [], field, previousValue, newValue }) => {
      const matchesLocation = !location || employee.workLocation === location;
      const changeText = changedFields
        .map(({ label, previousValue, newValue }) => `${label} ${previousValue} ${newValue}`)
        .join(' ');
      const matchesSearch =
        !query ||
        `${employee.name} ${employee.capability} ${employee.workLocation} ${employee.careerLevel} ${(employee.skills ?? []).join(' ')} ${field ?? ''} ${previousValue ?? ''} ${newValue ?? ''} ${changeText}`
          .toLowerCase()
          .includes(query);
      return matchesLocation && matchesSearch;
    });
  }, [location, rows, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers =
    pageCount <= 5
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : [
          1,
          ...(page > 3 ? ['left-ellipsis'] : []),
          ...Array.from(
            { length: Math.min(pageCount - 1, page + 1) - Math.max(2, page - 1) + 1 },
            (_, index) => Math.max(2, page - 1) + index,
          ),
          ...(page < pageCount - 2 ? ['right-ellipsis'] : []),
          pageCount,
        ];

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function updateLocation(value) {
    setLocation(value);
    setPage(1);
  }

  return (
    <section className="employee-import-review-card">
      <div className="employee-import-review-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="employee-import-review-count">{filteredRows.length} records</span>
      </div>
      <div className="employee-import-review-filters">
        <label className="employee-import-search">
          <span aria-hidden="true">⌕</span>
          <span className="visually-hidden">Search {title.toLowerCase()}</span>
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search name, capability, or skill"
          />
        </label>
        <label className="employee-import-location-filter">
          <span className="visually-hidden">Filter {title.toLowerCase()} by location</span>
          <select value={location} onChange={(event) => updateLocation(event.target.value)}>
            <option value="">All Locations</option>
            {locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-scroll employee-import-review-table">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="employee-import-review-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredRows.length > PAGE_SIZE && (
        <div className="employee-import-pagination" aria-label={`${title} pages`}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          {pageNumbers.map((pageNumber) =>
            typeof pageNumber === 'string' ? (
              <span className="employee-import-pagination-ellipsis" key={pageNumber}>
                …
              </span>
            ) : (
              <button
                type="button"
                className={`button button-secondary${pageNumber === page ? ' is-current' : ''}`}
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

export function EmployeeImportReviewPage({ review, onConfirm, onCancel, storageError = '' }) {
  const newEmployees = review.changesToApply
    .filter(({ type }) => type === 'new')
    .map((change, index) => ({ ...change, id: `new-${index}` }));
  const updatedEmployees = review.changesToApply
    .filter(({ type }) => type === 'updated')
    .map((change, index) => ({ ...change, id: `updated-${index}` }));
  const rolledOffEmployees = [
    ...review.changesToApply.filter(({ type }) => type === 'roll-off'),
    ...(review.rollOffEmployees ?? []),
  ].map((change, index) => ({ ...change, id: `roll-off-${index}` }));
  const unchangedEmployees = review.rows
    .filter(({ type }) => type === 'duplicate')
    .map((row, index) => ({ ...row, id: `unchanged-${index}` }));
  const hasChanges = review.changesToApply.length > 0;
  const personColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: ({ employee }) => <EmployeeCell employee={employee} />,
    },
    { key: 'capability', label: 'Capability', render: ({ employee }) => employee.capability },
    { key: 'location', label: 'Location', render: ({ employee }) => employee.workLocation },
    {
      key: 'joiningDate',
      label: 'Join Date',
      render: ({ employee }) => formatDate(employee.joiningDate),
    },
    {
      key: 'status',
      label: 'Initial Status',
      render: ({ employee }) => <EmployeeStatus status={employee.employeeStatus} />,
    },
  ];

  const updateColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: ({ employee }) => <EmployeeCell employee={employee} />,
    },
    { key: 'capability', label: 'Capability', render: ({ employee }) => employee.capability },
    { key: 'location', label: 'Location', render: ({ employee }) => employee.workLocation },
    {
      key: 'changes',
      label: 'Changes to apply',
      render: ({ changedFields }) => (
        <ul className="employee-import-change-list">
          {changedFields.map((field) => (
            <li key={field.key}>
              {field.label}: <span>{displayChangeValue(field.key, field.previousValue)}</span>
              {' → '}
              <strong>{displayChangeValue(field.key, field.newValue)}</strong>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  const rollOffColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: ({ employee }) => <EmployeeCell employee={employee} />,
    },
    { key: 'capability', label: 'Capability', render: ({ employee }) => employee.capability },
    { key: 'location', label: 'Location', render: ({ employee }) => employee.workLocation },
    {
      key: 'joiningDate',
      label: 'Join Date',
      render: ({ employee }) => formatDate(employee.joiningDate),
    },
    {
      key: 'previousStatus',
      label: 'Previous Status',
      render: ({ previousEmployee }) =>
        previousEmployee ? <EmployeeStatus status={previousEmployee.employeeStatus} /> : '—',
    },
    {
      key: 'importedStatus',
      label: 'Imported Status',
      render: ({ employee }) => <EmployeeStatus status={employee.employeeStatus} />,
    },
  ];
  const unchangedColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: ({ employee }) => <EmployeeCell employee={employee} />,
    },
    { key: 'employeeId', label: 'Employee ID', render: ({ employeeId }) => employeeId },
    { key: 'reviewResult', label: 'Review result', render: ({ field }) => field },
    {
      key: 'details',
      label: 'Details',
      render: ({ previousValue, newValue }) => (
        <>
          <span>{previousValue}</span>
          {' · '}
          <strong>{newValue}</strong>
        </>
      ),
    },
  ];

  return (
    <div className="page-stack employee-page employee-import-review-page">
      <section className="employee-import-review-banner">
        <div>
          <span>Employee Import</span>
          <h1>Review Import Changes</h1>
          <p>Review employee records and changes before confirming the import.</p>
        </div>
        <div className="employee-import-review-file">
          <span className="employee-import-review-file-icon" aria-hidden="true">
            {review.fileName.split('.').pop()?.toUpperCase()}
          </span>
          <div className="employee-import-review-file-details">
            <strong>Import employee details</strong>
            <small>{review.fileName}</small>
            <small>
              Uploaded on{' '}
              {new Intl.DateTimeFormat('en', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(review.uploadedAt)}
            </small>
          </div>
          <span aria-label={`${review.employees.length} imported records`}>
            {review.employees.length} records
          </span>
        </div>
      </section>

      <ReviewTable
        title="Newly Added"
        description="New employees start as Bench unless another activity type is included in the file."
        rows={newEmployees}
        columns={personColumns}
        emptyMessage="No new employees match this search or location."
      />
      {updatedEmployees.length > 0 && (
        <ReviewTable
          title="Updated Employees"
          description="Changed values and statuses will update the matching existing employee only."
          rows={updatedEmployees}
          columns={updateColumns}
          emptyMessage="No updated employees match this search or location."
        />
      )}
      <ReviewTable
        title="Rolled-Off Bench"
        description="Project employees will leave the Bench list."
        rows={rolledOffEmployees}
        columns={rollOffColumns}
        emptyMessage="No employees will be rolled off the bench."
      />
      {unchangedEmployees.length > 0 && (
        <ReviewTable
          title="Not Changed"
          description="Matching or repeated records are listed here and will not overwrite existing employee data."
          rows={unchangedEmployees}
          columns={unchangedColumns}
          emptyMessage="No matching or repeated records."
        />
      )}

      {storageError && (
        <p className="employee-import-review-error" role="alert">
          Unable to confirm the import: {storageError}
        </p>
      )}
      <div className="employee-import-review-actions">
        {!hasChanges && (
          <p className="employee-import-review-no-changes">
            There are no changes to apply. Cancel the import to return to Employees.
          </p>
        )}
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel Import
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={onConfirm}
          disabled={!hasChanges}
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}
