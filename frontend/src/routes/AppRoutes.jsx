import {
  lazy,
  Suspense,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "../components/AppLayout.jsx";

import {
  DEFAULT_ROUTE,
  ROUTES,
} from "../constants/routes.js";

import {
  getSessionUser,
  getUserRole,
} from "../utils/auth.js";

const LoginPage = lazy(() =>
  import("../pages/LoginPage.jsx")
);

const AdminDashboard = lazy(() =>
  import("../pages/AdminDashboard.jsx")
);

const EmployeesPage = lazy(() =>
  import("../pages/EmployeesPage.jsx")
);

const EmployeeImportHistoryPage = lazy(() =>
  import("../pages/EmployeeImportHistoryPage.jsx")
);

const AttendancePage = lazy(() =>
  import("../pages/AttendancePage.jsx")
);

const LearningPage = lazy(() =>
  import("../pages/LearningPage.jsx")
);

const ProductivityPage = lazy(() =>
  import("../pages/ProductivityPage.jsx")
);

const ActionItemsPage = lazy(() =>
  import("../pages/ActionItemsPage.jsx")
);

const EmployeeProfilePage = lazy(() =>
  import("../pages/EmployeeProfilePage.jsx")
);

const UserDashboard = lazy(() =>
  import("../pages/UserDashboard.jsx")
);

const TasksPage = lazy(() =>
  import("../pages/TasksPage.jsx")
);

const TimeEntryPage = lazy(() =>
  import("../pages/TimeEntryPage.jsx")
);

const HistoryPage = lazy(() =>
  import("../pages/HistoryPage.jsx")
);

const CalendarPage = lazy(() =>
  import("../pages/CalendarPage.jsx")
);

const SkillHubPage = lazy(() =>
  import("../pages/SkillHubPage.jsx")
);

function PageLoading() {
  return (
    <div
      className="loading-state"
      role="status"
    >
      <span className="loading-spinner" />

      Loading page...
    </div>
  );
}

function getDashboardRoute(role) {
  return role === "admin"
    ? ROUTES.adminDashboard
    : ROUTES.userDashboard;
}

function PublicOnlyRoute({ children }) {
  const user = getSessionUser();

  if (!user) {
    return children;
  }

  const role = getUserRole(user);

  return (
    <Navigate
      to={getDashboardRoute(role)}
      replace
    />
  );
}

function ProtectedRoute({
  allowedRole,
  children,
}) {
  const user = getSessionUser();

  if (!user) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
      />
    );
  }

  const role = getUserRole(user);

  if (role !== allowedRole) {
    return (
      <Navigate
        to={getDashboardRoute(role)}
        replace
      />
    );
  }

  return children;
}

function RootRedirect() {
  const user = getSessionUser();

  if (!user) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
      />
    );
  }

  const role = getUserRole(user);

  return (
    <Navigate
      to={getDashboardRoute(role)}
      replace
    />
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public login page */}
        <Route
          path={ROUTES.login}
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="admin">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.adminDashboard}
            element={<AdminDashboard />}
          />

          <Route
            path={ROUTES.employees}
            element={<EmployeesPage />}
          />

          <Route
            path={ROUTES.employeeImportHistory}
            element={<EmployeeImportHistoryPage />}
          />

          <Route
            path={ROUTES.employeeImportHistoryEntry}
            element={<EmployeeImportHistoryPage />}
          />

          <Route
            path={ROUTES.employee}
            element={<EmployeeProfilePage />}
          />

          <Route
            path={ROUTES.attendance}
            element={<AttendancePage />}
          />

          <Route
            path={ROUTES.learning}
            element={<LearningPage />}
          />

          <Route
            path={ROUTES.productivity}
            element={<ProductivityPage />}
          />

          <Route
            path={ROUTES.actionItems}
            element={<ActionItemsPage />}
          />
        </Route>

        {/* User-only routes */}
        <Route
          element={
            <ProtectedRoute allowedRole="user">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.userDashboard}
            element={<UserDashboard />}
          />

          <Route
            path={ROUTES.tasks}
            element={<TasksPage />}
          />

          <Route
            path={ROUTES.timeIn}
            element={<TimeEntryPage />}
          />

          <Route
            path={ROUTES.timeOut}
            element={<TimeEntryPage />}
          />

          <Route
            path={ROUTES.history}
            element={<HistoryPage />}
          />

          <Route
            path={ROUTES.calendar}
            element={<CalendarPage />}
          />

          <Route
            path={ROUTES.skillHub}
            element={<SkillHubPage />}
          />
        </Route>

        {/* Root route */}
        <Route
          path="/"
          element={<RootRedirect />}
        />

        {/* Invalid or unknown routes */}
        <Route
          path="*"
          element={<Navigate to={DEFAULT_ROUTE} replace />}
        />
      </Routes>
    </Suspense>
  );
}