import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantListingComponent } from './merchant-listing.component';

describe('MerchantListingComponent', () => {
  let component: MerchantListingComponent;
  let fixture: ComponentFixture<MerchantListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MerchantListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MerchantListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
