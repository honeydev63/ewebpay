import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkCheckoutComponent } from './link-checkout.component';

describe('LinkCheckoutComponent', () => {
  let component: LinkCheckoutComponent;
  let fixture: ComponentFixture<LinkCheckoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkCheckoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
