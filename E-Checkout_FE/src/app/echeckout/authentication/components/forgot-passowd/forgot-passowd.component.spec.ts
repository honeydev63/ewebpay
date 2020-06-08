import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPassowdComponent } from './forgot-passowd.component';

describe('ForgotPassowdComponent', () => {
  let component: ForgotPassowdComponent;
  let fixture: ComponentFixture<ForgotPassowdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForgotPassowdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgotPassowdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
