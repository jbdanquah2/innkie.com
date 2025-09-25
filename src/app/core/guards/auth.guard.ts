import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { authState } from 'rxfire/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map(user => {
      // Allow the user to access the route if they are logged in
      if (user) {
        return true;
      }

      // Otherwise, redirect to the login page
      router.navigate(['/login']);
      return false;
    })
  );
};
