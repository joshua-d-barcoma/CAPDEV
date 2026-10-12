import { Component, Input } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.scss'
})
export class SideBar {
  @Input() collapsed = false;
  @Input() role: 'admin' | 'user' = 'admin';

  adminMenu: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'grid'
    },
    {
      label: 'Resources',
      route: '/resources',
      icon: 'user'
    },
    {
      label: 'Attendance',
      route: '/attendance',
      icon: 'calendar'
    },
    {
      label: 'Learning',
      route: '/learning',
      icon: 'diamond'
    },
    {
      label: 'Action Items',
      route: '/action-items',
      icon: 'flag'
    }
  ];

  userMenu: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/user/dashboard',
      icon: 'grid'
    },
    {
      label: 'Tasks',
      route: '/user/tasks',
      icon: 'check'
    },
    {
      label: 'Skill Hub',
      route: '/user/skill-hub',
      icon: 'cap'
    },
    {
      label: 'Time In',
      route: '/user/time-in',
      icon: 'clock'
    },
    {
      label: 'Time Out',
      route: '/user/time-out',
      icon: 'clock-out'
    },
    {
      label: 'History',
      route: '/user/history',
      icon: 'calendar'
    }
  ];

  get menuItems(): MenuItem[] {
    return this.role === 'admin'
      ? this.adminMenu
      : this.userMenu;
  }

  get roleLabel(): string {
    return this.role === 'admin'
      ? 'Admin / Bench Lead'
      : 'User / Bench Resource';
  }
}