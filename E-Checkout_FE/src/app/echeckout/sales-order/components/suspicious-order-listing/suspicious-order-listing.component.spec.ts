import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspiciousOrderListingComponent } from './suspicious-order-listing.component';

describe('SuspiciousOrderListingComponent', () => {
  let component: SuspiciousOrderListingComponent;
  let fixture: ComponentFixture<SuspiciousOrderListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuspiciousOrderListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuspiciousOrderListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
