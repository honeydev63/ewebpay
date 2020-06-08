import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BankCheckoutComponent } from './bank-checkout.component';

describe('BankCheckoutComponent', () => {
  let component: BankCheckoutComponent;
  let fixture: ComponentFixture<BankCheckoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BankCheckoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
