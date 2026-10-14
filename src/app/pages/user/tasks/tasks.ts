import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

interface Task {
  title: string;
  description: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  status: TaskStatus;
}

interface Recommendation {
  title: string;
  description: string;
  type: 'Upskill' | 'Cross-skill';
  duration: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks {
  mandatoryTasks: Task[] = [
    {
      title: 'Security Awareness',
      description: 'Complete the required annual security awareness training.',
      due: 'Due Oct 5',
      priority: 'High',
      status: 'Completed'
    },
    {
      title: 'Data Privacy & Protection',
      description: 'Complete the mandatory data privacy training.',
      due: 'Due Oct 7',
      priority: 'High',
      status: 'In Progress'
    },
    {
      title: 'Workplace Safety',
      description: 'Complete the required workplace safety training.',
      due: 'Due Oct 15',
      priority: 'Medium',
      status: 'Not Started'
    }
  ];

  otherTasks: Task[] = [
    {
      title: 'Update technical profile',
      description: 'Review and update your current skills and capability information.',
      due: 'Due today',
      priority: 'High',
      status: 'In Progress'
    },
    {
      title: 'Complete Azure fundamentals',
      description: 'Strengthen foundational Azure knowledge.',
      due: 'Due Oct 8',
      priority: 'Medium',
      status: 'In Progress'
    },
    {
      title: 'Review project requirements',
      description: 'Review the requirements for the upcoming project assignment.',
      due: 'Due Oct 10',
      priority: 'Low',
      status: 'Not Started'
    },
    {
      title: 'Submit updated resume',
      description: 'Upload the latest version of your professional resume.',
      due: 'Due Oct 12',
      priority: 'Medium',
      status: 'Completed'
    }
  ];

  recommendations: Recommendation[] = [
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

  get allTasks(): Task[] {
    return [
      ...this.mandatoryTasks,
      ...this.otherTasks
    ];
  }

  get completedTasks(): number {
    return this.allTasks.filter(
      task => task.status === 'Completed'
    ).length;
  }

  get inProgressTasks(): number {
    return this.allTasks.filter(
      task => task.status === 'In Progress'
    ).length;
  }

  get notStartedTasks(): number {
    return this.allTasks.filter(
      task => task.status === 'Not Started'
    ).length;
  }

  updateTaskStatus(
    task: Task,
    status: TaskStatus
  ): void {
    task.status = status;
  }

}