import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IncentiveListingComponent } from './incentive-listing.component';

describe('IncentiveListingComponent', () => {
  let component: IncentiveListingComponent;
  let fixture: ComponentFixture<IncentiveListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IncentiveListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IncentiveListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
