// =====================================================
// Attendance
// =====================================================

import { Component } from '@angular/core';
import {
  DateRangePicker,
  DateRangeValue
} from '../../../components/date-range-picker/date-range-picker';
import {
  DateRangeFilterChange,
  DateRangeFilterConfig,
  SearchFilters,
  SelectFilterChange,
  SelectFilterConfig
} from '../../../components/search-filters/search-filters';

type AttendanceStatus =
  | 'Present'
  | 'On Leave'
  | 'Absent';

interface AttendanceRecord {
  name: string;
  date: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceStatus;
  absenceDays: number;
  workLocation: 'Manila' | 'Cebu';
  careerLevel: string;
  capability: string;
  skills: string[];
  joiningDate: string;
  rollInDate: string;
}

interface RtoCapability {
  capability: string;
  compliant: number;
}

interface AttendanceException {
  name: string;
  capability: string;
  careerLevel: string;
  status: string;
  infractions: number;
  nextStep: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [DateRangePicker, SearchFilters],
  templateUrl: './attendance.html',
  styleUrl: './attendance.scss'
})
export class Attendance {
  totalBenchEmployees = 86;
  summaryPresentToday = 79;
  activeNonCompliance = 1;
  readonly rtoCompliance = 82;
  readonly rtoByCapability: RtoCapability[] = [
    { capability: 'Hybrid Cloud', compliant: 89 },
    { capability: 'Network', compliant: 82 },
    { capability: 'Security', compliant: 94 },
    { capability: 'Data & AI', compliant: 78 }
  ];

  readonly attendanceExceptions: AttendanceException[] = [
    {
      name: 'John Reyes',
      capability: 'Network',
      careerLevel: 'CL6',
      status: 'NCNS',
      infractions: 1,
      nextStep: 'Confirm leave or exception status'
    },
    {
      name: 'Sarah Garcia',
      capability: 'Hybrid Cloud - Operations',
      careerLevel: 'CL9',
      status: 'Unapproved absence',
      infractions: 3,
      nextStep: 'Bench lead review'
    },
    {
      name: 'Karen Flores',
      capability: 'Security',
      careerLevel: 'CL8',
      status: 'Late check-in',
      infractions: 2,
      nextStep: 'Review attendance pattern'
    }
  ];
  readonly todayDate = this.formatLocalDate(new Date());
  searchTerm = '';
  capabilityFilter = '';
  careerLevelFilter = '';
  skillFilter = '';
  attendanceFilter = '';
  workLocationFilter = '';
  attendanceDateFrom = '';
  attendanceDateTo = '';
  joiningDateFrom = '';
  joiningDateTo = '';
  rollInDateFrom = '';
  rollInDateTo = '';

