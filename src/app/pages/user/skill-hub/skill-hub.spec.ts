import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkillHub } from './skill-hub';

describe('SkillHub', () => {
  let component: SkillHub;
  let fixture: ComponentFixture<SkillHub>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillHub],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillHub);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
