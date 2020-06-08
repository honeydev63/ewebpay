import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EcheckoutSubHeaderComponent } from '../echeckout-sub-header/echeckout-sub-header.component';

describe('EcheckoutSubHeaderComponent', () => {
  let component: EcheckoutSubHeaderComponent;
  let fixture: ComponentFixture<EcheckoutSubHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcheckoutSubHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcheckoutSubHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