  attendanceRecords: AttendanceRecord[] = [
    {
      name: 'Alex Santos',
      date: this.todayDate,
      timeIn: '08:42 AM',
      timeOut: '05:31 PM',
      status: 'Present',
      absenceDays: 0,
      workLocation: 'Manila',
      careerLevel: 'CL8',
      capability: 'SRE / Hybrid Cloud',
      skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform'],
      joiningDate: '2020-02-10',
      rollInDate: '2026-07-14'
    },
    {
      name: 'Maria Cruz',
      date: this.todayDate,
      timeIn: '08:55 AM',
      timeOut: '05:18 PM',
      status: 'Present',
      absenceDays: 0,
      workLocation: 'Cebu',
      careerLevel: 'CL7',
      capability: 'Cloud Customer Edge',
      skills: ['Azure', 'Networking', 'Terraform'],
      joiningDate: '2022-06-20',
      rollInDate: '2026-08-05'
    },
    {
      name: 'John Reyes',
      date: this.todayDate,
      timeIn: '',
      timeOut: '',
      status: 'Absent',
      absenceDays: 1,
      workLocation: 'Manila',
      careerLevel: 'CL6',
      capability: 'Network',
      skills: ['Routing', 'Switching', 'Cisco'],
      joiningDate: '2021-11-01',
      rollInDate: '2026-09-10'
    },
    {
      name: 'Sarah Garcia',
      date: this.todayDate,
      timeIn: 'On Leave',
      timeOut: '',
      status: 'On Leave',
      absenceDays: 0,
      workLocation: 'Cebu',
      careerLevel: 'CL9',
      capability: 'Hybrid Cloud - Operations',
      skills: ['AWS', 'Linux', 'Kubernetes', 'Docker'],
      joiningDate: '2019-04-15',
      rollInDate: '2026-06-20'
    },
    {
      name: 'Michael Tan',
      date: this.todayDate,
      timeIn: '08:37 AM',
      timeOut: '05:42 PM',
      status: 'Present',
      absenceDays: 0,
      workLocation: 'Manila',
      careerLevel: 'CL8',
      capability: 'Hybrid Cloud - Migration',
      skills: ['Azure', 'Migration', 'Terraform'],
      joiningDate: '2023-01-09',
      rollInDate: '2026-09-25'
    },
    {
      name: 'Nicole Lim',
      date: this.todayDate,
      timeIn: 'On Leave',
      timeOut: '',
      status: 'On Leave',
      absenceDays: 0,
      workLocation: 'Cebu',
      careerLevel: 'CL5',
      capability: 'Service Management',
      skills: ['ITIL', 'ServiceNow', 'Incident Management'],
      joiningDate: '2020-08-31',
      rollInDate: '2026-10-01'
    },
    {
      name: 'Daniel Ramos',
      date: this.todayDate,
      timeIn: '',
      timeOut: '',
      status: 'Absent',
      absenceDays: 3,
      workLocation: 'Manila',
      careerLevel: 'CL7',
      capability: 'Data & AI',
      skills: ['Python', 'SQL', 'Data'],
      joiningDate: '2021-03-08',
      rollInDate: '2026-06-11'
    },
    {
      name: 'Karen Flores',
      date: this.todayDate,
      timeIn: '09:02 AM',
      timeOut: '05:27 PM',
      status: 'Present',
      absenceDays: 0,
      workLocation: 'Cebu',
      careerLevel: 'CL8',
      capability: 'Security',
      skills: ['Security', 'Linux', 'Python'],
      joiningDate: '2018-07-16',
      rollInDate: '2026-09-02'
    }
  ];

  get filteredAttendanceRecords(): AttendanceRecord[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.attendanceRecords.filter(record =>
      (!query || [
        record.name,
        record.date,
        record.workLocation,
        record.careerLevel,
        record.capability,
        record.status,
        record.joiningDate,
        record.rollInDate,
        ...record.skills
      ].some(value => value.toLowerCase().includes(query))) &&
      (!this.capabilityFilter || record.capability === this.capabilityFilter) &&
      (!this.careerLevelFilter || record.careerLevel === this.careerLevelFilter) &&
      (!this.skillFilter || record.skills.includes(this.skillFilter)) &&
      (!this.attendanceFilter || record.status === this.attendanceFilter) &&
      (!this.workLocationFilter ||
        record.workLocation === this.workLocationFilter) &&
      this.isDateInRange(record.date, this.attendanceDateFrom, this.attendanceDateTo) &&
      this.isDateInRange(record.joiningDate, this.joiningDateFrom, this.joiningDateTo) &&
      this.isDateInRange(record.rollInDate, this.rollInDateFrom, this.rollInDateTo)
    );
  }

  get unapprovedAbsences(): AttendanceRecord[] {
    return this.attendanceRecords.filter(
      record => record.status === 'Absent'
    );
  }

  get criticalAbsences(): AttendanceRecord[] {
    return this.unapprovedAbsences.filter(
      record => record.absenceDays >= 3
    );
  }

  get presentToday(): number {
    return this.filteredAttendanceRecords.filter(
      record => record.status === 'Present'
    ).length;
  }

  get attendancePercentage(): number {
    if (!this.totalBenchEmployees) {
      return 0;
    }

    return Math.round(
      (this.summaryPresentToday / this.totalBenchEmployees) * 100
    );
  }

  get tardinessCount(): number {
    const onTimeCutoff = 9 * 60;

    return this.attendanceRecords.filter(record => {
      if (record.status !== 'Present') {
        return false;
      }

      const timeIn = this.parseTime(record.timeIn);

      return timeIn !== null && timeIn > onTimeCutoff;
    }).length;
  }

