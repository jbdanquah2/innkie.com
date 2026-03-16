import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {APP_PATHS, callRedirect} from '../shared/utils/utils.urls';
import {PasswordDialogComponent} from '../password-dialog/password-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {ShortUrlService} from '../shared/services/short-url.service';
import {LoadingService} from '../shared/services/loading.service';
import {HttpClient} from '@angular/common/http';
import {ShortUrl} from '../shared/models/short-url.model';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-redirect',
  imports: [NgIf, RouterLink],
  standalone: true,
  templateUrl: './redirect.component.html',
  styleUrl: './redirect.component.scss'
})
export class RedirectComponent implements OnInit {

  router = inject(Router);
  dialog = inject(MatDialog);
  route: ActivatedRoute = inject(ActivatedRoute);
  shortUrlService: ShortUrlService = inject(ShortUrlService);
  loadingService: LoadingService = inject(LoadingService);
  http: HttpClient = inject(HttpClient);
  isDisabled: boolean = false;
  shortCode: string = '';
  urlNonExists: boolean = false

  constructor() {
  }

  async ngOnInit() {

    this.loadingService.show();

    this.shortCode = this.route.snapshot.paramMap.get('shortcode')!;
    console.log('Shortcode:', this.shortCode);

    const currentPath = this.router.url;
    console.log("currentPath",currentPath);

    try {

      if (!APP_PATHS.includes(this.shortCode)) {

        let shortURlData: any

        if (this.shortCode.length == 6) {
          shortURlData = await this.shortUrlService.getShortUrlByCode(this.shortCode);
          console.log("Result by Shortcode:", shortURlData);
        } else {
          const customAlias = this.shortCode;
          shortURlData = await this.shortUrlService.getShortUrlByAlias(customAlias);

          console.log("Result by Custom Alias", shortURlData);
        }

        if (!shortURlData) {
          console.log("URL does not exist");
          this.urlNonExists = true
          return
        }

        if (!this.checkUrlStatus(shortURlData)) {
          console.log("URL is disabled and inactive")
          this.isDisabled = true;
          return;
        }

        if (shortURlData && shortURlData.passwordProtected) {

          console.log('Checking if password is required...');

          this.loadingService.hide();
          const dialogRef = this.dialog.open(PasswordDialogComponent, {
            width: '620px',
            maxWidth: 'calc(100vw - 32px)',
            panelClass: 'password-dialog-panel',
            backdropClass: 'blurred-backdrop',
            disableClose: true, // user must enter/cancel
            data: {
              message: 'This link is protected. Enter the password to continue.',
              shortCode: this.shortCode,
            }
          });

          dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {

              console.log('Password entered:', result);

            } else {
              // Cancel → redirect to home
              this.router.navigate(['/']);
              console.log('redirect did not happen....')

            }
          });

        } else {

          // this.loadingService.show()

          const res: {shortCode: string, originalUrl: string} = await callRedirect(this.shortCode, this.http);
          console.log("From password dialog::",res);

          window.location.href = res.originalUrl;

        }
      }

    } catch (err) {

      console.log("Error in redirect::", err);

    } finally {

      this.loadingService.hide();

    }
  }

  checkUrlStatus(shortUrlData: Partial<ShortUrl>) {

    let isAllowed = true

    if (!shortUrlData.isActive) {
      isAllowed = false;
    }

    if (shortUrlData?.expiration) {
      if (shortUrlData.expiration.mode == "oneTime") {
        if (shortUrlData.expiration.maxClicks && shortUrlData.expiration.maxClicks >= ((shortUrlData.clickCount) as number)) {
          isAllowed = false;
        }

      } else if (shortUrlData.expiration.mode == "duration") {

        const now = new Date();
        const createdAt = shortUrlData.createdAt?.toDate()

        if (shortUrlData.expiration.durationUnit == "hours" && shortUrlData.expiration.durationValue) {

          const diffHours = this.calcNumberOfHours(now, createdAt!)

            if (diffHours >= shortUrlData.expiration.durationValue) {
              isAllowed = false;
            }
        } else if (shortUrlData.expiration.durationUnit == "days" && shortUrlData.expiration.durationValue) {

            const diffDays = this.calcNumberOfDays(now, createdAt!)
            if (diffDays >= shortUrlData.expiration.durationValue) {
              isAllowed = false;
            }
        }
      }
    }

    return isAllowed;
  }

  calcNumberOfHours(now: Date, createdAt: Date) {

    const diffMs = now.getTime() - createdAt.getTime(); // difference in ms
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // convert to hours

    console.log("Hours elapsed:", diffHours);

    return diffHours;
  }

  calcNumberOfDays(now:Date, createdAt:Date) {

    const diffMs = now.getTime() - createdAt.getTime(); // difference in ms

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    console.log("Days elapsed:", diffDays);

    return diffDays;
  }
}
