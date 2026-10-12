// =====================================================
// History
// =====================================================

import { Component } from '@angular/core';

type AttendanceStatus = 'Present' | 'On Leave' | 'Absent';

interface AttendanceRecord {
  date: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceStatus;
}

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History {
  attendanceRecords: AttendanceRecord[] = [
    {
      date: 'Oct 12, 2026',
      timeIn: '08:42 AM',
      timeOut: '05:31 PM',
      status: 'Present'
    },
    {
      date: 'Oct 9, 2026',
      timeIn: '08:55 AM',
      timeOut: '05:18 PM',
      status: 'Present'
    },
    {
      date: 'Oct 8, 2026',
      timeIn: 'On Leave',
      timeOut: '',
      status: 'On Leave'
    },
    {
      date: 'Oct 7, 2026',
      timeIn: '08:37 AM',
      timeOut: '05:42 PM',
      status: 'Present'
    },
    {
      date: 'Oct 6, 2026',
      timeIn: '',
      timeOut: '',
      status: 'Absent'
    },
    {
      date: 'Oct 5, 2026',
      timeIn: '09:02 AM',
      timeOut: '05:27 PM',
      status: 'Present'
    }
  ];

  get presentDays(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'Present'
    ).length;
  }

  get leaveDays(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'On Leave'
    ).length;
  }

  get absentDays(): number {
    return this.attendanceRecords.filter(
      record => record.status === 'Absent'
    ).length;
  }

  getHoursWorked(record: AttendanceRecord): string {
    if (
      record.status !== 'Present' ||
      !record.timeIn ||
      !record.timeOut
    ) {
      return '';
    }

    const start = this.parseTime(record.timeIn);
    const end = this.parseTime(record.timeOut);

    if (start === null || end === null) {
      return '';
    }

    let difference = end - start;

    if (difference < 0) {
      difference += 24 * 60;
    }

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    return `${hours}h ${minutes}m`;
  }

  private parseTime(time: string): number | null {
    const match = time.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!match) {
      return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }

    return hours * 60 + minutes;
  }
}