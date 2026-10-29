import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { Panel } from '../components/Panel.jsx';
import { DEFAULT_EMPLOYEE_STATUS, normalizeEmployeeStatus } from '../constants/employeeStatuses.js';
import { getEmployeeImportHistoryEntryRoute, ROUTES } from '../constants/routes.js';
import { useBenchData } from '../hooks/useBenchData.js';
import { formatDate } from '../utils/formatters.js';

const PAGE_SIZE = 10;

function getImportId(entry, index) {
  return entry.id || `legacy-${entry.importedAt}-${index}`;
}

function formatImportedAt(importedAt) {
  const date = new Date(importedAt);
  return Number.isNaN(date.getTime())
    ? 'Unknown import date'
    : new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function displayValue(value) {
  if (Array.isArray(value)) return value.join(', ') || '—';
  return value === undefined || value === null || value === '' ? '—' : value;
}

function EmployeeStatus({ status }) {
  const value = normalizeEmployeeStatus(status || DEFAULT_EMPLOYEE_STATUS);
  const statusClass = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`employee-import-status is-${statusClass}`}>{value}</span>;
}

function ImportList({ imports, onDelete }) {
  return (
    <div className="employee-import-history-list">
      {imports.map((entry, index) => (
        <div className="employee-import-history-row" key={getImportId(entry, index)}>
          <Link
            className="employee-import-history-entry"
            to={getEmployeeImportHistoryEntryRoute(getImportId(entry, index))}
          >
            <span className="employee-import-history-entry-icon" aria-hidden="true">
              {entry.fileName?.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'CSV'}
            </span>
            <span className="employee-import-history-entry-copy">
              <strong>Import · {formatImportedAt(entry.importedAt)}</strong>
              <small>{entry.fileName || 'Employee import file'}</small>
            </span>
            <span className="employee-import-history-entry-count">{entry.count} records</span>
            <span className="employee-import-history-entry-arrow" aria-hidden="true">
              ›
            </span>
          </Link>
          <button
            className="employee-import-history-delete"
            type="button"
            aria-label={`Delete import from ${formatImportedAt(entry.importedAt)}`}
            onClick={() => onDelete({ ...entry, historyId: getImportId(entry, index) })}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.5 5.5h13M8 5.5v-2h4v2m3.5 0-.7 11H5.2l-.7-11m3.5 3v5m4-5v5" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function ImportDetails({ entry }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [entry]);
  const sourceHeaders = entry.sourceHeaders ?? [];
  const sourceRows = entry.sourceRows ?? [];
  const columns = sourceHeaders.length
    ? sourceHeaders.map((header, index) => ({
        key: `source-${index}`,
        label: header || `Column ${index + 1}`,
        render: (row) => displayValue(sourceRows[row.index]?.[index]),
      }))
    : [
        {
          key: 'name',
          label: 'EID',
          render: (employee) => displayValue(employee.name),
        },
        { key: 'email', label: 'Email', render: (employee) => displayValue(employee.email) },
        {
          key: 'capability',
          label: 'Capability',
          render: (employee) => displayValue(employee.capability),
        },
        {
          key: 'careerLevel',
          label: 'Level',
          render: (employee) => displayValue(employee.careerLevel),
        },
        {
          key: 'workLocation',
          label: 'Location',
          render: (employee) => displayValue(employee.workLocation),
        },
        {
          key: 'employeeStatus',
          label: 'Activity Type',
          render: (employee) => <EmployeeStatus status={employee.employeeStatus} />,
        },
        {
          key: 'skills',
          label: 'Primary Skill',
          render: (employee) => displayValue(employee.skills),
        },
        {
          key: 'attendanceStatus',
          label: 'Attendance',
          render: (employee) => displayValue(employee.attendanceStatus),
        },
        {
          key: 'absenceDays',
          label: 'Absence Days',
          render: (employee) => displayValue(employee.absenceDays),
        },
        {
          key: 'joiningDate',
          label: 'Join Date',
          render: (employee) => formatDate(employee.joiningDate),
        },
      ];
  const rows = sourceHeaders.length
    ? sourceRows.map((_, index) => ({ id: `source-row-${index}`, index }))
    : (entry.employees ?? []);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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

  return (
    <div className="page-stack employee-import-history-page">
      <PageHeader
        eyebrow="Employees · Import History"
        title={`Import · ${formatImportedAt(entry.importedAt)}`}
        description="Review the employee data captured from this import."
        actions={
          <Link className="button button-secondary" to={ROUTES.employeeImportHistory}>
            Back to History
          </Link>
        }
      />
      <Panel title={entry.fileName || 'Employee import file'} eyebrow="CSV or Excel import details">
        <div className="employee-import-history-summary">
          <span>{entry.count} records</span>
          {entry.changesApplied !== undefined && (
            <span>{entry.changesApplied} changes applied</span>
          )}
          <time dateTime={entry.importedAt}>{formatImportedAt(entry.importedAt)}</time>
        </div>
        {rows.length ? (
          <>
            <DataTable
              columns={columns}
              rows={pageRows}
              rowKey={(row) => row.id}
              emptyTitle="No employee records"
              emptyDescription="This import did not contain employee rows."
              className="employee-import-history-details-table"
            />
            {rows.length > PAGE_SIZE && (
              <div className="employee-import-pagination" aria-label="Import record pages">
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
          </>
        ) : (
          <EmptyState
            title="Employee details are unavailable"
            description="This history entry was created before imported employee details were saved."
          />
        )}
      </Panel>
    </div>
  );
}

export default function EmployeeImportHistoryPage() {
  const {
    employeeImportHistory = [],
    deleteEmployeeImportHistoryEntry,
    storageError,
  } = useBenchData();
  const { importId } = useParams();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const imports = employeeImportHistory;
  const selectedEntry = imports.find((entry, index) => getImportId(entry, index) === importId);

  if (importId) {
    if (!selectedEntry) {
      return (
        <div className="page-stack employee-import-history-page">
          <PageHeader
            eyebrow="Employees · Import History"
            title="Import not found"
            description="This employee import record is no longer available."
            actions={
              <Link className="button button-secondary" to={ROUTES.employeeImportHistory}>
                Back to History
              </Link>
            }
          />
        </div>
      );
    }
    return <ImportDetails entry={selectedEntry} />;
  }

  return (
    <div className="page-stack employee-import-history-page">
      <PageHeader
        eyebrow="Employees"
        title="Import History"
        description="Open an import to review the employee details captured from its uploaded file."
        actions={
          <Link className="button button-secondary" to={ROUTES.employees}>
            Back to Employees
          </Link>
        }
      />
      <Panel title="Imported files" eyebrow="Employee import records">
        {imports.length > 0 ? (
          <ImportList imports={imports} onDelete={setDeleteTarget} />
        ) : (
          <EmptyState
            title="No imports yet"
            description="Confirmed employee file imports will appear here."
          />
        )}
        {storageError && (
          <p className="employee-import-review-error" role="alert">
            Unable to update import history: {storageError}
          </p>
        )}
      </Panel>
      {deleteTarget && (
        <ConfirmDialog
          title="Delete import history?"
          message={`Delete the import record from ${formatImportedAt(deleteTarget.importedAt)}? This does not change employee records.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteEmployeeImportHistoryEntry(deleteTarget.historyId)) {
              setDeleteTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
