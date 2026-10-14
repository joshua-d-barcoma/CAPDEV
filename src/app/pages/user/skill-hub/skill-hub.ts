import { Component } from '@angular/core';

interface ReadinessItem {
  title: string;
  description: string;
  complete: boolean;
}

interface SkillProficiency {
  name: string;
  level: string;
  score: number;
}

interface Certification {
  name: string;
  detail: string;
  status: 'Completed' | 'In Progress' | 'Recommended';
}

interface Cohort {
  name: string;
  focus: string;
  duration: string;
  joined: boolean;
}

@Component({
  imports: [],
  selector: 'app-skill-hub',
  styleUrl: './skill-hub.scss',
  templateUrl: './skill-hub.html',
})
export class SkillHub {
  readonly readinessItems: ReadinessItem[] = [
    { title: 'Refresh your professional profile', description: 'Keep your experience and contact details current.', complete: true },
    { title: 'Validate primary skills and proficiency', description: 'Ensure your capability profile reflects your current skills.', complete: true },
    { title: 'Upload an interview-ready resume', description: 'Use your latest approved resume version.', complete: true },
    { title: 'Complete required learning', description: 'Finish mandatory training assigned to your role.', complete: false },
    { title: 'Review deployment preferences', description: 'Confirm your target roles and availability with your lead.', complete: false }
  ];

  readonly proficiencies: SkillProficiency[] = [
    { name: 'Cloud engineering', level: 'Working proficiency', score: 72 },
    { name: 'Infrastructure automation', level: 'Developing', score: 54 },
    { name: 'Linux administration', level: 'Working proficiency', score: 68 },
    { name: 'Python', level: 'Developing', score: 46 }
  ];

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

  readonly announcements = [
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

  readonly contacts = [
    { concern: 'Attendance, roster, and RTO', owner: 'Bench Management Team' },
    { concern: 'Learning, certifications, and mentoring', owner: 'Capability Development POC' },
    { concern: 'Day-to-day support and engagement', owner: 'Bench Lead' },
    { concern: 'Interviews and deployment', owner: 'Talent Fulfillment / TFS' },
    { concern: 'Talent or employee relations concerns', owner: 'HR Partner' }
  ];

  get readinessScore(): number {
    if (!this.readinessItems.length) {
      return 0;
    }

    return Math.round(
      (this.completedReadinessItems / this.readinessItems.length) * 100
    );
  }

  get completedReadinessItems(): number {
    return this.readinessItems.filter(item => item.complete).length;
  }

  toggleReadiness(item: ReadinessItem, event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      item.complete = input.checked;
    }
  }

  toggleCohort(cohort: Cohort): void {
    cohort.joined = !cohort.joined;
  }

  requestCertification(certification: Certification): void {
    if (certification.status === 'Recommended') {
      certification.status = 'In Progress';
      certification.detail = 'Voucher request submitted';
    }
  }

  getScoreWidth(score: number): number {
    return Math.min(Math.max(score, 0), 100);
  }
}
