import { Component, inject } from '@angular/core';
import {
  Certification,
  Cohort,
  SkillHubContent
} from '../../../services/skill-hub-content';

interface ReadinessItem {
  title: string;
  description: string;
  complete: boolean;
}

interface SkillProficiency {
  name: string;
  level: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
}

@Component({
  imports: [],
  selector: 'app-skill-hub',
  styleUrl: './skill-hub.scss',
  templateUrl: './skill-hub.html',
})
export class SkillHub {
  readonly content = inject(SkillHubContent);

  readonly readinessItems: ReadinessItem[] = [
    { title: 'Refresh your professional profile', description: 'Keep your experience and contact details current.', complete: true },
    { title: 'Validate primary skills and proficiency', description: 'Ensure your capability profile reflects your current skills.', complete: true },
    { title: 'Upload an interview-ready resume', description: 'Use your latest approved resume version.', complete: true },
    { title: 'Complete required learning', description: 'Finish mandatory training assigned to your role.', complete: false },
    { title: 'Review deployment preferences', description: 'Confirm your target roles and availability with your lead.', complete: false }
  ];

  readonly proficiencies: SkillProficiency[] = [
    { name: 'Cloud engineering', level: 'P2' },
    { name: 'Infrastructure automation', level: 'P1' },
    { name: 'Linux administration', level: 'P2' },
    { name: 'Python', level: 'P1' }
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

}
