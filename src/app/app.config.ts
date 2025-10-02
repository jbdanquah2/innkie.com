import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {environment} from '../environments/environment';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {provideHttpClient, withInterceptors, withInterceptorsFromDi} from '@angular/common/http';
import {authGuard} from './shared/guards/auth.guard';
import {BrowserAnimationsModule, provideAnimations} from '@angular/platform-browser/animations';
import {LoadingInterceptor} from './shared/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LoadingInterceptor, useClass: LoadingInterceptor },

    { provide: 'authGuard',
      useValue: authGuard
    },
    provideAnimations(),
    BrowserAnimationsModule
  ],

};
