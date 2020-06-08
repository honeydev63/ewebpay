import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeIncentiveComponent } from './ae-incentive.component';

describe('AeIncentiveComponent', () => {
  let component: AeIncentiveComponent;
  let fixture: ComponentFixture<AeIncentiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeIncentiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeIncentiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
