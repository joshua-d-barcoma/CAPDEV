import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

export interface DateRangeValue {
  start: string;
  end: string;
}

interface CalendarDay {
  date: Date;
  currentMonth: boolean;
  today: boolean;
  start: boolean;
  end: boolean;
  inRange: boolean;
}

interface DatePreset {
  label: string;
  key: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_quarter';
}

const DATE_PRESETS: DatePreset[] = [
  { label: 'Today', key: 'today' },
  { label: 'Yesterday', key: 'yesterday' },
  { label: 'Last week', key: 'last_week' },
  { label: 'Last month', key: 'last_month' },
  { label: 'Last quarter', key: 'last_quarter' }
];

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss'
})
export class DateRangePicker implements OnChanges {
  @Input() label = 'Date range';
  @Input() startDate = '';
  @Input() endDate = '';
  @Output() rangeChange = new EventEmitter<DateRangeValue>();

  readonly presets = DATE_PRESETS;
  readonly weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  isOpen = false;
  viewDate = this.startOfMonth(new Date());
  draftStart: Date | null = null;
  draftEnd: Date | null = null;
  hoverDate: Date | null = null;
  selectingEnd = false;
  selectedPreset: DatePreset['key'] | null = null;
  private committedPreset: DatePreset['key'] | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['startDate'] || changes['endDate']) &&
      !this.startDate &&
      !this.endDate
    ) {
      this.committedPreset = null;
      this.selectedPreset = null;
      this.draftStart = null;
      this.draftEnd = null;
    }
  }

  get calendarDays(): CalendarDay[] {
    const month = this.viewDate.getMonth();
    const firstDay = this.startOfMonth(this.viewDate);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - mondayOffset);

    const today = this.startOfDay(new Date());
    const rangeEnd = this.draftEnd ?? this.hoverDate;

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);

      return {
        date,
        currentMonth: date.getMonth() === month,
        today: this.sameDay(date, today),
        start: this.sameDay(date, this.draftStart),
        end: this.sameDay(date, rangeEnd),
        inRange: !!this.draftStart && !!rangeEnd &&
          date > this.draftStart && date < rangeEnd
      };
    });
  }

  get monthLabel(): string {
    return this.viewDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  get displayLabel(): string {
    if (!this.startDate) {
      return 'Select date range';
    }

    const preset = this.committedPreset &&
      this.startDate === this.toDateKey(this.draftStart) &&
      this.endDate === this.toDateKey(this.draftEnd)
      ? this.presets.find(item => item.key === this.committedPreset)
      : undefined;

    if (preset) {
      return preset.label;
    }

    const start = this.formatDate(this.startDate);

    return this.endDate && this.endDate !== this.startDate
      ? `${start} – ${this.formatDate(this.endDate)}`
      : start;
  }

  toggle(): void {
    if (!this.isOpen) {
      this.loadCommittedRange();
    }
    this.isOpen = !this.isOpen;
  }

  selectPreset(key: DatePreset['key']): void {
    const today = this.startOfDay(new Date());
    let start: Date;
    let end: Date;

    switch (key) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = this.addDays(today, -1);
        end = start;
        break;
      case 'last_week': {
        const weekday = (today.getDay() + 6) % 7;
        end = this.addDays(today, -weekday - 1);
        start = this.addDays(end, -6);
        break;
      }
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_quarter': {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterStartMonth - 3, 1);
        end = new Date(today.getFullYear(), quarterStartMonth, 0);
        break;
      }
    }

    this.draftStart = start;
    this.draftEnd = end;
    this.selectedPreset = key;
    this.selectingEnd = false;
    this.hoverDate = null;
    this.viewDate = this.startOfMonth(start);
  }

  previousMonth(): void {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() - 1,
      1
    );
  }

  nextMonth(): void {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      1
    );
  }

  selectDay(date: Date): void {
    this.selectedPreset = null;
    this.hoverDate = null;

    if (!this.selectingEnd || !this.draftStart) {
      this.draftStart = date;
      this.draftEnd = null;
      this.selectingEnd = true;
      return;
    }

    if (date < this.draftStart) {
      this.draftEnd = this.draftStart;
      this.draftStart = date;
    } else {
      this.draftEnd = date;
    }

    this.selectingEnd = false;
  }

  previewDay(date: Date): void {
    if (this.selectingEnd) {
      this.hoverDate = date;
    }
  }

  confirm(): void {
    if (!this.draftStart) {
      return;
    }

    const start = this.toDateKey(this.draftStart);
    const end = this.toDateKey(this.draftEnd ?? this.draftStart);
    this.committedPreset = this.selectedPreset;
    this.startDate = start;
    this.endDate = end;
    this.rangeChange.emit({ start, end });
    this.isOpen = false;
  }

  reset(): void {
    this.draftStart = null;
    this.draftEnd = null;
    this.hoverDate = null;
    this.selectingEnd = false;
    this.selectedPreset = null;
    this.committedPreset = null;
    this.startDate = '';
    this.endDate = '';
    this.rangeChange.emit({ start: '', end: '' });
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (
      event.target instanceof Node &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isOpen = false;
  }

  private loadCommittedRange(): void {
    this.draftStart = this.fromDateKey(this.startDate);
    this.draftEnd = this.fromDateKey(this.endDate);
    this.selectedPreset = this.committedPreset;
    this.selectingEnd = false;
    this.hoverDate = null;
    this.viewDate = this.startOfMonth(this.draftStart ?? new Date());
  }

  private fromDateKey(key: string): Date | null {
    if (!key) {
      return null;
    }

    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateKey(date: Date | null): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(key: string): string {
    const date = this.fromDateKey(key);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) ?? '';
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addDays(date: Date, amount: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  private sameDay(first: Date, second: Date | null): boolean {
    return !!second &&
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate();
  }
}
