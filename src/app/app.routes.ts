import { Routes } from '@angular/router';

export const routes: Routes = [
  // =====================================================
  // Admin
  // =====================================================

  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin/dashboard/dashboard')
        .then(m => m.Dashboard)
  },

  {
    path: 'resources',
    loadComponent: () =>
      import('./pages/admin/resources/resources')
        .then(m => m.Resources)
  },
  {
    path: 'admin/employees/:employeeName',
    loadComponent: () =>
      import('./pages/admin/employee-view/employee-view')
        .then(m => m.EmployeeView)
  },

  {
  path: 'attendance',
  loadComponent: () =>
    import('./pages/admin/attendance/attendance')
      .then(m => m.Attendance)
  },

  {
  path: 'learning',
  loadComponent: () =>
    import('./pages/admin/learning/learning')
      .then(m => m.Learning)
  },
  {
    path: 'admin/work-management',
    loadComponent: () =>
      import('./pages/admin/work-management/work-management')
        .then(m => m.WorkManagement)
  },
  {
    path: 'admin/action-items',
    loadComponent: () =>
      import('./pages/admin/action-items/action-items')
        .then(m => m.ActionItems)
  },
  // =====================================================
  // User
  // =====================================================
  {
    path: 'user/dashboard',
    loadComponent: () =>
      import('./pages/user/dashboard/dashboard')
        .then(m => m.UserDashboard)
  },

  {
    path: 'user/tasks',
    loadComponent: () =>
      import('./pages/user/tasks/tasks')
        .then(m => m.Tasks)
  },

  {
  path: 'user/time-in',
  loadComponent: () =>
    import('./pages/user/time-in/time-in')
      .then(m => m.TimeIn)
  },

  {
  path: 'user/time-out',
  loadComponent: () =>
    import('./pages/user/time-out/time-out')
      .then(m => m.TimeOut)
  },
  {
  path: 'user/history',
  loadComponent: () =>
    import('./pages/user/history/history')
      .then(m => m.History)
  },
  {
  path: 'user/calendar',
  loadComponent: () =>
    import('./pages/user/calendar/calendar')
      .then(m => m.Calendar)
  },
  {
    path: 'user/skill-hub',
    loadComponent: () =>
      import('./pages/user/skill-hub/skill-hub')
        .then(m => m.SkillHub)
  },
  // Default

  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'admin/dashboard'
  }
];