import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesAgentListingComponent } from './sales-agent-listing.component';

describe('SalesAgentListingComponent', () => {
  let component: SalesAgentListingComponent;
  let fixture: ComponentFixture<SalesAgentListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalesAgentListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesAgentListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
