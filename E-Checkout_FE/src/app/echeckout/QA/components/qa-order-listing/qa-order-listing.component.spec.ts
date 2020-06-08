import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QaOrderListingComponent } from './qa-order-listing.component';

describe('QaOrderListingComponent', () => {
  let component: QaOrderListingComponent;
  let fixture: ComponentFixture<QaOrderListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QaOrderListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QaOrderListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
