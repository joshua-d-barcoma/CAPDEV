import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { EmployeeView } from './employee-view';

describe('EmployeeView', () => {
  let component: EmployeeView;
  let fixture: ComponentFixture<EmployeeView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeView],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ employeeName: 'Alex Santos' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('shows the selected employee and their RTO schedule', () => {
    expect(component.employee?.name).toBe('Alex Santos');
    expect(fixture.nativeElement.textContent).toContain('RTO Schedule');
    expect(fixture.nativeElement.textContent).toContain('Onsite');
  });

  it('shows the user dashboard profile and activity sections for the selected employee', () => {
    const pageText = fixture.nativeElement.textContent as string;

    expect(pageText).toContain('Alex Santos');
    expect(pageText).toContain('AWS');
    expect(pageText).toContain('Python');
    expect(pageText).toContain('Good afternoon, Alex');
    expect(pageText).toContain('Training progress');
    expect(pageText).toContain('Latest Achievement');
    expect(pageText).toContain('Time In / Out');
    expect(pageText).toContain('Mandatory Training');
    expect(pageText).toContain('Data Privacy & Protection');
    expect(pageText).toContain('Other Tasks');
    expect(pageText).toContain('Update technical profile');
    expect(pageText).toContain('Recommended Development');
    expect(pageText).toContain('Cloud Fundamentals');
  });

  it('approves an employee RTO request and updates their schedule', () => {
    const requestSchedule = component.rto.getSchedule('Alex Santos')
      .map(day => ({ ...day, location: day.day === 'Mon' ? 'WFH' as const : day.location }));
    component.rto.submitRequest('Alex Santos', requestSchedule);
    const request = component.pendingRequest;

    if (!request) {
      throw new Error('Expected a pending schedule request.');
    }

    component.reviewRequest(request, true);

    expect(request.status).toBe('Approved');
    expect(component.rto.getSchedule('Alex Santos')).toEqual(requestSchedule);
    expect(component.pendingRequest).toBeUndefined();
  });

  it('lets an admin save a direct RTO schedule update', () => {
    component.startScheduleEdit();
    component.scheduleDraft[1].location = 'WFH';

    component.saveSchedule();

    expect(component.rto.getSchedule('Alex Santos')[1].location).toBe('WFH');
    expect(component.scheduleEditing).toBe(false);
  });
});
