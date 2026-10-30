import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { getInitials } from '../utils/formatters.js';

const titlesByPath = {
  [ROUTES.adminDashboard]: ['Admin Dashboard', 'Bench Management Overview'],
  [ROUTES.employees]: ['Employees', 'Bench resource directory'],
  [ROUTES.employeeImportHistory]: ['Import History', 'Employee CSV import records'],
  [ROUTES.attendance]: ['Attendance', 'Attendance and RTO management'],
  [ROUTES.learning]: ['Learning', 'Capability development'],
  [ROUTES.productivity]: ['Productivity', 'Tasks and productivity'],
  [ROUTES.actionItems]: ['Action Items', 'Follow up on bench operations'],
  [ROUTES.userDashboard]: ['My Dashboard', 'Your bench workspace'],
  [ROUTES.tasks]: ['My Tasks', 'Training and development tasks'],
  [ROUTES.timeIn]: ['Time In', 'Record your workday attendance'],
  [ROUTES.timeOut]: ['Time Out', 'Complete your workday'],
  [ROUTES.history]: ['Attendance History', 'Review your attendance and schedule'],
  [ROUTES.calendar]: ['My Calendar', 'Attendance and planned leave'],
  [ROUTES.skillHub]: ['Skill Hub', 'Learning and development'],
};

const notificationData = {
  admin: [
    { id: 'admin-rto-1', category: 'RTO', title: 'New RTO Change Request', description: 'Maria Cruz submitted an RTO change request for', time: 'Nov 3', action: 'Review Request', tone: 'request' },
    { id: 'admin-attendance-1', category: 'Attendance', title: 'Attendance Exception', description: 'Maria Cruz has submitted an RTO change request for', detail: 'John Reyes was marked absent today', action: 'View Attendance', tone: 'warning' },
    { id: 'admin-training-1', category: 'Training', title: 'Training Deadline Approaching', description: '3 employees have upcoming training deadlines', detail: 'this week', action: 'View Training', tone: 'avatar' },
    { id: 'admin-task-1', category: 'Tasks', title: 'Task Overdue', description: '5 action items are overdue', action: 'View Tasks', tone: 'avatar' },
    { id: 'admin-employee-1', category: 'Employee', title: 'Employee Added', description: '1 employee has joined the certification', action: 'View Employee', tone: 'avatar' },
  ],
  user: [
    { id: 'user-rto-1', category: 'RTO', title: 'New RTO Request Approved', description: 'Your RTO request approved for Nov 3 - Nov 7, 2026', action: 'View Schedule', tone: 'avatar' },
    { id: 'user-task-1', category: 'Tasks', title: 'Task Due Soon', description: 'Complete the Skill Assessment task by Oct 31, 2026', action: 'View Task', tone: 'avatar' },
    { id: 'user-training-1', category: 'Training', title: 'Training Deadline Approaching', description: 'Microsoft Learn for Azure Fundamentals is due on Nov 5 2026', action: 'View Training', tone: 'avatar' },
    { id: 'user-attendance-1', category: 'Attendance', title: 'Attendance Exception', description: 'You were marked absent today. Please review your attendance', action: 'View Attendance', tone: 'avatar' },
    { id: 'user-meeting-1', category: 'Other', title: 'Upcoming Meeting', description: 'Team Sync Meeting starts in 30 minutes', action: 'View Calendar', tone: 'avatar' },
  ],
};

export function Header({ role, onToggleSidebar, onSwitchRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [readNotifications, setReadNotifications] = useState(() => new Set());
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const location = useLocation();
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
    ? ['All', 'Unread', 'RTO', 'Tasks', 'Attendance']
    : ['All', 'Unread', 'RTO', 'Tasks', 'Attendance'];

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

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="menu-button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
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
              <div className="notification-list">
                {filteredNotifications.map((item) => {
                  const isRead = readNotifications.has(item.id);
                  return (
                    <button
                      type="button"
                      className={`notification-item${isRead ? ' notification-read' : ''}`}
                      key={item.id}
                      onClick={() => markNotificationRead(item.id)}
                    >
                      <span className={`notification-avatar notification-avatar-${item.tone}`} aria-hidden="true">
                        {item.tone === 'request' ? '♙' : item.tone === 'warning' ? '!' : 'AS'}
                      </span>
                      <span className="notification-copy">
                        <strong>{item.title}</strong>
                        <small>
                          {item.description}
                          {item.detail && <> <span>{item.detail}</span></>}
                          {item.time && <> · Nov 3, 2026</>}
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
              ⌄
            </span>
          </button>
          {menuOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-header">
                <strong>{name}</strong>
                <span>{roleDescription}</span>
              </div>
              <button
                className="profile-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onSwitchRole();
                }}
              >
                {role === 'admin' ? 'Switch to User' : 'Switch to Admin'}{' '}
                <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
