import { Calendar } from './calendar';

describe('Calendar', () => {
  it('builds a monthly attendance calendar and reports its sample counts', () => {
    const page = new Calendar();

    expect(page.calendarDays).toHaveLength(42);
    expect(page.monthLabel).toBe('October 2026');
    expect(page.leaveDays).toBe(1);
    expect(page.exceptions).toBe(1);
    expect(page.remoteDays).toBe(5);
  });

  it('changes the displayed month and selects its first day', () => {
    const page = new Calendar();

    page.changeMonth(1);

    expect(page.monthLabel).toBe('November 2026');
    expect(page.selectedDay?.dayNumber).toBe(1);
  });

  it('records leave requests in the demo view only', () => {
    const page = new Calendar();
    page.requestDate = '2026-10-21';
    page.requestReason = 'Medical appointment';

    page.submitAttendanceRequest();

    expect(page.requestSubmitted).toBe(true);
    expect(page.requestFormOpen).toBe(false);
  });
});
