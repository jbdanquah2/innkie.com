import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PasswordGuard } from './short-password.guard';

describe('PasswordGuard', () => {
  let guard: PasswordGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PasswordGuard,
        { provide: Router, useValue: { createUrlTree: () => {} } }
      ]
    });
    guard = TestBed.inject(PasswordGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
