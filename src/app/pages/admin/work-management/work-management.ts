import { Component } from '@angular/core';

interface CapabilityWorkload {
  capability: string;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

interface PendingTask {
  id: string;
  title: string;
  requestedBy: string;
  skill: string;
  effort: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  suggestedMatch: string;
  assigned: boolean;
}

@Component({
  imports: [],
  selector: 'app-work-management',
  styleUrl: './work-management.scss',
  templateUrl: './work-management.html',
})
export class WorkManagement {
  readonly capabilityWorkload: CapabilityWorkload[] = [
    { capability: 'Hybrid Cloud', completed: 18, inProgress: 12, notStarted: 5, overdue: 2 },
    { capability: 'Network', completed: 12, inProgress: 8, notStarted: 4, overdue: 1 },
    { capability: 'Security', completed: 10, inProgress: 7, notStarted: 3, overdue: 2 },
    { capability: 'Data & AI', completed: 9, inProgress: 6, notStarted: 4, overdue: 1 }
  ];

  readonly eodSubmissionRates = [
    { day: 'D-9', rate: 86 },
    { day: 'D-8', rate: 91 },
    { day: 'D-7', rate: 83 },
    { day: 'D-6', rate: 94 },
    { day: 'D-5', rate: 89 },
    { day: 'D-4', rate: 92 },
    { day: 'D-3', rate: 87 },
    { day: 'D-2', rate: 95 },
    { day: 'D-1', rate: 90 },
    { day: 'Today', rate: 78 }
  ];

  readonly productivityCategories = [
    { name: 'Capability building', hours: 126 },
    { name: 'Mandatory learning', hours: 94 },
    { name: 'Internal assignments', hours: 72 },
    { name: 'Deployment preparation', hours: 58 }
  ];

  readonly pendingTasks: PendingTask[] = [
    {
      id: 'BT-104',
      title: 'Cloud operations runbook review',
      requestedBy: 'Capability Lead',
      skill: 'AWS / Linux',
      effort: '8 hours',
      due: 'Oct 16',
      priority: 'High',
      suggestedMatch: 'Sarah Garcia',
      assigned: false
    },
    {
      id: 'BT-108',
      title: 'Network inventory validation',
      requestedBy: 'Delivery Lead',
      skill: 'Networking',
      effort: '4 hours',
      due: 'Oct 17',
      priority: 'Medium',
      suggestedMatch: 'John Reyes',
      assigned: false
    },
    {
      id: 'BT-111',
      title: 'Service management knowledge article',
      requestedBy: 'Service Management POC',
      skill: 'ITIL / ServiceNow',
      effort: '6 hours',
      due: 'Oct 20',
      priority: 'Low',
      suggestedMatch: 'Nicole Lim',
      assigned: false
    }
  ];

  get overdueTasks(): number {
    return this.capabilityWorkload.reduce(
      (total, item) => total + item.overdue,
      0
    );
  }

  get unassignedTasks(): number {
    return this.pendingTasks.filter(task => !task.assigned).length;
  }

  get completedTasks(): number {
    return this.capabilityWorkload.reduce(
      (total, item) => total + item.completed,
      0
    );
  }

  getCapabilityTotal(item: CapabilityWorkload): number {
    return item.completed + item.inProgress + item.notStarted + item.overdue;
  }

  getTaskStatusWidth(value: number, item: CapabilityWorkload): number {
    const total = this.getCapabilityTotal(item);
    return total ? (value / total) * 100 : 0;
  }

  getProductivityWidth(hours: number): number {
    const max = Math.max(...this.productivityCategories.map(item => item.hours));
    return max ? (hours / max) * 100 : 0;
  }

  assignTask(task: PendingTask): void {
    task.assigned = true;
  }

}
