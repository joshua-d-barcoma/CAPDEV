import { Component } from '@angular/core';

interface Task {
  title: string;
  category: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed';
}

interface Training {
  title: string;
  due: string;
  progress: number;
  required: boolean;
}

interface Recommendation {
  title: string;
  description: string;
  type: 'Upskill' | 'Cross-skill';
  duration: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class UserDashboard {
  profile = {
    name: 'Alex Santos',
    role: 'Bench Resource',
    capability: 'SRE / Hybrid Cloud',
    careerLevel: 'CL8',
    profileImage: 'assets/images/profile-placeholder.jpg',
    skills: [
      'AWS',
      'Azure',
      'Kubernetes',
      'Terraform',
      'Python'
    ]
  };

  timeIn = '08:42 AM';
  timeOut = '--:--';
  readonly rtoAttendance = '3/4';
  readonly deploymentReadiness = 60;

  latestCompletion = {
    title: 'Completed Security Awareness',
    description: 'Mandatory training completed successfully.',
    date: 'Completed today',
    type: 'Training'
  };

  tasks: Task[] = [
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

  trainings: Training[] = [
    {
      title: 'Security Awareness',
      due: 'Completed',
      progress: 100,
      required: true
    },
    {
      title: 'Data Privacy & Protection',
      due: 'Due Oct 7',
      progress: 60,
      required: true
    },
    {
      title: 'Workplace Safety',
      due: 'Due Oct 15',
      progress: 0,
      required: true
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

  getCompletedTrainingCount(): number {
    return this.trainings.filter(
      training => training.progress === 100
    ).length;
  }

  getCompletedTaskCount(): number {
    return this.tasks.filter(task => task.status === 'Completed').length;
  }

  getTrainingProgress(): number {
    if (!this.trainings.length) {
      return 0;
    }

    const total = this.trainings.reduce(
      (sum, training) => sum + training.progress,
      0
    );

    return Math.round(total / this.trainings.length);
  }
}