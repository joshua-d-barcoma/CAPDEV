import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes.js';
import { getInitials } from '../utils/formatters.js';

const titlesByPath = {
  [ROUTES.adminDashboard]: ['Admin Dashboard', 'Bench Management Overview'],
  [ROUTES.employees]: ['Employees', 'Bench resource directory'],
  [ROUTES.employeeImportHistory]: ['Import History', 'Employee CSV import records'],
  [ROUTES.attendance]: ['Admin Dashboard', 'Bench Management Overview'],
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

export function Header({ role, onToggleSidebar, onSwitchRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const title =
    titlesByPath[location.pathname] ??
    (location.pathname.startsWith(ROUTES.employeeImportHistory)
      ? ['Import History', 'Employee CSV import records']
      : ['Employee Profile', 'Resource details and development']);
  const name = role === 'admin' ? 'Admin User' : 'Alex Santos';
  const roleDescription = role === 'admin' ? 'Admin / Bench Lead' : 'User / Bench Resource';

  useEffect(() => {
    function closeMenu(event) {
      if (!profileRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

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
        <button type="button" className="notification-button" aria-label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span className="notification-dot" />
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
