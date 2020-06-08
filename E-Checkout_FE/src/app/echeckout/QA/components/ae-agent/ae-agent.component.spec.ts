import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeAgentComponent } from './ae-agent.component';

describe('AeAgentComponent', () => {
  let component: AeAgentComponent;
  let fixture: ComponentFixture<AeAgentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeAgentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
