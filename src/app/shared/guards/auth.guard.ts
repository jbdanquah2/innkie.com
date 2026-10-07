import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return of(true); // Allow server rendering (SSG/SSR)
  }

  // Wait until Firebase Auth restores session and AuthService marks userReady
  return authService.userReady$.pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      const user = authService.currentUser;
      const currentUrl = state.url;

      if (user && currentUrl.includes('login')) {
        router.navigate(['/dashboard']);
        return false;
      }

      if (!user && currentUrl.includes('login')) {
        return true;
      }

      if (!user) {
        router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        return false;
      }

      // User is authenticated
      return true;
    })
  );
};
