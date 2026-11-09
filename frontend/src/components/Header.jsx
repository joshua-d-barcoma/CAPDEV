import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { getInitials } from '../utils/formatters.js';

const titlesByPath = {
  [ROUTES.adminDashboard]: ['Admin Dashboard', 'Bench Management Overview'],
  [ROUTES.employees]: ['Employees', 'Bench resource directory'],
  [ROUTES.employeeImportHistory]: ['Import History', 'Employee CSV import records'],
  [ROUTES.attendance]: ['Attendance', 'Monitor attendance and compliance'],
  [ROUTES.learning]: ['Learning', 'Capability development'],
  [ROUTES.productivity]: ['Productivity', 'Tasks and productivity'],
  [ROUTES.actionItems]: ['Action Items', 'Follow up on bench operations'],
  [ROUTES.userDashboard]: ['Personal Dashboard', 'My bench responsibilities and progress'],
  [ROUTES.tasks]: ['My Tasks', 'Training and development tasks'],
  [ROUTES.timeIn]: ['Time In', 'Record your workday attendance'],
  [ROUTES.timeOut]: ['Time Out', 'Complete your workday'],
  [ROUTES.history]: ['Attendance History', 'Review your attendance and schedule'],
  [ROUTES.calendar]: ['My Calendar', 'Attendance and planned leave'],
  [ROUTES.skillHub]: ['Skill Hub', 'Learning and development'],
};

const BellIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>;
const CalendarIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg>;
const UserPlusIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.5 2.4-5.2 5.5-5.2s4.9 1.7 5.5 5.2M18 7v6M15 10h6"/></svg>;
const AlertIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 3.5 19h17L12 3.5Z"/><path d="M12 9v4.5M12 17h.01"/></svg>;
const TrainingIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8.5 9-5 9 5-9 5-9-5Z"/><path d="M7 11.5v4.2c2.8 2.2 7.2 2.2 10 0v-4.2M21 8.5v6"/></svg>;
const TaskIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>;
const ShieldIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;

const notificationData = {
  admin: [
    { id: 'admin-rto-1', category: 'RTO', title: 'New RTO Change Request', description: 'Maria Cruz submitted an RTO change request for Nov 3 - Nov 7, 2026.', time: '10 minutes ago', action: 'Review Request', routeKey: 'attendance', icon: UserPlusIcon, tone: 'request' },
    { id: 'admin-attendance-1', category: 'Attendance', title: 'Attendance Exception', description: 'John Reyes was marked absent today.', time: '1 hour ago', action: 'View Attendance', routeKey: 'attendance', icon: AlertIcon, tone: 'warning' },
    { id: 'admin-training-1', category: 'Learning', title: 'Training Deadline Approaching', description: '3 employees have upcoming training deadlines this week.', time: '2 hours ago', action: 'View Training', routeKey: 'learning', icon: TrainingIcon, tone: 'training' },
    { id: 'admin-task-1', category: 'Tasks', title: 'Task Overdue', description: '5 action items are overdue.', time: '4 hours ago', action: 'View Tasks', routeKey: 'actionItems', icon: TaskIcon, tone: 'task' },
    { id: 'admin-employee-1', category: 'Employees', title: 'Employee Added', description: 'Alex Santos has been added to BenchFlow.', time: 'Yesterday, 4:20 PM', action: 'View Employee', routeKey: 'employees', icon: UserPlusIcon, tone: 'employee' },
    { id: 'admin-compliance-1', category: 'Attendance', title: 'Compliance Alert', description: '1 employee has an attendance compliance item that needs review.', time: 'Yesterday, 1:15 PM', action: 'View Compliance', routeKey: 'attendance', icon: ShieldIcon, tone: 'compliance' },
  ],
  user: [
    { id: 'user-rto-1', category: 'RTO', title: 'RTO Request Approved', description: 'Your RTO change request for Nov 3 - Nov 7, 2026 has been approved.', time: '15 minutes ago', action: 'View Schedule', routeKey: 'calendar', icon: CalendarIcon, tone: 'rto' },
    { id: 'user-task-1', category: 'Tasks', title: 'Task Due Soon', description: 'Complete the Skill Assessment task by Nov 8, 2026.', time: '2 hours ago', action: 'View Task', routeKey: 'tasks', icon: TaskIcon, tone: 'task' },
    { id: 'user-training-1', category: 'Training', title: 'Training Deadline Approaching', description: 'Microsoft Azure Fundamentals is due on Nov 9, 2026.', time: '3 hours ago', action: 'View Training', routeKey: 'skillHub', icon: TrainingIcon, tone: 'training' },
    { id: 'user-attendance-1', category: 'Attendance', title: 'Attendance Exception', description: 'You were marked absent today. Please review your attendance record.', time: 'Today, 9:15 AM', action: 'View Attendance', routeKey: 'history', icon: AlertIcon, tone: 'warning' },
    { id: 'user-meeting-1', category: 'Calendar', title: 'Upcoming Meeting', description: 'Team Sync Meeting starts in 30 minutes.', time: 'Today, 9:30 AM', action: 'View Calendar', routeKey: 'calendar', icon: BellIcon, tone: 'meeting' },
  ],
};

