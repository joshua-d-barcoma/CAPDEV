export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDate(
  dateString,
  options = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  if (!dateString) return '—';
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', options).format(date);
}

export function getEmployeeName(employeeId, employees) {
  return employees.find((employee) => employee.id === employeeId)?.name ?? 'Unknown employee';
}
