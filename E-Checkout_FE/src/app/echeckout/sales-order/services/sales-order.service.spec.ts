import { TestBed } from '@angular/core/testing';

import { SalesOrdersService } from './sales-order.service';

describe('SalesOrdersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SalesOrdersService = TestBed.get(SalesOrdersService);
    expect(service).toBeTruthy();
  });
});
