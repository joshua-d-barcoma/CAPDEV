import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRangePicker } from './date-range-picker';

describe('DateRangePicker', () => {
  let component: DateRangePicker;
  let fixture: ComponentFixture<DateRangePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit a confirmed date range', () => {
    const rangeChange = vi.spyOn(component.rangeChange, 'emit');
    const start = new Date(2026, 9, 5);
    const end = new Date(2026, 9, 12);

    component.selectDay(start);
    component.selectDay(end);
    component.confirm();

    expect(rangeChange).toHaveBeenCalledWith({
      start: '2026-10-05',
      end: '2026-10-12'
    });
  });

  it('should reset the selected range', () => {
    const rangeChange = vi.spyOn(component.rangeChange, 'emit');
    component.selectPreset('today');

    component.reset();

    expect(component.startDate).toBe('');
    expect(component.endDate).toBe('');
    expect(rangeChange).toHaveBeenCalledWith({ start: '', end: '' });
  });
});
