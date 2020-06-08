import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolvedOrderListingComponent } from './resolved-order-listing.component';

describe('ResolvedOrderListingComponent', () => {
  let component: ResolvedOrderListingComponent;
  let fixture: ComponentFixture<ResolvedOrderListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResolvedOrderListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResolvedOrderListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
