import { ROUTES } from './routes.js';

export const NAVIGATION = Object.freeze({
  admin: [
    { label: 'Dashboard', path: ROUTES.adminDashboard, icon: 'dashboard' },
    { label: 'Employees', path: ROUTES.employees, icon: 'employees' },
    { label: 'Attendance', path: ROUTES.attendance, icon: 'attendance' },
    { label: 'Learning', path: ROUTES.learning, icon: 'learning' },
    { label: 'Productivity', path: ROUTES.productivity, icon: 'productivity' },
    { label: 'Action Items', path: ROUTES.actionItems, icon: 'action-items' },
  ],
  user: [
    { label: 'Dashboard', path: ROUTES.userDashboard, icon: 'dashboard' },
    { label: 'Tasks', path: ROUTES.tasks, icon: 'productivity' },
    { label: 'Skill Hub', path: ROUTES.skillHub, icon: 'learning' },
    { label: 'Time In', path: ROUTES.timeIn, icon: 'attendance' },
    { label: 'Time Out', path: ROUTES.timeOut, icon: 'attendance' },
    { label: 'History', path: ROUTES.history, icon: 'attendance' },
    { label: 'Calendar', path: ROUTES.calendar, icon: 'attendance' },
  ],
});
