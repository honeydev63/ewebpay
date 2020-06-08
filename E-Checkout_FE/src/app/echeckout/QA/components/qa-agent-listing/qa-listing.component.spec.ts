import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QaListingComponent } from './qa-listing.component';

describe('QaListingComponent', () => {
  let component: QaListingComponent;
  let fixture: ComponentFixture<QaListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QaListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QaListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
