import { EMPLOYEE_STATUSES, normalizeEmployeeStatus } from '../constants/employeeStatuses.js';
import { readSheet } from 'read-excel-file/browser';

const FIELD_HEADERS = {
  employeeId: ['employee id', 'employeeid', 'employee number', 'employee no'],
  email: ['email', 'email address'],
  name: ['name', 'full name', 'employee name', 'eid'],
  capability: ['capability'],
  careerLevel: ['career level', 'careerlevel', 'level'],
  workLocation: ['work location', 'worklocation', 'location', 'home loc', 'home location'],
  skills: ['skills', 'key skills', 'primary skill'],
  attendanceStatus: ['attendance status', 'attendance'],
  employeeStatus: ['employee status', 'status', 'activity type'],
  absenceDays: ['absence days'],
  joiningDate: ['joining date', 'joiningdate', 'join date'],
};

const REQUIRED_FIELDS = ['name', 'employeeStatus', 'careerLevel', 'skills', 'joiningDate'];
const REQUIRED_FIELD_LABELS = {
  name: 'Name/EID',
  employeeStatus: 'Activity Type/Status',
  careerLevel: 'Level/Career Level',
  skills: 'Primary Skill/Skills',
  joiningDate: 'Join Date',
};

function normalizeHeader(value) {
  return String(value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function hasCellValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function parseCsvRecords(text) {
  const records = [];
  let cells = [];
  let value = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        value += character;
        if (character === '\n') line += 1;
      }
    } else if (character === '"') {
      if (value.length > 0) throw new Error(`Unexpected quote on line ${line}.`);
      inQuotes = true;
    } else if (character === ',') {
      cells.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      cells.push(value);
      if (cells.some((cell) => cell.trim())) records.push({ cells, line: recordLine });
      cells = [];
      value = '';
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      line += 1;
      recordLine = line;
    } else {
      value += character;
    }
  }

  if (inQuotes) throw new Error(`Unclosed quoted value starting before line ${line}.`);
  cells.push(value);
  if (cells.some((cell) => cell.trim())) records.push({ cells, line: recordLine });
  return records;
}

function normalizeDate(value, rowLine, fieldLabel, errors) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear().toString().padStart(4, '0')}-${(value.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0')}-${value.getUTCDate().toString().padStart(2, '0')}`;
  }
  const trimmed = value.trim();
  if (!trimmed) return '';

  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!match) match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
  if (!match) {
    errors.push(`Line ${rowLine}: ${fieldLabel} must use YYYY-MM-DD or MM/DD/YYYY.`);
    return '';
  }

  const [, first, second, third] = match;
  const yearPart = trimmed.includes('/') ? Number(third) : Number(first);
  const year =
    trimmed.includes('/') && yearPart < 100 ? yearPart + (yearPart < 50 ? 2000 : 1900) : yearPart;
  const month = trimmed.includes('/') ? Number(first) : Number(second);
  const day = trimmed.includes('/') ? Number(second) : Number(third);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    errors.push(`Line ${rowLine}: ${fieldLabel} is not a valid date.`);
    return '';
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function parseEmployeeCsv(text) {
  try {
    return parseEmployeeRecords(parseCsvRecords(text));
  } catch (error) {
    return {
      employees: [],
      errors: [error instanceof Error ? error.message : 'Unable to read this CSV file.'],
    };
  }
}

export async function parseEmployeeExcel(arrayBuffer) {
  try {
    const rows = await readSheet(arrayBuffer);
    return parseEmployeeRecords(
      rows.map((cells, index) => ({
        cells: cells.map((cell) => (cell === null || cell === undefined ? '' : cell)),
        line: index + 1,
      })),
    );
  } catch (error) {
    return {
      employees: [],
      errors: [error instanceof Error ? error.message : 'Unable to read this Excel file.'],
    };
  }
}

