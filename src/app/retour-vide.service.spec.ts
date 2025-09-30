import { TestBed } from '@angular/core/testing';

import { RetourVideService } from './services/retour-vide.service';

describe('RetourVideService', () => {
  let service: RetourVideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetourVideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
