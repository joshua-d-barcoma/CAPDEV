// =====================================================
// Learning
// =====================================================

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkillHubContent } from '../../../services/skill-hub-content';

interface Achievement {
  employee: string;
  title: string;
  description: string;
  date: string;
  type: 'Training' | 'Certification' | 'Learning';
}

interface Completion {
  employee: string;
  completed: number;
  total: number;
}

interface Employee {
  name: string;
  capability: string;
  lastActivity: string;
}

interface MandatoryTraining {
  id: number;
  title: string;
  description: string;
  due: string;
  assigned: number;
  completed: number;
  status: 'Active' | 'Draft';
}

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './learning.html',
  styleUrl: './learning.scss'
})
export class Learning {
  readonly skillHubContent = inject(SkillHubContent);
  certificationFormVisible = false;
  cohortFormVisible = false;
  announcementFormVisible = false;
  certificationDraft = { name: '', detail: '' };
  cohortDraft = { name: '', focus: '', duration: '' };
  announcementDraft: { title: string; description: string; type: 'Attendance' | 'Profile' | 'Learning' } = {
    title: '',
    description: '',
    type: 'Learning'
  };

  achievements: Achievement[] = [
    {
      employee: 'Alex Santos',
      title: 'Security Awareness',
      description: 'Completed mandatory security awareness training.',
      date: 'Today, 9:14 AM',
      type: 'Training'
    },
    {
      employee: 'Maria Cruz',
      title: 'Azure Fundamentals',
      description: 'Completed Azure Fundamentals learning path.',
      date: 'Today, 8:42 AM',
      type: 'Certification'
    },
    {
      employee: 'Michael Tan',
      title: 'Cloud Migration Workshop',
      description: 'Completed the Cloud Migration workshop.',
      date: 'Yesterday, 4:18 PM',
      type: 'Learning'
    },
    {
      employee: 'Nicole Lim',
      title: 'Data Privacy & Protection',
      description: 'Completed mandatory data privacy training.',
      date: 'Yesterday, 2:35 PM',
      type: 'Training'
    }
  ];

  completionStats: Completion[] = [
    {
      employee: 'Alex Santos',
      completed: 4,
      total: 5
    },
    {
      employee: 'Maria Cruz',
      completed: 5,
      total: 5
    },
    {
      employee: 'Michael Tan',
      completed: 3,
      total: 4
    },
    {
      employee: 'Nicole Lim',
      completed: 4,
      total: 6
    },
    {
      employee: 'Sarah Garcia',
      completed: 2,
      total: 5
    }
  ];

  employeesWithoutTasks: Employee[] = [
    {
      name: 'John Reyes',
      capability: 'Network',
      lastActivity: 'Oct 3'
    },
    {
      name: 'Karen Flores',
      capability: 'Software Engineering',
      lastActivity: 'Oct 2'
    },
    {
      name: 'Daniel Ramos',
      capability: 'Data & AI',
      lastActivity: 'Sep 30'
    }
  ];

  mandatoryTrainings: MandatoryTraining[] = [
    {
      id: 1,
      title: 'Security Awareness',
      description: 'Annual security awareness and information security training.',
      due: 'Oct 15',
      assigned: 86,
      completed: 72,
      status: 'Active'
    },
    {
      id: 2,
      title: 'Data Privacy & Protection',
      description: 'Mandatory data privacy and protection training.',
      due: 'Oct 20',
      assigned: 86,
      completed: 58,
      status: 'Active'
    },
    {
      id: 3,
      title: 'Workplace Safety',
      description: 'Workplace safety policies and required procedures.',
      due: 'Oct 30',
      assigned: 86,
      completed: 41,
      status: 'Active'
    },
    {
      id: 4,
      title: 'Responsible AI Awareness',
      description: 'Introduction to responsible and secure AI usage.',
      due: 'Nov 5',
      assigned: 86,
      completed: 0,
      status: 'Draft'
    }
  ];

  get totalCompleted(): number {
    return this.completionStats.reduce(
      (total, item) => total + item.completed,
      0
    );
  }

  get totalAssigned(): number {
    return this.completionStats.reduce(
      (total, item) => total + item.total,
      0
    );
  }

  get completionRate(): number {
    if (!this.totalAssigned) {
      return 0;
    }

    return Math.round(
      (this.totalCompleted / this.totalAssigned) * 100
    );
  }

  getCompletionPercentage(item: Completion): number {
    if (!item.total) {
      return 0;
    }

    return Math.round(
      (item.completed / item.total) * 100
    );
  }

  getTrainingPercentage(training: MandatoryTraining): number {
    if (!training.assigned) {
      return 0;
    }

    return Math.round(
      (training.completed / training.assigned) * 100
    );
  }

  addTraining(): void {
    console.log('Add mandatory training');
  }

  editTraining(training: MandatoryTraining): void {
    console.log('Edit training:', training.title);
  }

  addCertification(): void {
    const name = this.certificationDraft.name.trim();
    const detail = this.certificationDraft.detail.trim();
    if (!name || !detail) {
      return;
    }

    this.skillHubContent.certifications.push({
      name,
      detail,
      status: 'Recommended'
    });
    this.certificationDraft = { name: '', detail: '' };
    this.certificationFormVisible = false;
  }

  addCohort(): void {
    const name = this.cohortDraft.name.trim();
    const focus = this.cohortDraft.focus.trim();
    const duration = this.cohortDraft.duration.trim();
    if (!name || !focus || !duration) {
      return;
    }

    this.skillHubContent.cohorts.push({ name, focus, duration, joined: false });
    this.cohortDraft = { name: '', focus: '', duration: '' };
    this.cohortFormVisible = false;
  }

  addAnnouncement(): void {
    const title = this.announcementDraft.title.trim();
    const description = this.announcementDraft.description.trim();
    if (!title || !description) {
      return;
    }

    this.skillHubContent.announcements.push({
      title,
      description,
      type: this.announcementDraft.type
    });
    this.announcementDraft = { title: '', description: '', type: 'Learning' };
    this.announcementFormVisible = false;
  }
}