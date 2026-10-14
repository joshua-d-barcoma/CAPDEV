import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type ViewMode = 'day' | 'week' | 'month';

interface AttendanceData {
  label: string;
  present: number;
  sick: number;
  vacation: number;
  absent: number;
}

interface ActionItem {
  title: string;
  description: string;
  type: string;
  priority: 'High' | 'Medium';
  due: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  readonly Math = Math;

  viewMode: ViewMode = 'day';

  // Summary
  totalEmployees = 86;
  presentToday = 79;
  sickToday = 2;
  vacationToday = 3;
  absentToday = 2;
  activeNonCompliance = 1;
  readyForDeployment = 24;
  capabilityBuilding = 38;
  rtoCompliance = 82;

  // Daily Attendance
  dayData: AttendanceData[] = [
    {
      label: 'Mon',
      present: 78,
      sick: 2,
      vacation: 4,
      absent: 2
    },
    {
      label: 'Tue',
      present: 81,
      sick: 1,
      vacation: 2,
      absent: 2
    },
    {
      label: 'Wed',
      present: 79,
      sick: 2,
      vacation: 3,
      absent: 2
    },
    {
      label: 'Thu',
      present: 82,
      sick: 1,
      vacation: 2,
      absent: 1
    },
    {
      label: 'Fri',
      present: 79,
      sick: 2,
      vacation: 3,
      absent: 2
    }
  ];

  // Weekly Attendance
  weekData: AttendanceData[] = [
    {
      label: 'W1',
      present: 78,
      sick: 2,
      vacation: 4,
      absent: 2
    },
    {
      label: 'W2',
      present: 80,
      sick: 2,
      vacation: 2,
      absent: 2
    },
    {
      label: 'W3',
      present: 81,
      sick: 1,
      vacation: 3,
      absent: 1
    },
    {
      label: 'W4',
      present: 79,
      sick: 2,
      vacation: 3,
      absent: 2
    }
  ];

  // Monthly Attendance
  monthData: AttendanceData[] = [
    {
      label: 'Jan',
      present: 78,
      sick: 3,
      vacation: 3,
      absent: 2
    },
    {
      label: 'Feb',
      present: 80,
      sick: 2,
      vacation: 3,
      absent: 1
    },
    {
      label: 'Mar',
      present: 79,
      sick: 2,
      vacation: 4,
      absent: 1
    },
    {
      label: 'Apr',
      present: 81,
      sick: 1,
      vacation: 3,
      absent: 1
    },
    {
      label: 'May',
      present: 82,
      sick: 1,
      vacation: 2,
      absent: 1
    },
    {
      label: 'Jun',
      present: 80,
      sick: 2,
      vacation: 3,
      absent: 1
    }
  ];

  // Action Items
  actionItems: ActionItem[] = [
    {
      title: 'Review overdue training',
      description: '3 bench employees have overdue required training.',
      type: 'Training',
      priority: 'High',
      due: 'Due today'
    },
    {
      title: 'Assign unassigned employees',
      description: '2 employees are currently without an assigned task.',
      type: 'Assignment',
      priority: 'High',
      due: 'Due today'
    },
    {
      title: 'Update employee profiles',
      description: '3 profiles are missing required information.',
      type: 'Profile',
      priority: 'Medium',
      due: 'Due tomorrow'
    },
    {
      title: 'Review deployment readiness',
      description: '5 employees are approaching deployment readiness.',
      type: 'Deployment',
      priority: 'Medium',
      due: 'Due this week'
    }
  ];

  get attendancePercentage(): number {
    return Math.round(
      (this.presentToday / this.totalEmployees) * 100
    );
  }

  get activeNonCompliancePercentage(): number {
    return Math.round(
      (this.activeNonCompliance / this.totalEmployees) * 100
    );
  }

  get currentData(): AttendanceData[] {
    switch (this.viewMode) {
      case 'week':
        return this.weekData;

      case 'month':
        return this.monthData;

      default:
        return this.dayData;
    }
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  getMaxValue(): number {
    return this.totalEmployees;
  }

  getX(index: number): number {
    const chartWidth = 720;

    if (this.currentData.length === 1) {
      return chartWidth / 2;
    }

    return (
      (index / (this.currentData.length - 1)) *
      chartWidth
    );
  }

  getY(value: number): number {
    const chartHeight = 220;
    const chartTop = 20;

    return (
      chartTop +
      chartHeight -
      (value / this.getMaxValue()) * chartHeight
    );
  }

  getPoints(key: keyof AttendanceData): string {
    return this.currentData
      .map((item, index) => {
        return `${this.getX(index)},${this.getY(item[key] as number)}`;
      })
      .join(' ');
  }
}