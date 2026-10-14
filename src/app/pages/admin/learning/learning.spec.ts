import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Learning } from './learning';

describe('Learning', () => {
  let component: Learning;
  let fixture: ComponentFixture<Learning>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Learning],
    }).compileComponents();

    fixture = TestBed.createComponent(Learning);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds Skill Hub certifications, cohorts, and announcements', () => {
    component.certificationDraft = {
      name: 'Kubernetes Fundamentals',
      detail: 'Recommended for platform engineering'
    };
    component.cohortDraft = {
      name: 'Platform Operations',
      focus: 'Build cloud operations skills',
      duration: '5-week mission'
    };
    component.announcementDraft = {
      title: 'New learning mission',
      description: 'Join the platform operations cohort.',
      type: 'Learning'
    };

    component.addCertification();
    component.addCohort();
    component.addAnnouncement();

    expect(component.skillHubContent.certifications.at(-1)).toEqual({
      name: 'Kubernetes Fundamentals',
      detail: 'Recommended for platform engineering',
      status: 'Recommended'
    });
    expect(component.skillHubContent.cohorts.at(-1)).toEqual({
      name: 'Platform Operations',
      focus: 'Build cloud operations skills',
      duration: '5-week mission',
      joined: false
    });
    expect(component.skillHubContent.announcements.at(-1)).toEqual({
      title: 'New learning mission',
      description: 'Join the platform operations cohort.',
      type: 'Learning'
    });
  });
});
