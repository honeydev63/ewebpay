import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewQAAgentComponent } from './view-agent.component';

describe('ViewOrderComponent', () => {
  let component: ViewQAAgentComponent;
  let fixture: ComponentFixture<ViewQAAgentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewQAAgentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewQAAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
