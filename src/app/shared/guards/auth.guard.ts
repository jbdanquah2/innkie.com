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

      const currentUrl = state.url;

      if (user && currentUrl.includes('login')) {
        // If the user is logged in and trying to access the login page, redirect to home
        router.navigate(['/']);
        return false;
      }

      if (!user && currentUrl.includes('login')) {
        console.log('Allow if user is not logged in and accessing login page');
        return true;
      }

      if (!user) {
        console.log('No user is logged in');
        return false;
      }

      console.log('User is logged in');

      const jwt = user?.getIdToken().then((token) => {
        return token;
      });
      console.log('###token', jwt)
      user?.getIdTokenResult().then((tokenResult) => {
        console.log('###tokenResult', tokenResult)
        return tokenResult;
      })


      if (user) {
        return true;
      }

      // Otherwise, redirect to the login page
      router.navigate(['/login']);
      return false;
    })
  );
};
