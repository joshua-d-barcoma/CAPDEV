import { Link, NavLink } from 'react-router-dom';
import { NAVIGATION } from '../constants/navigation.js';
import { ROUTES } from '../constants/routes.js';

function NavigationIcon({ name }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    employees: (
      <>
        <circle cx="12" cy="7" r="3.5" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),
    attendance: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    learning: (
      <>
        <path d="M12 7c-2-2-5-3-9-2v14c4-1 7 0 9 2m0-14c2-2 5-3 9-2v14c-4-1-7 0-9 2m0-14v14" />
      </>
    ),
    productivity: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    'action-items': <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Sidebar({ role, collapsed }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Main navigation">
      <Link
        className="brand"
        aria-label="BenchFlow home"
        to={role === 'admin' ? ROUTES.adminDashboard : ROUTES.userDashboard}
      >
        <span className="brand-logo" aria-hidden="true">
          &gt;
        </span>
        {!collapsed && (
          <span className="brand-content">
            <strong>BenchFlow</strong>
            <small>BENCH MANAGEMENT SYSTEM</small>
          </span>
        )}
      </Link>

      <nav className="navigation">
        {!collapsed && <span className="navigation-title">MAIN MENU</span>}
        {NAVIGATION[role].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => `navigation-item${isActive ? ' active' : ''}`}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
          >
            <span className="navigation-icon" aria-hidden="true">
              <NavigationIcon name={item.icon} />
            </span>
            {!collapsed && <span className="navigation-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <footer className="sidebar-footer">
          <div className="footer-divider" />
          <span>{role === 'admin' ? 'Admin / Bench Lead' : 'User / Bench Resource'}</span>
          <small>Prototype · Demo data only</small>
        </footer>
      )}
    </aside>
  );
}
