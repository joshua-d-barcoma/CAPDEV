import { Component } from '@angular/core';

type ActionStatus = 'Open' | 'In Progress' | 'Done';
type ActionPriority = 'High' | 'Medium' | 'Low';

interface ActionItem {
  title: string;
  description: string;
  category: string;
  owner: string;
  due: string;
  priority: ActionPriority;
  status: ActionStatus;
}

@Component({
  imports: [],
  selector: 'app-action-items',
  styleUrl: './action-items.scss',
  templateUrl: './action-items.html',
})
export class ActionItems {
  filter: 'All' | 'Open' | 'Done' = 'All';

  readonly actionItems: ActionItem[] = [
    {
      title: 'Review overdue mandatory training',
      description: 'Follow up with three employees whose required training is overdue.',
      category: 'Learning',
      owner: 'Capability Development POC',
      due: 'Due today',
      priority: 'High',
      status: 'Open'
    },
    {
      title: 'Assign unallocated bench employees',
      description: 'Match two available employees with appropriate learning or internal work.',
      category: 'Assignment',
      owner: 'Bench Lead',
      due: 'Due today',
      priority: 'High',
      status: 'In Progress'
    },
    {
      title: 'Complete missing employee profile information',
      description: 'Collect capability, skill, or resume details for three bench profiles.',
      category: 'Profile',
      owner: 'Bench Management Team',
      due: 'Due tomorrow',
      priority: 'Medium',
      status: 'Open'
    },
    {
      title: 'Review deployment readiness',
      description: 'Validate the profiles of five employees approaching deployment readiness.',
      category: 'Deployment',
      owner: 'Deployment POC',
      due: 'Due this week',
      priority: 'Medium',
      status: 'Open'
    },
    {
      title: 'Consolidate training and certification plans',
      description: 'Collect current capability learning plans and certification needs.',
      category: 'Governance',
      owner: 'Capability Development Lead',
      due: 'Oct 16',
      priority: 'Medium',
      status: 'Done'
    },
    {
      title: 'Review attendance exceptions',
      description: 'Confirm next steps for employees with repeated attendance exceptions.',
      category: 'Attendance',
      owner: 'Bench Management Team',
      due: 'Oct 17',
      priority: 'High',
      status: 'Open'
    }
  ];

  get filteredActionItems(): ActionItem[] {
    if (this.filter === 'All') {
      return this.actionItems;
    }

    return this.actionItems.filter(item =>
      this.filter === 'Done'
        ? item.status === 'Done'
        : item.status !== 'Done'
    );
  }

  get openCount(): number {
    return this.actionItems.filter(item => item.status !== 'Done').length;
  }

  get highPriorityCount(): number {
    return this.actionItems.filter(
      item => item.priority === 'High' && item.status !== 'Done'
    ).length;
  }

  get dueTodayCount(): number {
    return this.actionItems.filter(
      item => item.due === 'Due today' && item.status !== 'Done'
    ).length;
  }

  setFilter(filter: 'All' | 'Open' | 'Done'): void {
    this.filter = filter;
  }

  updateStatus(item: ActionItem, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      switch (target.value) {
        case 'Open':
        case 'In Progress':
        case 'Done':
          item.status = target.value;
          break;
      }
    }
  }
}
