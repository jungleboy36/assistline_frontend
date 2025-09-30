import { TestBed } from '@angular/core/testing';

import { PropositionService } from './services/proposition.service';

describe('PropositionService', () => {
  let service: PropositionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropositionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
