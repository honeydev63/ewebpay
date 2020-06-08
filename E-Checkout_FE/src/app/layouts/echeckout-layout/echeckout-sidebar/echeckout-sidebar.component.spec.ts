import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcheckoutSidebarComponent } from './echeckout-sidebar.component';

describe('EcheckoutSidebarComponent', () => {
  let component: EcheckoutSidebarComponent;
  let fixture: ComponentFixture<EcheckoutSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcheckoutSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcheckoutSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
