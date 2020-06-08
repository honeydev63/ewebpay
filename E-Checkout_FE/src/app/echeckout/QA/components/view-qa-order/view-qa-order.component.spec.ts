import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewQaOrderComponent } from './view-qa-order.component';

describe('ViewQaOrderComponent', () => {
  let component: ViewQaOrderComponent;
  let fixture: ComponentFixture<ViewQaOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewQaOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewQaOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
