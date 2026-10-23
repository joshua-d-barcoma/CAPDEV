import { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useBenchData } from '../hooks/useBenchData.js';
import { useRole } from '../hooks/useRole.js';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainContentRef = useRef(null);
  const location = useLocation();
  const { role, switchRole } = useRole();
  const { storageError, clearStorageError } = useBenchData();

  useLayoutEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.key]);

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
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
