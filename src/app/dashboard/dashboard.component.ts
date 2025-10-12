import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import {environment} from '../../environments/environment';
import {ShortUrl, UniqueVisitor} from '../shared/models/short-url.model';
import { Clipboard } from '@angular/cdk/clipboard'
import {MatSnackBar} from '@angular/material/snack-bar';
import {LinkEditorDialogComponent} from './link-editor/link-editor-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {LoadingService} from '../shared/services/loading.service';
import {AppUser} from '../shared/models/user.model';
import {QrCodeGeneratorComponent} from './qr-code-editor/qr-code-editor.component';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {LinkCardComponent} from './link-card/link-card.component';
import {toDateSafe} from '../shared/utils/utils.urls';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';
import {ShortUrlDetailsComponent} from './short-url-details/short-url-details.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButton, MatProgressSpinner, LinkCardComponent],
  providers: [TimeAgoPipe],
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
  router = inject(Router);
  private loadingService = inject(LoadingService);

  currentUser: any = {} as AppUser;
  isLoading = true;
  totalUrls: number = 0;
  userId: string = '';
  shortenedUrls: ShortUrl[] = [];
  apiUrl = environment.appUrl;
  editorOpen: boolean = false;
  selectedUrl: ShortUrl | null = null;
  unfilteredShortUrls: ShortUrl[] = []
  listOrder: 'newest' | 'oldest' | 'mostClicks' | 'leastClicks' = 'newest';
  loading: unknown;
  noMore: boolean = false;
  allShortUrls: ShortUrl[] = [];


  constructor() {}

  async ngOnInit() {

    this.loadingService.show();

    // await this.authService.waitForInitialUser();
    this.currentUser = this.authService.currentUser

    console.log('currentUser', this.currentUser);
    this.userId = this.currentUser?.uid || '';
    this.totalUrls = this.currentUser?.totalUrls || 0;

    console.log('###totalUrls', this.currentUser.totalUrls)

    if (this.shortUrlService.getAll.length <= 1) {
      this.allShortUrls = await this.shortUrlService.getUserShortUrls(this.userId);
      this.shortUrlService.updateAllShortUrlsArray(this.allShortUrls);
    } else {
      this.allShortUrls = this.shortUrlService.getAll;
    }

    await this.shortenedUrlList();
    this.sortByDate();

    this.loadingService.hide();

  }

  onSearch(event: Event) {
    const searchInput = event.target as HTMLInputElement;
    const searchValue = searchInput.value.trim().toLowerCase();

    if (!this.unfilteredShortUrls.length) {
      this.unfilteredShortUrls = [...this.shortenedUrls];
    }

    this.shortenedUrls = this.unfilteredShortUrls.filter(url => {
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
      console.log('sortByDate', select.value)
      this.listOrder = select.value as 'newest' | 'oldest' | 'mostClicks' | 'leastClicks';
    }

    this.shortenedUrls = [...this.shortenedUrls].sort((a, b) => {

      if (this.listOrder === 'mostClicks') {
        return ((b.clickCount as number)|| 0) - ((a.clickCount as number) || 0);
      }

      if (this.listOrder === 'leastClicks') {
        return ((a.clickCount as number) || 0) - ((b.clickCount as number) || 0);
      }

      const dateA = toDateSafe(a.createdAt);
      const dateB = toDateSafe(b.createdAt);

      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;

      return this.listOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }

  async shortenedUrlList() {
    this.isLoading = true;

    this.shortenedUrls = (await this.shortUrlService.getFirstPage()) as ShortUrl[];

    console.log('###shortenedUrls', this.shortenedUrls)
  }

  get calcTotalClicks(): number {
    let total = 0;
    this.allShortUrls.forEach(url => {
      total += (url.clickCount as number) || 0;
    });
    return total;
  }

  get calcTotalActive(): number {
    let total = 0;
    this.allShortUrls.forEach(url => {
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
      width: '768px',
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

    this.dialog.open(LinkEditorDialogComponent, {
      width: '620px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'link-editor-dialog-panel',
      data: shortUrl
    }).afterClosed().subscribe(async (result: any | null) => {

      console.log('Edit:: Dialog closed', result);

      if (result?.action == 'edit') {
        console.log('Saved (result):', result.payload);
        this.selectedUrl = result.payload as ShortUrl;

        const index = this.findIndexByShortCode(this.selectedUrl.shortCode);
        if (index !== -1) {
          this.shortenedUrls[index] = this.selectedUrl;
        }
        await this.shortUrlService.updateShortUrl(this.selectedUrl.shortCode, this.selectedUrl);

        this.snackBar.open('Link updated successfully!', 'Close', {
          duration: 3000,
        });
      } else if (result?.action == 'delete') {

        console.log('Delete', result);

        await this.deleteShortUrl(result.id);

      } else {
        console.log('Dialog closed without saving');
      }
    });

    this.selectedUrl = shortUrl;

    this.editorOpen = true;
  }

  openDetails(shortUrl: ShortUrl) {
    this.dialog.open(ShortUrlDetailsComponent, {
      width: '980px',
      height: '85vh',
      data: { shortUrl }
    }).afterClosed().subscribe(async (result) => {

      if (result?.action === 'edit') {

        this.edit(result.shortUrl);

      } else if (result?.action === 'delete') {

      console.log('deleting short url', result.id)

        console.log('Delete', result);
        await this.deleteShortUrl(result.id);
      }
    });
  }

  async deleteShortUrl(id: string) {

    this.shortenedUrls = this.shortenedUrls.filter(url => url.id !== id);

    this.snackBar.open('Link deleted successfully!', 'Close', {
      duration: 3000,
    });

    await this.shortUrlService.deleteShortUrl(id);
    await this.loadMore();
  }

  findIndexByShortCode(shortCode: string): number {
    return this.shortenedUrls.findIndex(url => url.shortCode === shortCode);
  }

  async loadMore() {

    // this.loadingService.show()

    let moreShortUrls: ShortUrl[] =  (await this.shortUrlService.getNextPage()) as ShortUrl[];

    console.log('###...moreShortUrls', moreShortUrls)

    this.noMore = moreShortUrls.length === 0

    this.shortenedUrls = [...this.shortenedUrls, ...moreShortUrls];

    this.sortByDate();

    // this.loadingService.hide()
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }
}
