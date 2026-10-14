import { Injectable } from '@angular/core';
import { EmployeeDirectory } from './employee-directory';

export type RtoDayName = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
export type RtoDayLocation = 'Onsite' | 'WFH';

export interface RtoDay {
  day: RtoDayName;
  location: RtoDayLocation;
}

export interface RtoChangeRequest {
  id: number;
  employeeName: string;
  requestedSchedule: RtoDay[];
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

const weekdays: RtoDayName[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

@Injectable({ providedIn: 'root' })
export class EmployeeRto {
  readonly schedules: Record<string, RtoDay[]> = {};
  readonly requests: RtoChangeRequest[] = [];
  private nextRequestId = 1;

  constructor(directory: EmployeeDirectory) {
    for (const employee of directory.employees) {
      this.schedules[employee.name] = this.createDefaultSchedule();
    }
  }

  getSchedule(employeeName: string): RtoDay[] {
    return this.schedules[employeeName] ?? this.createDefaultSchedule();
  }

  getLatestRequest(employeeName: string): RtoChangeRequest | undefined {
    return this.requests
      .filter(request => request.employeeName === employeeName)
      .at(-1);
  }

  hasPendingRequest(employeeName: string): boolean {
    return this.requests.some(request =>
      request.employeeName === employeeName && request.status === 'Pending'
    );
  }

  submitRequest(employeeName: string, schedule: RtoDay[]): void {
    if (this.hasPendingRequest(employeeName)) {
      throw new Error('An RTO schedule request is already pending approval.');
    }

    this.requests.push({
      id: this.nextRequestId++,
      employeeName,
      requestedSchedule: this.copySchedule(schedule),
      status: 'Pending',
      submittedAt: new Date().toLocaleString()
    });
  }

  updateSchedule(employeeName: string, schedule: RtoDay[]): void {
    this.schedules[employeeName] = this.copySchedule(schedule);
  }

  approveRequest(request: RtoChangeRequest): void {
    this.assertPending(request);
    this.updateSchedule(request.employeeName, request.requestedSchedule);
    request.status = 'Approved';
  }

  rejectRequest(request: RtoChangeRequest): void {
    this.assertPending(request);
    request.status = 'Rejected';
  }

  private assertPending(request: RtoChangeRequest): void {
    if (request.status !== 'Pending') {
      throw new Error('Only pending RTO schedule requests can be reviewed.');
    }
  }

  private createDefaultSchedule(): RtoDay[] {
    return weekdays.map(day => ({
      day,
      location: day === 'Fri' ? 'WFH' : 'Onsite'
    }));
  }

  private copySchedule(schedule: RtoDay[]): RtoDay[] {
    return weekdays.map(day => ({
      day,
      location: schedule.find(item => item.day === day)?.location ?? 'WFH'
    }));
  }
}
