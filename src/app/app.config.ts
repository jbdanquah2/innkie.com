// app.config.ts
import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
  APP_INITIALIZER,
} from '@angular/core';

import {
  provideRouter,
  withViewTransitions,
  Router,
  NavigationEnd,
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';
import { BidiModule } from '@angular/cdk/bidi';

import { filter } from 'rxjs';
import { routes } from './app.routes';
import { LoadingInterceptor } from './shared/interceptors/loading.interceptor';
import { authGuard } from './shared/guards/auth.guard';
import { environment } from '../environments/environment';
import {AuthService} from './shared/services/auth.service';

export function authInitializerFactory(authService: AuthService) {
  return () => authService.waitForInitialUser();
}

/** Register scroll-to-top using an APP_INITIALIZER so it runs at bootstrap */
function provideScrollToTopOnNavigation() {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        // factory returns a function - this outer function is executed during DI; the returned
        // inner function is invoked by Angular during APP_INITIALIZER processing.
        const router = inject(Router);
        // subscribe to NavigationEnd and scroll to top
        router.events
          .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
          .subscribe(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        return () => Promise.resolve();
      },
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: authInitializerFactory,
      deps: [AuthService],
      multi: true
    }
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    // firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),

    provideRouter(routes, withViewTransitions()),

    // scroll provider
    provideScrollToTopOnNavigation(),

    // http client + interceptors
    provideHttpClient(withInterceptorsFromDi()),
    // { provide: HTTP_INTERCEPTORS,
    //   useClass: LoadingInterceptor,
    //   multi: true
    // },

    // any auth guard binding
    {
      provide: 'authGuard',
      useValue: authGuard
    },

    provideAnimations(),

    // CDK modules
    importProvidersFrom(
      ClipboardModule,
      OverlayModule,
      BidiModule
    ),
  ],
};
