import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { authState } from 'rxfire/auth';
import { isPlatformBrowser } from '@angular/common';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return of(true); // Allow rendering on server (SSG/SSR)
  }

  return authState(auth).pipe(
    take(1),
    map(user => {
      const currentUrl = state.url;

      if (user && currentUrl.includes('login')) {
        // If the user is logged in and trying to access the login page, redirect to home
        router.navigate(['/']);
        return false;
      }

      if (!user && currentUrl.includes('login')) {
        return true;
      }

      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      // User is logged in
      return true;
    })
  );
};
