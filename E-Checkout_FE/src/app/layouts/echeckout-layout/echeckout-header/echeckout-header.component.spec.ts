import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcheckoutHeaderComponent } from './echeckout-header.component';

describe('EcheckoutHeaderComponent', () => {
  let component: EcheckoutHeaderComponent;
  let fixture: ComponentFixture<EcheckoutHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcheckoutHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcheckoutHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
