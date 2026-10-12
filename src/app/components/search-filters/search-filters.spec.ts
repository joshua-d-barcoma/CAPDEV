import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFilters } from './search-filters';

describe('SearchFilters', () => {
  let component: SearchFilters;
  let fixture: ComponentFixture<SearchFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit reset requests', () => {
    const resetAll = vi.spyOn(component.resetAll, 'emit');

    fixture.nativeElement.querySelector('.reset-filters-button').click();

    expect(resetAll).toHaveBeenCalled();
  });
});
