export const ROUTES = Object.freeze({
  adminDashboard: '/admin/dashboard',
  employees: '/resources',
  employee: '/admin/employees/:employeeName',
  attendance: '/attendance',
  learning: '/learning',
  productivity: '/admin/work-management',
  actionItems: '/admin/action-items',
  userDashboard: '/user/dashboard',
  tasks: '/user/tasks',
  timeIn: '/user/time-in',
  timeOut: '/user/time-out',
  history: '/user/history',
  calendar: '/user/calendar',
  skillHub: '/user/skill-hub',
});

export const DEFAULT_ROUTE = ROUTES.adminDashboard;

export function getEmployeeRoute(employeeName) {
  return ROUTES.employee.replace(':employeeName', encodeURIComponent(employeeName));
}
