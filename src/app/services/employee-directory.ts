import { Injectable } from '@angular/core';

export type AttendanceStatus =
  | 'Present'
  | 'Sick Leave'
  | 'Vacation Leave'
  | 'Unapproved Absence';

export type WorkLocation = 'Manila' | 'Cebu';

export interface Employee {
  name: string;
  careerLevel: string;
  workLocation: WorkLocation;
  capability: string;
  skills: string[];
  attendanceStatus: AttendanceStatus;
  absenceDays: number;
  joiningDate: string;
  rollInDate: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeDirectory {
  readonly employees: Employee[] = [
    {
      name: 'Alex Santos',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'SRE / Hybrid Cloud',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Python'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2020-02-10',
      rollInDate: '2026-07-14'
    },
    {
      name: 'Maria Cruz',
      careerLevel: 'CL7',
      workLocation: 'Cebu',
      capability: 'Cloud Customer Edge',
      skills: ['Azure', 'Networking', 'Terraform'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05'
    },
    {
      name: 'John Reyes',
      careerLevel: 'CL6',
      workLocation: 'Manila',
      capability: 'Network',
      skills: ['Routing', 'Switching', 'Cisco'],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 1,
      joiningDate: '2021-11-01',
      rollInDate: '2026-09-10'
    },
    {
      name: 'Sarah Garcia',
      careerLevel: 'CL9',
      workLocation: 'Cebu',
      capability: 'Hybrid Cloud - Operations',
      skills: ['AWS', 'Linux', 'Kubernetes', 'Docker'],
      attendanceStatus: 'Unapproved Absence',
      absenceDays: 3,
      joiningDate: '2019-04-15',
      rollInDate: '2026-06-20'
    },
    {
      name: 'Michael Tan',
      careerLevel: 'CL8',
      workLocation: 'Manila',
      capability: 'Hybrid Cloud - Migration',
      skills: ['Azure', 'Migration', 'Terraform'],
      attendanceStatus: 'Present',
      absenceDays: 0,
      joiningDate: '2023-01-09',
      rollInDate: '2026-09-25'
    },
    {
      name: 'Nicole Lim',
      careerLevel: 'CL5',
      workLocation: 'Cebu',
      capability: 'Service Management',
      skills: ['ITIL', 'ServiceNow', 'Incident Management'],
      attendanceStatus: 'Vacation Leave',
      absenceDays: 0,
      joiningDate: '2020-08-31',
      rollInDate: '2026-10-01'
    }
  ];

  findByName(name: string): Employee | undefined {
    return this.employees.find(employee => employee.name === name);
  }
}
