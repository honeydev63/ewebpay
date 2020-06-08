import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AeProductsComponent } from './ae-products.component';

describe('AeProductsComponent', () => {
  let component: AeProductsComponent;
  let fixture: ComponentFixture<AeProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AeProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AeProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
