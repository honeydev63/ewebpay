import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkOrderListingComponent } from './work-order-listing.component';

describe('WorkOrderListingComponent', () => {
  let component: WorkOrderListingComponent;
  let fixture: ComponentFixture<WorkOrderListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkOrderListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkOrderListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
