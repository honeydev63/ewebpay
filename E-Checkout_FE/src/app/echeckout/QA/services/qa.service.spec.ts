import { TestBed } from '@angular/core/testing';

import { QAService } from './qa.service';

describe('SalesOrdersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: QAService = TestBed.get(QAService);
    expect(service).toBeTruthy();
  });
});