function parseEmployeeRecords(records) {
  if (records.length < 2) {
    return {
      employees: [],
      errors: ['The file must include a header row and at least one employee.'],
    };
  }

  const sourceHeaders = records[0].cells.map((header) => String(header).trim());
  const headers = sourceHeaders.map(normalizeHeader);
  const fieldIndexes = {};
  const errors = [];
  for (const [field, aliases] of Object.entries(FIELD_HEADERS)) {
    const matchingIndexes = headers
      .map((header, index) =>
        aliases.some((alias) => normalizeHeader(alias) === header) ? index : -1,
      )
      .filter((index) => index !== -1);
    if (matchingIndexes.length > 1) {
      errors.push(`The file contains more than one column for ${field}.`);
    } else if (matchingIndexes.length === 1) {
      fieldIndexes[field] = matchingIndexes[0];
    }
  }

  const missingHeaders = REQUIRED_FIELDS.filter((field) => fieldIndexes[field] === undefined);
  if (missingHeaders.length) {
    errors.push(
      `Missing required columns: ${missingHeaders.map((field) => REQUIRED_FIELD_LABELS[field]).join(', ')}.`,
    );
  }
  if (errors.length) return { employees: [], errors };

  const employees = [];
  const sourceRows = [];
  for (const record of records.slice(1)) {
    if (record.cells.length > headers.length) {
      errors.push(`Line ${record.line}: this row has more values than the header row.`);
      continue;
    }
    const getValue = (field) => {
      const index = fieldIndexes[field];
      if (index === undefined) return '';
      const value = record.cells[index] ?? '';
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getUTCFullYear().toString().padStart(4, '0')}-${(value.getUTCMonth() + 1)
          .toString()
          .padStart(2, '0')}-${value.getUTCDate().toString().padStart(2, '0')}`;
      }
      return String(value).trim();
    };
    const sourceRow = sourceHeaders.map((_, index) => {
      const value = record.cells[index];
      if (value === null || value === undefined) return '';
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getUTCFullYear().toString().padStart(4, '0')}-${(value.getUTCMonth() + 1)
          .toString()
          .padStart(2, '0')}-${value.getUTCDate().toString().padStart(2, '0')}`;
      }
      return String(value);
    });
    const employee = {
      employeeId: getValue('employeeId'),
      email: getValue('email'),
      name: getValue('name'),
      capability: getValue('capability'),
      careerLevel: getValue('careerLevel'),
      workLocation: getValue('workLocation'),
      skills: getValue('skills')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      attendanceStatus: getValue('attendanceStatus') || 'Present',
      employeeStatus: getValue('employeeStatus')
        ? normalizeEmployeeStatus(getValue('employeeStatus'))
        : '',
      absenceDays: getValue('absenceDays') ? Number(getValue('absenceDays')) : 0,
      joiningDate: '',
      rollInDate: '',
      providedFields: Object.entries(fieldIndexes)
        .filter(([, fieldIndex]) => hasCellValue(record.cells[fieldIndex]))
        .map(([field]) => field),
    };
    employee.joiningDate = normalizeDate(getValue('joiningDate'), record.line, 'Join Date', errors);
    if (!employee.name) errors.push(`Line ${record.line}: Name/EID is required.`);
    if (!employee.employeeStatus)
      errors.push(`Line ${record.line}: Activity Type/Status is required.`);
    if (!employee.careerLevel) errors.push(`Line ${record.line}: Level/Career Level is required.`);
    if (employee.skills.length === 0)
      errors.push(`Line ${record.line}: Primary Skill is required.`);
    if (!employee.joiningDate) errors.push(`Line ${record.line}: Join Date is required.`);
    if (
      !Number.isFinite(employee.absenceDays) ||
      employee.absenceDays < 0 ||
      !Number.isInteger(employee.absenceDays)
    ) {
      errors.push(`Line ${record.line}: Absence days must be a non-negative whole number.`);
    }
    if (employee.employeeStatus && !EMPLOYEE_STATUSES.includes(employee.employeeStatus)) {
      errors.push(
        `Line ${record.line}: Activity Type must be one of ${EMPLOYEE_STATUSES.join(', ')}.`,
      );
    }
    employees.push(employee);
    sourceRows.push(sourceRow);
  }

  if (employees.length === 0 && errors.length === 0) {
    errors.push('The file does not contain any employee rows.');
  }
  return { employees, errors, sourceHeaders, sourceRows };
}
