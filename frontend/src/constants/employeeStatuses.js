export const EMPLOYEE_STATUSES = Object.freeze(['Bench', 'Project', 'Training', 'Internal']);

export const DEFAULT_EMPLOYEE_STATUS = 'Bench';

const LEGACY_EMPLOYEE_STATUSES = new Map([
  ['on bench', 'Bench'],
  ['deployed', 'Project'],
  ['bootcamp', 'Training'],
  ['on training', 'Training'],
  ['internal project', 'Internal'],
]);

export function normalizeEmployeeStatus(status) {
  const value = String(status ?? '').trim();
  if (!value) return DEFAULT_EMPLOYEE_STATUS;
  const normalizedValue = value.toLowerCase();
  const legacyStatus = LEGACY_EMPLOYEE_STATUSES.get(normalizedValue);
  if (legacyStatus) return legacyStatus;
  return (
    EMPLOYEE_STATUSES.find((employeeStatus) => employeeStatus.toLowerCase() === normalizedValue) ??
    value
  );
}
