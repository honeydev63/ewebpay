import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeSalesAgentComponent } from './ae-sales-agent.component';

describe('AeSalesAgentComponent', () => {
  let component: AeSalesAgentComponent;
  let fixture: ComponentFixture<AeSalesAgentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeSalesAgentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeSalesAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
