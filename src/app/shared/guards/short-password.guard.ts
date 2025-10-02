// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
//   UrlTree,
//   Router
// } from '@angular/router';
// import {firstValueFrom, Observable, of} from 'rxjs';
// import { map } from 'rxjs/operators';
// import { MatDialog } from '@angular/material/dialog';
// import { PasswordDialogComponent } from '../../password-dialog/password-dialog.component';
// import { APP_PATHS } from '../untils/utils.urls';
// import {ShortUrlService} from '../services/short-url.service';
// import {HttpClient} from '@angular/common/http';
// import {environment} from '../../../environments/environment';
// import {ShortUrl} from '../models/short-url.model';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class PasswordGuard implements CanActivate {
//   constructor(private dialog: MatDialog,
//               private router: Router,
//               private shortUrlService: ShortUrlService,
//               private http: HttpClient) {}
//
//   async canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Promise<boolean | UrlTree> {
//     const targetUrl = state.url;
//
//     const shortCode = route.paramMap.get('shortcode') || '';
//     console.log('PasswordGuard::Shortcode from guard:', shortCode);
//
//     console.log("checking if it's an app route or not");
//
//     // ✅ Allow if route is part of APP_PATHS or is 'redirect'
//     if (APP_PATHS.includes(targetUrl) || !shortCode) {
//       console.log('Redirecting to ' + targetUrl);
//       return true;
//     }
//
//     console.log("this is a short url... asking for password");
//
//
//     const shortURlData: any =  await this.shortUrlService.getShortUrlByCode(shortCode);
//
//     if (shortURlData && !shortURlData.passwordProtected) {
//       console.log("<><><shortURL", shortURlData);
//
//
//       console.log('Checking if password is required...');
//
//       const dialogRef = this.dialog.open(PasswordDialogComponent, {
//         width: '620px',
//         maxWidth: 'calc(100vw - 32px)',
//         panelClass: 'password-dialog-panel',
//         backdropClass: 'blurred-backdrop',
//         disableClose: true, // user must enter/cancel
//         data: {
//           message: 'To access this link, please enter the correct password.',
//           shortCode: shortCode,
//           password: shortURlData.passwordProtected || ''
//         }
//       });
//
//       dialogRef.afterClosed().subscribe((result: {originalUrl: string, shortCode: string}) => {
//         if (result) {
//           // TODO: validate password here, e.g. call API
//           console.log('Password entered:', result);
//
//
//
//          // this.router.navigateByUrl(result.originalUrl);
//
//
//         } else {
//           // Cancel → redirect to home
//           this.router.navigate(['/']);
//           console.log('redirect did not happen....')
//
//         }
//         return false;
//       });
//
//     }
//
//
//
//     // return UrlTree instead of navigate (cleaner in guards)
//     return false // of(this.router.createUrlTree([`r/${shortCode}`]));
//   }

//   async callRedirect(shortCode: string) {
//
//     await firstValueFrom(this.http.post(environment.redirectURL, {
//         shortCode: shortCode
//       }
//     ));
//
//   }
//
// }
//

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { APP_PATHS } from '../utils/utils.urls';
@Injectable({ providedIn: 'root' })
export class PasswordGuard implements CanActivate {

  constructor(private dialog: MatDialog, private router: Router) {}


  canActivate( route: ActivatedRouteSnapshot, state: RouterStateSnapshot ): Observable<boolean | UrlTree> {

    const targetUrl = state.url;
    const shortCode = route.paramMap.get('shortcode');
    console.log('PasswordGuard::Shortcode from guard:', shortCode);
    console.log("checking if it's an app route or not");


    // ✅ Allow if route is part of APP_PATHS or is 'redirect'
    if (APP_PATHS.includes(targetUrl) || targetUrl === `/r/${shortCode}`) {

      console.log('Redirecting to ' + targetUrl);

      return of(true);

    }

    console.log("this is a short url... asking for password");

    // return UrlTree instead of navigate (cleaner in guards)

    return of(this.router.createUrlTree([`r/${shortCode}`]));

  }
}




















