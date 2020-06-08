import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QaSuspiciousListingComponent } from './qa-suspicious-listing.component';

describe('QaSuspiciousListingComponent', () => {
  let component: QaSuspiciousListingComponent;
  let fixture: ComponentFixture<QaSuspiciousListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QaSuspiciousListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QaSuspiciousListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
