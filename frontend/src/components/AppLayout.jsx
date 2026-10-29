import { useLayoutEffect, useRef, useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import { useBenchData } from '../hooks/useBenchData.js';
import { useRole } from '../hooks/useRole.js';
import { ROUTES } from '../constants/routes.js';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef(null);
  const location = useLocation();
  const { role, switchRole } = useRole();
  const { storageError, clearStorageError } = useBenchData();
  const isAdminDashboard =
    role === 'admin' && matchPath(ROUTES.adminDashboard, location.pathname) !== null;
  const isAdminEmployees =
    role === 'admin' &&
    (matchPath(ROUTES.employees, location.pathname) !== null ||
      location.pathname.startsWith(`${ROUTES.employees}/`) ||
      matchPath(ROUTES.employee, location.pathname) !== null);
  const layoutClassName = [
    'app-layout',
    sidebarCollapsed && role === 'admin' && 'sidebar-is-collapsed',
    role === 'user' && 'user-role',
    location.pathname === ROUTES.attendance && 'attendance-layout',
    isAdminDashboard && 'admin-dashboard-layout',
    isAdminEmployees && 'admin-employees-layout',
  ]
    .filter(Boolean)
    .join(' ');

  useLayoutEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.key]);

  return (
    <div className={layoutClassName}>
      <Sidebar role={role} collapsed={role === 'admin' && sidebarCollapsed} />
      <div className="main-area">
        <Header
          role={role}
          onToggleSidebar={() => {
            if (role === 'admin') setSidebarCollapsed((collapsed) => !collapsed);
          }}
          onSwitchRole={switchRole}
        />
        {storageError && (
          <div className="global-error" role="alert">
            <span>{storageError}</span>
            <button className="icon-button" onClick={clearStorageError} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        <main className="page-content" id="main-content" ref={mainContentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
