import { normalizeEmployeeStatus } from '../constants/employeeStatuses.js';

const COMPARABLE_FIELDS = [
  { key: 'name', label: 'Employee Name' },
  { key: 'careerLevel', label: 'Career Level' },
  { key: 'email', label: 'Email' },
  { key: 'capability', label: 'Capability' },
  { key: 'workLocation', label: 'Location' },
  { key: 'skills', label: 'Skills' },
  { key: 'attendanceStatus', label: 'Attendance' },
  { key: 'employeeStatus', label: 'Status' },
  { key: 'absenceDays', label: 'Absence Days' },
  { key: 'joiningDate', label: 'Join Date' },
];

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getEmployeeMatch(employee, existingEmployees) {
  if (employee.employeeId) {
    const idMatches = existingEmployees.filter(
      (candidate) => normalize(candidate.employeeId) === normalize(employee.employeeId),
    );
    if (idMatches.length > 0) return { matches: idMatches, matchedBy: 'Employee ID' };

    const nameMatches = existingEmployees.filter(
      (candidate) => normalize(candidate.name) === normalize(employee.name),
    );
    return { matches: nameMatches, matchedBy: 'name' };
  }

  const nameMatches = existingEmployees.filter(
    (candidate) => normalize(candidate.name) === normalize(employee.name),
  );
  return { matches: nameMatches, matchedBy: 'name' };
}

function getProvidedFields(employee) {
  return new Set(
    employee.providedFields ??
      COMPARABLE_FIELDS.map(({ key }) => key).concat(['employeeId', 'name']),
  );
}

function withoutImportMetadata(employee) {
  const { providedFields, ...employeeData } = employee;
  return employeeData;
}

export function reviewEmployeeImport(incomingEmployees, existingEmployees) {
  const rows = [];
  const changesToApply = [];
  const rollOffEmployees = [];
  const mergedEmployees = [];
  const mergedDuplicates = [];

  incomingEmployees.forEach((employee) => {
    const duplicate = mergedEmployees.find(
      (candidate) =>
        (employee.employeeId &&
          candidate.employee.employeeId &&
          normalize(employee.employeeId) === normalize(candidate.employee.employeeId)) ||
        normalize(employee.name) === normalize(candidate.employee.name),
    );
    if (!duplicate) {
      mergedEmployees.push({
        employee: { ...employee, skills: [...(employee.skills ?? [])] },
        providedFields: new Set(getProvidedFields(employee)),
      });
      return;
    }

    const duplicateEmployee = duplicate.employee;
    const providedFields = getProvidedFields(employee);
    for (const field of providedFields) {
      if (field === 'skills') {
        duplicateEmployee.skills = [
          ...new Set([...(duplicateEmployee.skills ?? []), ...(employee.skills ?? [])]),
        ];
      } else if (field === 'employeeStatus') {
        const incomingStatus = normalizeEmployeeStatus(employee.employeeStatus);
        const mergedStatus = normalizeEmployeeStatus(duplicateEmployee.employeeStatus);
        duplicateEmployee.employeeStatus =
          incomingStatus === 'Project' || mergedStatus === 'Project' ? 'Project' : incomingStatus;
      } else if (employee[field] !== '' && employee[field] !== undefined) {
        duplicateEmployee[field] = employee[field];
      }
      duplicate.providedFields.add(field);
    }
    mergedDuplicates.push(duplicateEmployee);
  });

  mergedEmployees.forEach(({ employee }, employeeIndex) => {
    const identity = employee.employeeId
      ? `id:${normalize(employee.employeeId)}`
      : `name:${normalize(employee.name)}`;
    const key = `${employeeIndex}-${identity}`;

    const { matches, matchedBy } = getEmployeeMatch(employee, existingEmployees);
    if (matches.length > 1) {
      rows.push({
        key,
        type: 'duplicate',
        employee,
        employeeId: employee.employeeId || '—',
        field: 'Potential duplicate',
        previousValue: `Multiple existing employees match by ${matchedBy}`,
        newValue: 'Add a unique Employee ID',
      });
      return;
    }

    const existing = matches[0];
    if (
      existing?.employeeId &&
      employee.employeeId &&
      normalize(existing.employeeId) !== normalize(employee.employeeId)
    ) {
      rows.push({
        key,
        type: 'duplicate',
        employee,
        employeeId: employee.employeeId,
        field: 'Employee ID mismatch',
        previousValue: `Existing employee ID: ${existing.employeeId}`,
        newValue: 'Review employee identity',
      });
      return;
    }

    if (existing) {
      if (normalizeEmployeeStatus(employee.employeeStatus) === 'Project') {
        rollOffEmployees.push({
          employee: {
            ...withoutImportMetadata(employee),
            employeeStatus: 'Project',
          },
          previousEmployee: existing,
        });
      }
      rows.push({
        key,
        type: 'duplicate',
        employee: existing,
        employeeId: employee.employeeId || existing.employeeId || '—',
        field: 'Existing employee preserved',
        previousValue: `${existing.name} · ${existing.employeeId || 'No Employee ID'}`,
        newValue: 'Matching import row was not applied',
      });
      return;
    }

    const incomingStatus = normalizeEmployeeStatus(employee.employeeStatus);
    const newEmployee = {
      ...withoutImportMetadata(employee),
      employeeStatus: incomingStatus,
    };
    rows.push({
      key,
      type: 'new',
      employee: newEmployee,
      employeeId: employee.employeeId || '—',
      field: 'New employee',
      previousValue: '—',
      newValue: 'Add employee record',
    });
    changesToApply.push({ type: 'new', employee: newEmployee });
    if (incomingStatus === 'Project') {
      rollOffEmployees.push({ employee: newEmployee, previousEmployee: null });
    }
  });

  mergedDuplicates.forEach((employee, index) => {
    rows.push({
      key: `merged-duplicate-${index}`,
      type: 'duplicate',
      employee,
      employeeId: employee.employeeId || '—',
      field: 'Duplicate employee merged',
      previousValue: 'Repeated employee row',
      newValue: 'Merged into one employee record',
    });
  });

  return {
    rows,
    changesToApply,
    rollOffEmployees,
    employees: mergedEmployees.map(({ employee }) => ({
      ...withoutImportMetadata(employee),
      employeeStatus: normalizeEmployeeStatus(employee.employeeStatus),
    })),
  };
}
