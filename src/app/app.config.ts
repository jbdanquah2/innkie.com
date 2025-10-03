import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

// CDK / Clipboard
import { ClipboardModule } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';
import {BidiModule, Directionality} from '@angular/cdk/bidi';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { LoadingInterceptor } from './shared/interceptors/loading.interceptor';
import {authGuard} from './shared/guards/auth.guard';


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
    { provide: 'authGuard', useValue: authGuard },

    // ✅ animations (don’t put BrowserAnimationsModule directly)
    provideAnimations(),

    // ✅ add CDK modules globally
    importProvidersFrom(
      ClipboardModule,
      OverlayModule,
    BidiModule
    ),

  ]
};
