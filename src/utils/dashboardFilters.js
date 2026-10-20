export const DASHBOARD_LOCATIONS = ['Manila', 'Cebu'];
export const DASHBOARD_CAPABILITIES = [
  'Hybrid Cloud',
  'Network',
  'Security',
  'Data & AI',
];

function matchesCapability(employee, capability) {
  return employee.capability.toLowerCase().includes(capability.toLowerCase());
}

function getAssociatedEmployeeIds(item) {
  if (Array.isArray(item.employeeIds)) return item.employeeIds;
  return item.employeeId ? [item.employeeId] : [];
}

export function filterDashboardData(
  { employees, attendanceRecords, actionItems },
  { location = '', capability = '' },
) {
  const filteredEmployees = employees.filter(
    (employee) =>
      (!location || employee.workLocation === location) &&
      (!capability || matchesCapability(employee, capability)),
  );
  const employeeIds = new Set(filteredEmployees.map((employee) => employee.id));
  const hasActiveFilters = Boolean(location || capability);

  return {
    employees: filteredEmployees,
    attendanceRecords: attendanceRecords.filter((record) => employeeIds.has(record.employeeId)),
    actionItems: actionItems.filter((item) =>
      getAssociatedEmployeeIds(item).some((employeeId) => employeeIds.has(employeeId)),
    ),
  };
}

export function buildAttendanceTrend(attendanceRecords) {
  const byDate = new Map();

  attendanceRecords.forEach((record) => {
    const daily = byDate.get(record.date) ?? { date: record.date, present: 0, total: 0 };
    daily.total += 1;
    if (record.status === 'Present') daily.present += 1;
    byDate.set(record.date, daily);
  });

  return [...byDate.values()]
    .sort((first, second) => first.date.localeCompare(second.date))
    .map((daily) => ({
      ...daily,
      percentage: daily.total ? Math.round((daily.present / daily.total) * 100) : 0,
    }));
}
