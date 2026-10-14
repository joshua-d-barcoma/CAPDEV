import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type CalendarStatus = 'Onsite' | 'WFH' | 'Leave' | 'Exception' | 'Weekend';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  status: CalendarStatus;
  note: string;
  inCurrentMonth: boolean;
}

@Component({
  imports: [CommonModule],
  selector: 'app-calendar',
  styleUrl: './calendar.scss',
  templateUrl: './calendar.html',
})
export class Calendar {
  displayedMonth = new Date(2026, 9, 1);
  selectedDate = new Date(2026, 9, 14);
  requestFormOpen = false;
  requestDate = '';
  requestReason = '';
  requestSubmitted = false;
  requestError = '';

  private readonly sampleStatuses: Record<string, { status: CalendarStatus; note: string }> = {
    '2026-10-05': { status: 'Onsite', note: 'Checked in at CG2 · EOD submitted' },
    '2026-10-06': { status: 'Exception', note: 'No attendance record' },
    '2026-10-07': { status: 'Onsite', note: 'Checked in at CG2 · EOD submitted' },
    '2026-10-08': { status: 'Leave', note: 'Approved leave' },
    '2026-10-09': { status: 'WFH', note: 'Remote work · EOD submitted' },
    '2026-10-12': { status: 'Onsite', note: 'Checked in at CG2 · EOD submitted' },
    '2026-10-13': { status: 'Onsite', note: 'Checked in at CG2 · EOD submitted' },
    '2026-10-14': { status: 'Onsite', note: 'Checked in at CG2 · EOD pending' }
  };

  get monthLabel(): string {
    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric'
    }).format(this.displayedMonth);
  }

  get calendarDays(): CalendarDay[] {
    const year = this.displayedMonth.getFullYear();
    const month = this.displayedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const inCurrentMonth = date.getMonth() === month;
      const dateKey = this.toDateKey(date);
      const recorded = this.sampleStatuses[dateKey];
      const weekday = date.getDay();
      const status = !inCurrentMonth || weekday === 0 || weekday === 6
        ? 'Weekend'
        : recorded?.status ?? (weekday === 5 ? 'WFH' : 'Onsite');

      return {
        date,
        dayNumber: date.getDate(),
        status,
        note: recorded?.note ?? this.getDefaultNote(status),
        inCurrentMonth
      };
    });
  }

  get selectedDay(): CalendarDay | undefined {
    return this.calendarDays.find(day =>
      this.isSameDay(day.date, this.selectedDate)
    );
  }

  get onsiteDays(): number {
    return this.calendarDays.filter(
      day => day.inCurrentMonth && day.status === 'Onsite'
    ).length;
  }

  get remoteDays(): number {
    return this.calendarDays.filter(
      day => day.inCurrentMonth && day.status === 'WFH'
    ).length;
  }

  get leaveDays(): number {
    return this.calendarDays.filter(
      day => day.inCurrentMonth && day.status === 'Leave'
    ).length;
  }

  get exceptions(): number {
    return this.calendarDays.filter(
      day => day.inCurrentMonth && day.status === 'Exception'
    ).length;
  }

  changeMonth(offset: number): void {
    this.displayedMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + offset,
      1
    );
    this.selectedDate = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth(),
      1
    );
  }

  goToToday(): void {
    const today = new Date();
    this.displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDate = today;
  }

  submitAttendanceRequest(): void {
    if (!this.requestDate || !this.requestReason.trim()) {
      this.requestError = 'Enter a request date and a brief reason.';
      return;
    }

    this.requestError = '';
    this.requestSubmitted = true;
    this.requestFormOpen = false;
  }

  updateRequestDate(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.requestDate = event.target.value;
    }
  }

  updateRequestReason(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.requestReason = event.target.value;
    }
  }

  handleRequestSubmit(event: Event): void {
    event.preventDefault();
    this.submitAttendanceRequest();
  }

  selectDay(day: CalendarDay): void {
    if (day.inCurrentMonth) {
      this.selectedDate = day.date;
    }
  }

  isSelected(day: CalendarDay): boolean {
    return this.isSameDay(day.date, this.selectedDate);
  }

  private isSameDay(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate();
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDefaultNote(status: CalendarStatus): string {
    switch (status) {
      case 'Onsite':
        return 'Expected onsite at CG2';
      case 'WFH':
        return 'Scheduled work from home';
      case 'Leave':
        return 'Approved leave';
      case 'Exception':
        return 'Attendance exception to review';
      case 'Weekend':
        return 'Weekend';
    }
  }
}
