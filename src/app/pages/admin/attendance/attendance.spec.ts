import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Attendance } from './attendance';

describe('Attendance', () => {
  let component: Attendance;
  let fixture: ComponentFixture<Attendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Attendance],
    }).compileComponents();

    fixture = TestBed.createComponent(Attendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show attendance summary metrics and count employees who arrive after 9 AM', () => {
    expect(component.totalBenchEmployees).toBe(86);
    expect(component.attendancePercentage).toBe(92);
    expect(component.tardinessCount).toBe(1);
    expect(component.activeNonCompliance).toBe(1);
  });

  it('should filter attendance records by employee details and attendance date range', () => {
    component.workLocationFilter = 'Cebu';
    component.attendanceFilter = 'Present';
    component.skillFilter = 'Azure';
    component.attendanceDateFrom = component.todayDate;
    component.attendanceDateTo = component.todayDate;

    expect(component.filteredAttendanceRecords.map(record => record.name))
      .toEqual(['Maria Cruz']);

    component.attendanceDateFrom = '2000-01-01';
    component.attendanceDateTo = '2000-01-31';

    expect(component.filteredAttendanceRecords).toEqual([]);
  });

  it('should reset search and all employee and date filters', () => {
    component.searchTerm = 'Maria';
    component.capabilityFilter = 'Cloud Customer Edge';
    component.careerLevelFilter = 'CL7';
    component.skillFilter = 'Azure';
    component.attendanceFilter = 'Present';
    component.workLocationFilter = 'Cebu';
    component.attendanceDateFrom = '2026-10-01';
    component.attendanceDateTo = '2026-10-12';
    component.joiningDateFrom = '2022-01-01';
    component.joiningDateTo = '2022-12-31';
    component.rollInDateFrom = '2026-08-01';
    component.rollInDateTo = '2026-09-01';

    component.resetAllFilters();

    expect(component.searchTerm).toBe('');
    expect(component.capabilityFilter).toBe('');
    expect(component.careerLevelFilter).toBe('');
    expect(component.skillFilter).toBe('');
    expect(component.attendanceFilter).toBe('');
    expect(component.workLocationFilter).toBe('');
    expect(component.attendanceDateFrom).toBe('');
    expect(component.attendanceDateTo).toBe('');
    expect(component.joiningDateFrom).toBe('');
    expect(component.joiningDateTo).toBe('');
    expect(component.rollInDateFrom).toBe('');
    expect(component.rollInDateTo).toBe('');
  });

  it('should show the attendance date before the employee name', () => {
    const table = fixture.nativeElement as HTMLElement;
    const headers = Array.from(table.querySelectorAll('thead th'))
      .map(header => header.textContent?.trim());

    expect(headers.slice(0, 2)).toEqual(['Date', 'Employees']);
  });
});
