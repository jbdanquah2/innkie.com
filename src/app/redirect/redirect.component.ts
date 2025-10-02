import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {APP_PATHS, callRedirect} from '../shared/utils/utils.urls';
import {PasswordDialogComponent} from '../password-dialog/password-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {ShortUrlService} from '../shared/services/short-url.service';
import {LoadingService} from '../shared/services/loading.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-redirect',
  imports: [],
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

  shortCode: string = '';

  constructor() {
  }

  async ngOnInit() {
    window.scrollTo(0, 0);

    this.shortCode = this.route.snapshot.paramMap.get('shortcode')!;
    console.log('Shortcode:', this.shortCode);

    const currentPath = this.router.url;
    console.log("currentPath",currentPath);

    if (!APP_PATHS.includes(currentPath)) {

      const shortURlData: any = await this.shortUrlService.getShortUrlByCode(this.shortCode);

      console.log("shortURlData", shortURlData);

      if (shortURlData && !shortURlData.passwordProtected) {

        console.log('Checking if password is required...');

        const dialogRef = this.dialog.open(PasswordDialogComponent, {
          width: '620px',
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'password-dialog-panel',
          backdropClass: 'blurred-backdrop',
          disableClose: true, // user must enter/cancel
          data: {
            message: 'Enter password to access this link.',
            shortCode: this.shortCode,
          }
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {

            console.log('Password entered:', result);
            //
            // window.location.href = result.originalUrl;


          } else {
            // Cancel → redirect to home
            this.router.navigate(['/']);
            console.log('redirect did not happen....')

          }

        });

      } else {

        this.loadingService.show()

        const res: {shortCode: string, originalUrl: string} = await callRedirect(this.shortCode, this.http);
        console.log("From password dailog::",res);

        window.location.href = res.originalUrl;

        this.loadingService.hide()


      }
    }

  }
}
