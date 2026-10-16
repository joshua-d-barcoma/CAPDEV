import { ROUTES } from './routes.js';

export const NAVIGATION = Object.freeze({
  admin: [
    { label: 'Dashboard', path: ROUTES.adminDashboard, icon: '▦' },
    { label: 'Employees', path: ROUTES.employees, icon: '♙' },
    { label: 'Attendance', path: ROUTES.attendance, icon: '▣' },
    { label: 'Learning', path: ROUTES.learning, icon: '◇' },
    { label: 'Productivity', path: ROUTES.productivity, icon: '✓' },
    { label: 'Action Items', path: ROUTES.actionItems, icon: '⚑' },
  ],
  user: [
    { label: 'Dashboard', path: ROUTES.userDashboard, icon: '▦' },
    { label: 'Tasks', path: ROUTES.tasks, icon: '✓' },
    { label: 'Skill Hub', path: ROUTES.skillHub, icon: '◇' },
    { label: 'Time In', path: ROUTES.timeIn, icon: '◷' },
    { label: 'Time Out', path: ROUTES.timeOut, icon: '◴' },
    { label: 'History', path: ROUTES.history, icon: '◴' },
    { label: 'Calendar', path: ROUTES.calendar, icon: '▣' },
  ],
});
