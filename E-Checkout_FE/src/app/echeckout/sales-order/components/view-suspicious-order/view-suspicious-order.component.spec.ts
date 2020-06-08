import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSuspiciousOrderComponent } from './view-suspicious-order.component';

describe('ViewSuspiciousOrderComponent', () => {
  let component: ViewSuspiciousOrderComponent;
  let fixture: ComponentFixture<ViewSuspiciousOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSuspiciousOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSuspiciousOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
