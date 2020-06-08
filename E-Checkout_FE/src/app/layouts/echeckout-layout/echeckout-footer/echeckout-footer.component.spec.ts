import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcheckoutFooterComponent } from './echeckout-footer.component';

describe('EcheckoutFooterComponent', () => {
  let component: EcheckoutFooterComponent;
  let fixture: ComponentFixture<EcheckoutFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcheckoutFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcheckoutFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
