import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeDirectory } from '../../../services/employee-directory';
import { EmployeeRto, RtoChangeRequest, RtoDay } from '../../../services/employee-rto';

interface DashboardTask {
  title: string;
  category: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed';
}

interface DashboardTraining {
  title: string;
  due: string;
  progress: number;
  required: boolean;
}

interface DevelopmentRecommendation {
  title: string;
  description: string;
  type: 'Upskill' | 'Cross-skill';
  duration: string;
}

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './employee-view.html',
  styleUrl: './employee-view.scss'
})
export class EmployeeView {
  private readonly route = inject(ActivatedRoute);
  private readonly directory = inject(EmployeeDirectory);
  readonly rto = inject(EmployeeRto);
  readonly employee = this.directory.findByName(
    this.route.snapshot.paramMap.get('employeeName') ?? ''
  );
  readonly benchDays = 51;
  readonly rtoAttendance = '3/4';
  readonly deploymentReadiness = 60;
  readonly timeIn = '08:42 AM';
  readonly timeOut = '--:--';
  readonly latestCompletion = {
    title: 'Completed Security Awareness',
    description: 'Mandatory training completed successfully.',
    date: 'Completed today',
    type: 'Training'
  };
  readonly trainings: DashboardTraining[] = [
    { title: 'Security Awareness', due: 'Completed', progress: 100, required: true },
    { title: 'Data Privacy & Protection', due: 'Due Oct 7', progress: 60, required: true },
    { title: 'Workplace Safety', due: 'Due Oct 15', progress: 0, required: true }
  ];
  readonly tasks: DashboardTask[] = [
    {
      title: 'Update technical profile',
      category: 'Profile',
      due: 'Due today',
      priority: 'High',
      status: 'In Progress'
    },
    {
      title: 'Complete Azure fundamentals',
      category: 'Upskill',
      due: 'Due Oct 8',
      priority: 'Medium',
      status: 'In Progress'
    },
    {
      title: 'Review project requirements',
      category: 'Assignment',
      due: 'Due Oct 10',
      priority: 'Low',
      status: 'Not Started'
    },
    {
      title: 'Complete Security Awareness',
      category: 'Training',
      due: 'Completed today',
      priority: 'High',
      status: 'Completed'
    }
  ];
  readonly recommendations: DevelopmentRecommendation[] = [
    {
      title: 'Cloud Fundamentals',
      description: 'Build foundational cloud skills to improve deployment readiness.',
      type: 'Upskill',
      duration: '4 hours'
    },
    {
      title: 'Cybersecurity Basics',
      description: 'Develop security knowledge that complements your current skill set.',
      type: 'Cross-skill',
      duration: '3 hours'
    },
    {
      title: 'Agile Project Management',
      description: 'Strengthen collaboration and project delivery skills.',
      type: 'Cross-skill',
      duration: '5 hours'
    }
  ];
  scheduleEditing = false;
  scheduleDraft: RtoDay[] = this.employee
    ? this.rto.getSchedule(this.employee.name).map(day => ({ ...day }))
    : [];

  get pendingRequest(): RtoChangeRequest | undefined {
    if (!this.employee) {
      return undefined;
    }

    return this.rto.requests.find(request =>
      request.employeeName === this.employee?.name && request.status === 'Pending'
    );
  }

  get completedTrainingCount(): number {
    return this.trainings.filter(training => training.progress === 100).length;
  }

  get firstName(): string {
    return this.employee?.name.split(' ')[0] ?? '';
  }

  get trainingProgress(): number {
    if (!this.trainings.length) {
      return 0;
    }

    return Math.round(
      this.trainings.reduce((total, training) => total + training.progress, 0) /
      this.trainings.length
    );
  }

  get completedTaskCount(): number {
    return this.tasks.filter(task => task.status === 'Completed').length;
  }

  startScheduleEdit(): void {
    if (!this.employee) {
      return;
    }

    this.scheduleDraft = this.rto.getSchedule(this.employee.name)
      .map(day => ({ ...day }));
    this.scheduleEditing = true;
  }

  saveSchedule(): void {
    if (!this.employee) {
      return;
    }

    this.rto.updateSchedule(this.employee.name, this.scheduleDraft);
    this.scheduleEditing = false;
  }

  reviewRequest(request: RtoChangeRequest, approved: boolean): void {
    if (approved) {
      this.rto.approveRequest(request);
      this.scheduleDraft = this.rto.getSchedule(request.employeeName)
        .map(day => ({ ...day }));
      return;
    }

    this.rto.rejectRequest(request);
  }
}
