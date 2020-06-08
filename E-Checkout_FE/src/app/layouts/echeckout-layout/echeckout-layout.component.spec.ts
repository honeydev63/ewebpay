import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcheckoutLayoutComponent } from './echeckout-layout.component';

describe('EcheckoutLayoutComponent', () => {
  let component: EcheckoutLayoutComponent;
  let fixture: ComponentFixture<EcheckoutLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcheckoutLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcheckoutLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
