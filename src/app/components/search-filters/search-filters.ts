import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DateRangePicker,
  DateRangeValue
} from '../date-range-picker/date-range-picker';

export interface SelectFilterConfig {
  key: string;
  label: string;
  options: string[];
  value: string;
}

export interface DateRangeFilterConfig {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface SelectFilterChange {
  key: string;
  value: string;
}

export interface DateRangeFilterChange {
  key: string;
  range: DateRangeValue;
}

@Component({
  selector: 'app-search-filters',
  standalone: true,
  imports: [DateRangePicker],
  templateUrl: './search-filters.html',
  styleUrl: './search-filters.scss'
})
export class SearchFilters {
  @Input() searchTerm = '';
  @Input() filters: SelectFilterConfig[] = [];
  @Input() dateRanges: DateRangeFilterConfig[] = [];
  @Input() searchPlaceholder = 'Search employees...';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<SelectFilterChange>();
  @Output() dateRangeChange = new EventEmitter<DateRangeFilterChange>();
  @Output() resetAll = new EventEmitter<void>();

  updateSearch(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchChange.emit(target.value);
    }
  }

  updateFilter(event: Event, key: string): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.filterChange.emit({ key, value: target.value });
    }
  }

  updateDateRange(key: string, range: DateRangeValue): void {
    this.dateRangeChange.emit({ key, range });
  }
}
