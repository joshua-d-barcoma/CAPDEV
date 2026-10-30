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

export function Header({ role, theme, onToggleTheme, onToggleSidebar, onLogout }) {
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