  getRtoBarWidth(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  get onLeaveToday(): number {
    return this.filteredAttendanceRecords.filter(
      record => record.status === 'On Leave'
    ).length;
  }

  get absentToday(): number {
    return this.filteredAttendanceRecords.filter(
      record => record.status === 'Absent'
    ).length;
  }

  get capabilityOptions(): string[] {
    return this.getSortedOptions(record => record.capability);
  }

  get careerLevelOptions(): string[] {
    return this.getSortedOptions(record => record.careerLevel);
  }

  get skillOptions(): string[] {
    return [...new Set(this.attendanceRecords.flatMap(record => record.skills))]
      .sort((a, b) => a.localeCompare(b));
  }

  get attendanceOptions(): AttendanceStatus[] {
    return [...new Set(this.attendanceRecords.map(record => record.status))]
      .sort((a, b) => a.localeCompare(b));
  }

  get workLocationOptions(): string[] {
    return this.getSortedOptions(record => record.workLocation);
  }

  get searchFilterOptions(): SelectFilterConfig[] {
    return [
      {
        key: 'capability',
        label: 'All Capabilities',
        options: this.capabilityOptions,
        value: this.capabilityFilter
      },
      {
        key: 'careerLevel',
        label: 'All Career Levels',
        options: this.careerLevelOptions,
        value: this.careerLevelFilter
      },
      {
        key: 'skill',
        label: 'All Skills',
        options: this.skillOptions,
        value: this.skillFilter
      },
      {
        key: 'attendance',
        label: 'All Attendance',
        options: this.attendanceOptions,
        value: this.attendanceFilter
      },
      {
        key: 'workLocation',
        label: 'All Locations',
        options: this.workLocationOptions,
        value: this.workLocationFilter
      }
    ];
  }

  get dateRangeFilterOptions(): DateRangeFilterConfig[] {
    return [
      {
        key: 'joining',
        label: 'Join date',
        startDate: this.joiningDateFrom,
        endDate: this.joiningDateTo
      },
      {
        key: 'rollIn',
        label: 'Roll-in date',
        startDate: this.rollInDateFrom,
        endDate: this.rollInDateTo
      }
    ];
  }

  updateSearchTerm(searchTerm: string): void {
    this.searchTerm = searchTerm;
  }

  updateSearchFilter(change: SelectFilterChange): void {
    switch (change.key) {
      case 'capability':
        this.capabilityFilter = change.value;
        break;
      case 'careerLevel':
        this.careerLevelFilter = change.value;
        break;
      case 'skill':
        this.skillFilter = change.value;
        break;
      case 'attendance':
        this.attendanceFilter = change.value;
        break;
      case 'workLocation':
        this.workLocationFilter = change.value;
        break;
    }
  }

  updateSearchDateRange(change: DateRangeFilterChange): void {
    if (change.key === 'joining') {
      this.joiningDateFrom = change.range.start;
      this.joiningDateTo = change.range.end;
    } else if (change.key === 'rollIn') {
      this.rollInDateFrom = change.range.start;
      this.rollInDateTo = change.range.end;
    }
  }

  updateDateRange(
    value: DateRangeValue,
    rangeType: 'attendance' | 'joining' | 'rollIn'
  ): void {
    if (rangeType === 'attendance') {
      this.attendanceDateFrom = value.start;
      this.attendanceDateTo = value.end;
    } else if (rangeType === 'joining') {
      this.joiningDateFrom = value.start;
      this.joiningDateTo = value.end;
    } else {
      this.rollInDateFrom = value.start;
      this.rollInDateTo = value.end;
    }
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.capabilityFilter = '';
    this.careerLevelFilter = '';
    this.skillFilter = '';
    this.attendanceFilter = '';
    this.workLocationFilter = '';
    this.attendanceDateFrom = '';
    this.attendanceDateTo = '';
    this.joiningDateFrom = '';
    this.joiningDateTo = '';
    this.rollInDateFrom = '';
    this.rollInDateTo = '';
  }

  getHoursWorked(record: AttendanceRecord): string {
    if (
      record.status !== 'Present' ||
      !record.timeIn ||
      !record.timeOut
    ) {
      return '';
    }

    const timeIn = this.parseTime(record.timeIn);
    const timeOut = this.parseTime(record.timeOut);

    if (timeIn === null || timeOut === null) {
      return '';
    }

    let difference = timeOut - timeIn;

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

    return (hours * 60) + minutes;
  }

  private getSortedOptions(
    selectValue: (record: AttendanceRecord) => string
  ): string[] {
    return [...new Set(this.attendanceRecords.map(selectValue))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  private isDateInRange(date: string, from: string, to: string): boolean {
    return (!from || date >= from) && (!to || date <= to);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}