import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resources } from './resources';

describe('Resources', () => {
  let component: Resources;
  let fixture: ComponentFixture<Resources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resources],
    }).compileComponents();

    fixture = TestBed.createComponent(Resources);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show bench aging counts that add up to the total employees', () => {
    const agingEmployeeCount = component.benchAgingMetrics.reduce(
      (total, metric) => total + metric.count,
      0
    );

    expect(component.benchAgingMetrics.map(metric => metric.range))
      .toEqual(['0-30 days', '31-60 days', '61-90 days', '91-120+ days']);
    expect(agingEmployeeCount).toBe(component.totalEmployees);
  });

  it('should scale skill bars to the highest count and include the displayed skills', () => {
    const highestSkillCount = Math.max(
      ...component.skillDistribution.map(skill => skill.count)
    );

    expect(component.skillDistribution.length).toBeGreaterThan(6);
    expect(component.getSkillHeight(highestSkillCount)).toBe(100);
    expect(component.getSkillHeight(36))
      .toBeCloseTo((36 / highestSkillCount) * 100);
  });

  it('should filter employees by a case-insensitive search term', () => {
    component.searchTerm = 'KUBERNETES';

    expect(component.filteredResources.map(resource => resource.name))
      .toEqual(['Alex Santos', 'Sarah Garcia']);
  });

  it('should return no employees when the search has no matches', () => {
    component.searchTerm = 'no matching employee';

    expect(component.filteredResources).toEqual([]);
  });

  it('should apply capability, career level, skill, and attendance filters together', () => {
    component.capabilityFilter = 'Hybrid Cloud - Operations';
    component.careerLevelFilter = 'CL9';
    component.skillFilter = 'Kubernetes';
    component.attendanceFilter = 'Unapproved Absence';

    expect(component.filteredResources.map(resource => resource.name))
      .toEqual(['Sarah Garcia']);
  });

  it('should filter employees by skill', () => {
    component.skillFilter = 'Cisco';

    expect(component.filteredResources.map(resource => resource.name))
      .toEqual(['John Reyes']);
  });
});
