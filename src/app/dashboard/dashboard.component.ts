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
import {QrCodeGeneratorComponent} from './qr-code-editor/qr-code-editor.component';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TimeAgoPipe, MatButton, MatProgressSpinner],
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
  unfilteredShortUrls: ShortUrl[] = []
  listOrder: 'newest' | 'oldest' | 'mostClicks' | 'leastClicks' = 'newest';
  loading: unknown;
  noMore: boolean = false;


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

      this.sortByDate();

      this.loadingService.hide();
    });
  }

  onSearch(event: Event) {
    const searchInput = event.target as HTMLInputElement;
    const searchValue = searchInput.value.trim().toLowerCase();

    if (!this.unfilteredShortUrls.length) {
      this.unfilteredShortUrls = [...this.shortenedUrls];
    }

    this.shortenedUrls = this.unfilteredShortUrls.filter(url => {
      // Adjust the fields you want to search
      return (
        url.customAlias?.toLowerCase().includes(searchValue) ||
        url.originalUrl?.toLowerCase().includes(searchValue) ||
        url.description?.toLowerCase().includes(searchValue) ||
        url.title?.toLowerCase().includes(searchValue)
      )
    });
  }


  filterByStatus(status: any) {
    if (!this.unfilteredShortUrls.length) {
      this.unfilteredShortUrls = [...this.shortenedUrls];
    }

    if (status === 'all') {
      this.shortenedUrls = this.unfilteredShortUrls;
      this.sortByDate();
      return;
    }

    this.sortByDate();

    status = status === 'true';

    this.shortenedUrls = this.unfilteredShortUrls.filter(url => url.isActive === status);
  }

  sortByDate(event?: Event) {

    if (event) {
      const select = event?.target as HTMLSelectElement || "newest";
      console.log('###sortByDate', select.value)
      this.listOrder = select.value as 'newest' | 'oldest' | 'mostClicks' | 'leastClicks';
    }

    this.shortenedUrls = [...this.shortenedUrls].sort((a, b) => {

      if (this.listOrder === 'mostClicks') {
        return ((b.clickCount as number)|| 0) - ((a.clickCount as number) || 0);
      }

      if (this.listOrder === 'leastClicks') {
        return ((a.clickCount as number) || 0) - ((b.clickCount as number) || 0);
      }

      const timeA = a.createdAt.toDate().getTime();
      const timeB = b.createdAt.toDate().getTime();

      return this.listOrder === 'newest' ? timeB - timeA : timeA - timeB;
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

  editQRCode(shortUrl: ShortUrl) {

    const dialogRef = this.dialog.open(QrCodeGeneratorComponent, {
      width: '620px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'qr-code-dialog-panel',
      data: shortUrl
    })

    dialogRef.afterClosed().subscribe(async (result: ShortUrl | null) => {
      if (result) {
        console.log('Saved (result):', result);
      }
    })
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

  async loadMore() {
    let moreShortUrls: ShortUrl[] =  (await this.shortUrlService.getNextPage(this.userId)) as ShortUrl[];
    console.log('###moreShortUrls', moreShortUrls)

    moreShortUrls.length  ? this.noMore = moreShortUrls.length > 0 : false;

    this.shortenedUrls = [...this.shortenedUrls, ...moreShortUrls];
    moreShortUrls = [];
    this.sortByDate();
  }
}
