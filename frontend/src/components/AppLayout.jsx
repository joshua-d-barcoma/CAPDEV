import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  matchPath,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useBenchData,
} from "../hooks/useBenchData.js";

import {
  useRole,
} from "../hooks/useRole.js";

import {
  useTheme,
} from "../hooks/ThemeProvider.jsx";

import {
  ROUTES,
} from "../constants/routes.js";

import {
  clearSessionUser,
} from "../utils/auth.js";

import {
  Header,
} from "./Header.jsx";

import {
  Sidebar,
} from "./Sidebar.jsx";

import {
  clearWelcomeMailerDismissal,
  WelcomeMailer,
} from "./WelcomeMailer.jsx";

export function AppLayout() {
  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);
  const [
    welcomeMailerOpenRequest,
    setWelcomeMailerOpenRequest,
  ] = useState(0);

  const mainContentRef = useRef(null);
  const pageTransitionTimerRef = useRef(null);

  const location = useLocation();
  const previousLocationKeyRef = useRef(location.key);

  const navigate = useNavigate();

  const {
    user,
    role,
  } = useRole();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const {
    storageError,
    clearStorageError,
  } = useBenchData();

  const isAdminDashboard =
    role === "admin" &&
    matchPath(
      ROUTES.adminDashboard,
      location.pathname
    ) !== null;

  const isAdminEmployees =
    role === "admin" &&
    (
      matchPath(
        ROUTES.employees,
        location.pathname
      ) !== null ||
      location.pathname.startsWith(
        `${ROUTES.employees}/`
      ) ||
      matchPath(
        ROUTES.employee,
        location.pathname
      ) !== null
    );

  const isAdminProductivity =
    role === "admin" &&
    matchPath(
      ROUTES.productivity,
      location.pathname
    ) !== null;

  const isUserDashboard =
    role === "user" &&
    matchPath(
      ROUTES.userDashboard,
      location.pathname
    ) !== null;

  const layoutClassName = [
    "app-layout",

    theme === "dark" &&
      "theme-dark",

    location.state?.loginAnimation &&
      "login-transition",

    sidebarCollapsed &&
      role === "admin" &&
      "sidebar-is-collapsed",

    role === "user" &&
      "user-role",

    isUserDashboard &&
      "user-dashboard-layout",

    location.pathname ===
      ROUTES.attendance &&
      "attendance-layout",

    isAdminDashboard &&
      "admin-dashboard-layout",

    isAdminEmployees &&
      "admin-employees-layout",

    isAdminProductivity &&
      "admin-productivity-layout",
  ]
    .filter(Boolean)
    .join(" ");

  useLayoutEffect(() => {
    mainContentRef.current?.scrollTo({
      top: 0,
      left: 0,
    });

    if (previousLocationKeyRef.current === location.key) return undefined;
    previousLocationKeyRef.current = location.key;

    const pageContent = mainContentRef.current;
    pageContent?.classList.remove("page-navigation-enter");

    if (location.state?.loginAnimation || !pageContent) return undefined;

    void pageContent.offsetWidth;
    pageContent.classList.add("page-navigation-enter");
    pageTransitionTimerRef.current = window.setTimeout(() => {
      pageContent.classList.remove("page-navigation-enter");
      pageTransitionTimerRef.current = null;
    }, 360);

    return () => {
      if (pageTransitionTimerRef.current !== null) {
        window.clearTimeout(pageTransitionTimerRef.current);
        pageTransitionTimerRef.current = null;
      }
    };
  }, [location.key]);

  function handleLogout() {
    clearWelcomeMailerDismissal(user?.email);
    clearSessionUser();

    navigate(ROUTES.login, {
      replace: true,
    });
  }

  function handleToggleSidebar() {
    setSidebarCollapsed(
      (collapsed) => !collapsed
    );
  }

  function handleOpenWelcomeMailer() {
    setWelcomeMailerOpenRequest(
      (request) => request + 1
    );
  }

  return (
    <div className={layoutClassName}>
      <Sidebar
        role={role}
        collapsed={sidebarCollapsed}
      />

      <div className="main-area">
        {role === "user" && user?.email && (
          <WelcomeMailer
            email={user.email}
            openRequest={welcomeMailerOpenRequest}
          />
        )}

        <Header
          role={role}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={
            handleToggleSidebar
          }
          onLogout={handleLogout}
        />

        {storageError && (
          <div
            className="global-error"
            role="alert"
          >
            <span>
              {storageError}
            </span>

            <button
              className="icon-button"
              type="button"
              onClick={
                clearStorageError
              }
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <main
          className="page-content"
          id="main-content"
          ref={mainContentRef}
        >
          <Outlet
            context={{
              openWelcomeMailer: handleOpenWelcomeMailer,
            }}
          />
        </main>
      </div>
    </div>
  );
}