export function Header({ role, theme, onToggleTheme, onToggleSidebar, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [readNotifications, setReadNotifications] = useState(() => new Set());
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const title =
    titlesByPath[location.pathname] ??
    (location.pathname.startsWith(ROUTES.employeeImportHistory)
      ? ['Import History', 'Employee CSV import records']
      : ['Employee Profile', 'Resource details and development']);
  const name = role === 'admin' ? 'Admin User' : 'Alex Santos';
  const roleDescription = role === 'admin' ? 'Admin / Bench Lead' : 'User / Bench Resource';

  useEffect(() => {
    function closeMenus(event) {
      if (!profileRef.current?.contains(event.target)) setMenuOpen(false);
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('pointerdown', closeMenus);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenus);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
    setActiveFilter('All');
  }, [role]);

  const notifications = notificationData[role] ?? notificationData.user;
  const unreadCount = notifications.filter((item) => !readNotifications.has(item.id)).length;
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !readNotifications.has(item.id);
    return item.category === activeFilter;
  });
  const filters = role === 'admin'
    ? ['All', 'Unread', 'RTO', 'Attendance', 'Tasks', 'Learning', 'Employees']
    : ['All', 'Unread', 'RTO', 'Tasks', 'Training', 'Attendance', 'Calendar'];

  function markNotificationRead(id) {
    setReadNotifications((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  function markAllRead() {
    setReadNotifications((current) => {
      const next = new Set(current);
      notifications.forEach((item) => next.add(item.id));
      return next;
    });
  }

  function handleNotificationClick(item) {
    markNotificationRead(item.id);
    setNotificationsOpen(false);
    const destination = ROUTES[item.routeKey];
    if (destination) navigate(destination);
  }

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="menu-button"
          onClick={onToggleSidebar}
          aria-label={role === 'admin' ? 'Toggle sidebar' : 'Static sidebar navigation'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="header-title">
          <strong>{title[0]}</strong>
          <span>{title[1]}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="notifications-container" ref={notificationsRef}>
          <button
            type="button"
            className="notification-button"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </svg>
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>
          {notificationsOpen && (
            <section className="notifications-panel" role="dialog" aria-label="Notifications">
              <div className="notifications-header">
                <div>
                  <strong>Notifications</strong>
                  <span>{unreadCount} unread notifications</span>
                </div>
                <button type="button" className="mark-all-read" onClick={markAllRead}>
                  Mark all as read
                </button>
              </div>
              <div className="notification-tabs-wrap">
                <div className="notification-tabs" aria-label="Filter notifications">
                  {filters.map((filter) => {
                    const count = filter === 'All'
                      ? notifications.length
                      : filter === 'Unread'
                        ? unreadCount
                        : notifications.filter((item) => item.category === filter).length;
                    return (
                      <button
                        type="button"
                        key={filter}
                        className={activeFilter === filter ? 'active' : ''}
                        onClick={() => setActiveFilter(filter)}
                      >
                        {filter} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="notification-list">
                {filteredNotifications.map((item) => {
                  const isRead = readNotifications.has(item.id);
                  return (
                    <button
                      type="button"
                      className={`notification-item${isRead ? ' notification-read' : ''}`}
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <span className={`notification-avatar notification-avatar-${item.tone}`} aria-hidden="true">
                        <item.icon />
                      </span>
                      <span className="notification-copy">
                        <strong>{item.title}</strong>
                        <small>
                          {item.description}
                          {item.detail && <> <span>{item.detail}</span></>}
                          {item.time && <> · {item.time}</>}
                        </small>
                      </span>
                      <span className={`notification-status-dot${isRead ? ' read' : ''}`} aria-label={isRead ? 'Read' : 'Unread'} />
                      <span className="notification-action">{item.action}</span>
                    </button>
                  );
                })}
                {filteredNotifications.length === 0 && (
                  <p className="notification-empty">No notifications in this category.</p>
                )}
              </div>
            </section>
          )}
        </div>
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'dark'}
          onClick={onToggleTheme}
        >
          <span className="theme-icon" aria-hidden="true">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
              </svg>
            )}
          </span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <div className="profile-container" ref={profileRef}>
          <button
            type="button"
            className="profile-button"
            aria-label={`Open profile menu for ${name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="profile-avatar">{getInitials(name)}</span>
            <span className="profile-info">
              <strong>{name}</strong>
              <small>{roleDescription}</small>
            </span>
            <span className="profile-arrow" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </span>
          </button>
          {menuOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-header">
                <strong>{name}</strong>
                <span>{roleDescription}</span>
              </div>
              <button
                className="profile-menu-item profile-menu-logout"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
