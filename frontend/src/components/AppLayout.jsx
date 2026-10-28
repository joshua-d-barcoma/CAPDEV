import { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useBenchData } from '../hooks/useBenchData.js';
import { useRole } from '../hooks/useRole.js';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { ROUTES } from '../constants/routes.js';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef(null);
  const location = useLocation();
  const { role, switchRole } = useRole();
  const { storageError, clearStorageError } = useBenchData();
  const layoutClassName = [
    'app-layout',
    sidebarCollapsed && 'sidebar-is-collapsed',
    role === 'user' && 'user-role',
    location.pathname === ROUTES.attendance && 'attendance-layout',
  ]
    .filter(Boolean)
    .join(' ');

  useLayoutEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.key]);

  return (
    <div className={layoutClassName}>
      <Sidebar role={role} collapsed={sidebarCollapsed} />
      <div className="main-area">
        <Header
          role={role}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
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
