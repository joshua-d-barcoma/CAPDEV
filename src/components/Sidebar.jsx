import { Link, NavLink } from 'react-router-dom';
import { NAVIGATION } from '../constants/navigation.js';
import { ROUTES } from '../constants/routes.js';

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
              {item.icon}
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
