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

  it('shows P0-P5 proficiency levels without percentage scores', () => {
    const proficiencySection = fixture.nativeElement.querySelector('.proficiency-card');
    const levels = Array.from(
      proficiencySection.querySelectorAll('.proficiency-level'),
      (element: Element) => element.textContent?.trim()
    );

    expect(levels).toEqual(['P2', 'P1', 'P2', 'P1']);
    expect(proficiencySection.textContent).not.toContain('%');
    expect(proficiencySection.querySelector('.proficiency-track')).toBeNull();
  });
});
