import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { Auth, getIdToken } from '@angular/fire/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: Auth) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only intercept requests to our API
    if (!request.url.includes('/api/')) {
      return next.handle(request);
    }

    const user = this.auth.currentUser;
    if (!user) {
      return next.handle(request);
    }

    return from(getIdToken(user)).pipe(
      switchMap(token => {
        const authReq = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(authReq);
      })
    );
  }
}
