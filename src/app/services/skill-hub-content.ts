import { Injectable } from '@angular/core';

export interface Certification {
  name: string;
  detail: string;
  status: 'Completed' | 'In Progress' | 'Recommended';
}

export interface Cohort {
  name: string;
  focus: string;
  duration: string;
  joined: boolean;
}

export interface Announcement {
  title: string;
  description: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class SkillHubContent {
  readonly certifications: Certification[] = [
    { name: 'Cloud Fundamentals', detail: 'Passed · Sep 2026', status: 'Completed' },
    { name: 'Cloud Architecture Associate', detail: 'Learning path in progress', status: 'In Progress' },
    { name: 'Infrastructure Automation', detail: 'Recommended for your capability', status: 'Recommended' }
  ];

  readonly cohorts: Cohort[] = [
    { name: 'Cloud Elite', focus: 'Cloud engineering and operations missions', duration: '6-week mission', joined: true },
    { name: 'Automation Mission', focus: 'Build reusable infrastructure automation', duration: '4-week mission', joined: false },
    { name: 'Deployment Readiness Circle', focus: 'Practice technical interviews and profile reviews', duration: 'Weekly sessions', joined: false }
  ];

  readonly announcements: Announcement[] = [
    {
      title: 'Onsite schedule reminder',
      description: 'Follow the current team RTO schedule and reserve your office seat in advance.',
      type: 'Attendance'
    },
    {
      title: 'Keep your skills profile current',
      description: 'Review your primary skill mapping and update completed certifications.',
      type: 'Profile'
    },
    {
      title: 'Bench learning opportunities',
      description: 'Ask your Capability POC about current cohort missions and mentoring sessions.',
      type: 'Learning'
    }
  ];
}
