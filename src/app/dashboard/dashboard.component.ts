import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {RouterLink} from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import {environment} from '../../environments/environment';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';
import {ShortUrl} from '../shared/models/short-url.model';
import { Clipboard } from '@angular/cdk/clipboard'
import {MatSnackBar} from '@angular/material/snack-bar';
import {LinkEditorDialogComponent} from './link-editor/link-editor-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {LoadingService} from '../shared/services/loading.service';
import {AppUser} from '../shared/models/user.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private auth = inject(Auth);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  clipboard = inject(Clipboard)
  private loadingService = inject(LoadingService);

  currentUser: any = {} as AppUser;
  isLoading = true;
  totalUrls: number = 0;
  userId: string = '';
  shortenedUrls: ShortUrl[] = [];
  apiUrl = environment.appUrl;
  editorOpen: boolean = false;
  selectedUrl: ShortUrl | null = null;
  showDetails: boolean = false;


  constructor() {

  }

  ngOnInit() {

    this.currentUser = this.auth.currentUser // get the initial user details

    this.loadingService.show();

    this.authService.user$.subscribe(async user => {
      console.log('###>>>>user', user)
      this.currentUser = user as AppUser;

      this.userId = user?.uid || '';
      this.totalUrls = user?.totalUrls || 0;

      await this.shortenedUrlList();

      this.loadingService.hide();
    });
  }

  async shortenedUrlList() {
    this.isLoading = true;

    this.shortenedUrls = (await this.shortUrlService.getUserShortUrls(this.userId)) as ShortUrl[];

    console.log('###shortenedUrls', this.shortenedUrls)
  }

  get calcTotalClicks(): number {
    let total = 0;
    this.shortenedUrls.forEach(url => {
      total += (url.clickCount as number) || 0;
    });
    return total;
  }

  get calcTotalActive(): number {
    let total = 0;
    this.shortenedUrls.forEach(url => {
      if (url.isActive) total += 1;
    });
    return total;
  }

  get calcTotalAllowedRemaining(): number {
    // const planLimits: {[key: string]: number} = {
    //   free: 5,
    //   pro: 100,
    //   enterprise: 10000
    // };
    // const userPlan = this.currentUser?.plan || 'free';
    // const allowed = planLimits[userPlan] || 5;
    if (!this.currentUser?.maxUrls) return 0;

    return this.currentUser?.maxUrls - this.totalUrls;
  }


  copyToClipboard(shortUrl: string) {
    console.log('###copyToClipboard')
    this.clipboard.copy(shortUrl);
    this.snackBar.open('Short URL copied to clipboard!', 'Close', {
      duration: 3000,
    });
  }

  showQrCode() {
    console.log('###showQrCode')

  }

  edit(shortUrl: ShortUrl) {
    const dialogRef = this.dialog.open(LinkEditorDialogComponent, {
      width: '620px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'link-editor-dialog-panel',
      data: shortUrl
    });

    dialogRef.afterClosed().subscribe(async (result: ShortUrl | null) => {
      if (result) {
        console.log('Saved (result):', result);
        this.selectedUrl = result;

        const index = this.findIndexByShortCode(this.selectedUrl.shortCode);
        if (index !== -1) {
          this.shortenedUrls[index] = this.selectedUrl;
        }

        // this.loadingService.show();
        await this.shortUrlService.updateShortUrl(this.selectedUrl.shortCode, this.selectedUrl);

        // this.loadingService.hide();

        this.snackBar.open('Link updated successfully!', 'Close', {
          duration: 3000,
        });
      } else {
        console.log('Dialog closed without saving');
      }
    });

    this.selectedUrl = shortUrl;

    this.editorOpen = true;
  }

  findIndexByShortCode(shortCode: string): number {
    return this.shortenedUrls.findIndex(url => url.shortCode === shortCode);
  }

  details() {
    console.log('###details')

    this.showDetails = !this.showDetails;

  }

  onSaveEdit($event: ShortUrl) {

  }
}
