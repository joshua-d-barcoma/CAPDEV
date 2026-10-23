import { useMemo, useRef, useState } from 'react';
import { Dialog } from './Dialog.jsx';
import { parseEmployeeCsv, parseEmployeeExcel } from '../utils/employeeCsv.js';
import { reviewEmployeeImport } from '../utils/employeeImportReview.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function EmployeeImportDialog({
  onReview,
  onClose,
  storageError = '',
  existingEmployees = [],
}) {
  const fileInput = useRef(null);
  const [fileName, setFileName] = useState('');
  const [employees, setEmployees] = useState([]);
  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [sourceRows, setSourceRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [readingFile, setReadingFile] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const [uploadedAt, setUploadedAt] = useState(null);

  const review = useMemo(
    () => reviewEmployeeImport(employees, existingEmployees),
    [employees, existingEmployees],
  );

  async function loadFile(file) {
    if (!file) return;

    setFileName(file.name);
    setEmployees([]);
    setSourceHeaders([]);
    setSourceRows([]);
    setErrors([]);
    setUploadedAt(null);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(fileExtension)) {
      setErrors(['Choose a CSV or Excel workbook (.csv or .xlsx).']);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors(['This file is larger than the 10 MB maximum. Choose a smaller file.']);
      return;
    }

    setReadingFile(true);
    try {
      const result =
        fileExtension === 'csv'
          ? parseEmployeeCsv(await file.text())
          : await parseEmployeeExcel(await file.arrayBuffer());
      setEmployees(result.employees);
      setSourceHeaders(result.sourceHeaders ?? []);
      setSourceRows(result.sourceRows ?? []);
      setErrors(result.errors);
      if (result.employees.length > 0 && result.errors.length === 0) setUploadedAt(new Date());
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unable to read this employee file.']);
    } finally {
      setReadingFile(false);
    }
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    void loadFile(file);
  }

  function submit(event) {
    event.preventDefault();
    if (!uploadedAt || errors.length > 0 || readingFile) return;
    onReview({
      fileName,
      uploadedAt,
      employees: review.employees,
      sourceHeaders,
      sourceRows,
      changesToApply: review.changesToApply,
      rollOffEmployees: review.rollOffEmployees,
      rows: review.rows,
    });
  }

  function replaceFile() {
    fileInput.current?.click();
  }

  function downloadTemplate() {
    const template =
      'EID,Activity Type,Level,Primary Skill,Join Date,Capability,Location,Email,Attendance,Absence Days\r\n';
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog
      title="Import Employees"
      description={
        uploadedAt
          ? 'Review the detected changes from your uploaded file before applying.'
          : 'Upload a CSV or Excel file to import employee data.'
      }
      onClose={onClose}
      className="employee-import-dialog"
      showCloseButton={!uploadedAt}
      headerAction={
        uploadedAt ? (
          <button type="button" className="employee-import-history-button" onClick={onClose}>
            Cancel Import
          </button>
        ) : null
      }
    >
      <form onSubmit={submit}>
        <input
          ref={fileInput}
          className="employee-import-file-input"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={selectFile}
          aria-label="Choose employee CSV or Excel file"
        />
        {uploadedAt ? (
          <section className="employee-import-file-summary" aria-label="Uploaded file details">
            <span className="employee-import-file-summary-icon" aria-hidden="true">
              {fileName.split('.').pop()?.toUpperCase()}
            </span>
            <div className="employee-import-file-details">
              <strong>{fileName}</strong>
              <small>
                Uploaded{' '}
                {new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(uploadedAt)}
                {' · '}
                {employees.length.toLocaleString()} records
              </small>
            </div>
            <button type="button" className="employee-import-replace-button" onClick={replaceFile}>
              Replace File
            </button>
          </section>
        ) : (
          <>
            <div
              className={`employee-import-dropzone${draggingFile ? ' is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDraggingFile(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDraggingFile(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDraggingFile(false);
                void loadFile(event.dataTransfer.files?.[0]);
              }}
            >
              <svg
                className="employee-import-file-icon"
                viewBox="0 0 32 36"
                fill="none"
                aria-hidden="true"
              >
                <path d="M5 2.5h14l8 8v23H5z" />
                <path d="M19 2.5v8h8M10 17h12M10 22h12M10 27h8" />
              </svg>
              <strong>Drag and drop your CSV or Excel file here</strong>
              <span className="employee-import-or">or</span>
              <button
                type="button"
                className="button button-primary employee-import-choose"
                onClick={replaceFile}
                disabled={readingFile}
              >
                Choose File
              </button>
              <small>Accepted file types: CSV (.csv) or Excel (.xlsx)</small>
              <small>Maximum file size: 10 MB</small>
            </div>
            <div className="employee-import-format">
              <span className="employee-import-info-icon" aria-hidden="true">
                i
              </span>
              <div>
                <strong>File Format</strong>
                <p>
                  Your CSV or Excel file should include EID (employee name), Activity Type, Level,
                  Primary Skill, and Join Date. Roll-in Date is not required. Capability, Location,
                  Email, Attendance, and Absence Days are optional. Activity Type options: Bench,
                  Project, Training, or Internal.
                </p>
                <button
                  type="button"
                  className="employee-import-template"
                  onClick={downloadTemplate}
                >
                  <span aria-hidden="true">↓</span> Download Template
                </button>
              </div>
            </div>
          </>
        )}
        {readingFile && <p className="muted-copy">Reading employee file…</p>}
        {errors.length > 0 && (
          <div className="employee-import-errors" role="alert">
            <strong>Resolve these issues before importing:</strong>
            <ul>
              {errors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {storageError && (
          <p className="employee-import-storage-error" role="alert">
            Import failed: {storageError}
          </p>
        )}
        <div className="form-actions employee-import-actions">
          {!uploadedAt && (
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="button button-primary"
            disabled={!uploadedAt || errors.length > 0 || readingFile}
          >
            {uploadedAt ? 'Continue to Review' : 'Import employees'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
