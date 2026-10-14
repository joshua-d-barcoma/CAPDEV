import { ComponentFixture, TestBed } from '@angular/core/testing';
import { History } from './history';

describe('History', () => {
  let component: History;
  let fixture: ComponentFixture<History>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [History],
    }).compileComponents();

    fixture = TestBed.createComponent(History);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits RTO schedule changes for admin approval without applying them immediately', () => {
    const currentSchedule = component.rto.getSchedule(component.employeeName)
      .map(day => ({ ...day }));
    component.rtoDraft[0].location = 'WFH';

    component.submitRtoRequest();

    expect(component.rto.getLatestRequest(component.employeeName)?.status).toBe('Pending');
    expect(component.rto.getSchedule(component.employeeName)).toEqual(currentSchedule);
    expect(component.rtoRequestPending).toBe(true);
  });
});
