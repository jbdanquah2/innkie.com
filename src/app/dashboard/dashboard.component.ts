import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Auth} from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import {environment} from '../../environments/environment';
import {ShortUrl, UniqueVisitor, QrTemplate, AppUser} from '@innkie/shared-models';
import {LoadingService} from '../shared/services/loading.service';
import {LinkCardComponent} from './link-card/link-card.component';
import {toDateSafe} from '../shared/utils/utils.urls';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';
import {LinkEditorDialogComponent} from './link-editor/link-editor-dialog.component';
import {QrCodeGeneratorComponent} from './qr-code-editor/qr-code-editor.component';
import {WorkspaceService} from '../shared/services/workspace.service';
import {QrStudioService} from '../shared/services/qr-studio.service';
import {ConfirmDialogComponent} from '../shared/components/confirm-dialog/confirm-dialog.component';
import {ToastService} from '../shared/services/toast.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LinkCardComponent, LinkEditorDialogComponent, QrCodeGeneratorComponent, ConfirmDialogComponent],
  providers: [TimeAgoPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private auth = inject(Auth);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);
  router = inject(Router);
  private loadingService = inject(LoadingService);
  private workspaceService = inject(WorkspaceService);
  private qrStudioService = inject(QrStudioService);
  private toast = inject(ToastService);

  currentUser: any = {} as AppUser;
  isLoading = true;
  isLoadingMore = false;
  totalUrls: number = 0;
  userId: string = '';
  shortenedUrls: ShortUrl[] = [];
  apiUrl = environment.appUrl;
  selectedUrl: ShortUrl | null = null;
  unfilteredShortUrls: ShortUrl[] = []
  listOrder: 'newest' | 'oldest' | 'mostClicks' | 'leastClicks' = 'newest';
  noMore: boolean = false;
  allShortUrls: ShortUrl[] = [];
  today: Date = new Date();

  showLinkEditor: boolean = false;
  showQrEditor: boolean = false;

  selectedLinkIds: Set<string> = new Set();
  showBulkActions = false;
  showBulkTemplatePicker = false;
  workspaceTemplates: QrTemplate[] = [];

  showDeleteConfirm = false;
  idToDelete: string | null = null;

  constructor() {}

  async ngOnInit() {
    this.loadingService.show();
    this.currentUser = this.authService.currentUser;
    this.userId = this.currentUser?.uid || '';
    this.totalUrls = this.currentUser?.totalUrls || 0;

    // Listen for workspace changes to refresh data
    this.workspaceService.activeWorkspace$.subscribe(() => {
      this.refreshData();
    });

    await this.refreshData();
    this.loadingService.hide();
  }

  async refreshData() {
    const activeWorkspace = this.workspaceService.activeWorkspace;
    const workspaceId = activeWorkspace?.id;

    if (this.userId) {
      this.isLoading = true;
      this.shortenedUrls = []; // Clear current list to show skeleton
      
      try {
        this.allShortUrls = await this.shortUrlService.getUserShortUrls(this.userId);
        
        // Filter by workspace if applicable
        if (workspaceId) {
          this.shortenedUrls = this.allShortUrls.filter(url => url.workspaceId === workspaceId);
        } else {
          // Legacy/Unscoped links
          this.shortenedUrls = this.allShortUrls.filter(url => !url.workspaceId);
        }
        
        this.unfilteredShortUrls = [...this.shortenedUrls];
        this.sortByDate();
      } finally {
        this.isLoading = false;
      }
    }
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
        url.title?.toLowerCase().includes(searchValue) ||
        url.tags?.some(tag => tag.toLowerCase().includes(searchValue))
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
    this.shortenedUrls = (await this.shortUrlService.getFirstPage()) as ShortUrl[];
  }

  get calcTotalClicks(): number {
    let total = 0;
    this.allShortUrls.forEach(url => {
      total += (url.clickCount as any || 0);
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
    if (!this.currentUser?.maxUrls) return 0;
    return this.currentUser?.maxUrls - this.totalUrls;
  }


  copyToClipboard(shortUrl: string) {
    navigator.clipboard.writeText(shortUrl).then(() => {
      this.toast.success('Short URL copied to clipboard!');
    });
  }

  editQRCode(shortUrl: ShortUrl) {
    this.selectedUrl = shortUrl;
    this.showQrEditor = true;
  }

  edit(shortUrl: ShortUrl) {
    this.selectedUrl = shortUrl;
    this.showLinkEditor = true;
  }

  async handleLinkEditorClosed(result: any) {
    this.showLinkEditor = false;
    this.selectedUrl = null;

    if (result) {
      if (result.action === 'edit') {
        await this.shortUrlService.updateShortUrl(result.payload.shortCode, result.payload);
        // Refresh list or update item in place
        const index = this.findIndexByShortCode(result.payload.shortCode);
        if (index !== -1) {
          this.shortenedUrls[index] = result.payload;
        }
        this.toast.success('Link updated successfully!');
      } else if (result.action === 'delete') {
        await this.deleteShortUrl(result.id);
      }
    }
  }

  handleQrEditorClosed() {
    this.showQrEditor = false;
    this.selectedUrl = null;
  }
  openDetails(shortUrl: ShortUrl) {
    this.router.navigate(['/dashboard/details', shortUrl.shortCode]);
  }

  async deleteShortUrl(id: string) {
    this.idToDelete = id;
    this.showDeleteConfirm = true;
  }

  async onConfirmDelete() {
    if (this.idToDelete) {
      const id = this.idToDelete;
      this.shortenedUrls = this.shortenedUrls.filter(url => url.id !== id);
      this.idToDelete = null;
      this.showDeleteConfirm = false;
      await this.shortUrlService.deleteShortUrl(id);
      await this.loadMore();
    }
  }

  onCancelDelete() {
    this.idToDelete = null;
    this.showDeleteConfirm = false;
  }

  toggleSelection(id: string) {
    if (this.selectedLinkIds.has(id)) {
      this.selectedLinkIds.delete(id);
    } else {
      this.selectedLinkIds.add(id);
    }
    this.showBulkActions = this.selectedLinkIds.size > 0;
  }

  selectAll() {
    if (this.selectedLinkIds.size === this.shortenedUrls.length) {
      this.selectedLinkIds.clear();
    } else {
      this.shortenedUrls.forEach(url => this.selectedLinkIds.add(url.id));
    }
    this.showBulkActions = this.selectedLinkIds.size > 0;
  }

  async openBulkTemplatePicker() {
    this.workspaceTemplates = await this.qrStudioService.getTemplates();
    this.showBulkTemplatePicker = true;
  }

  async applyBulkTemplate(template: QrTemplate) {
    const ids = Array.from(this.selectedLinkIds);
    this.loadingService.show();
    try {
      for (const id of ids) {
        const link = this.allShortUrls.find(l => l.id === id);
        if (link) {
          await this.shortUrlService.updateShortUrl(link.shortCode, {
            ...link,
            qrConfig: template.config
          });
        }
      }
      this.toast.success(`Applied "${template.name}" to ${ids.length} links.`);
      this.selectedLinkIds.clear();
      this.showBulkActions = false;
      this.showBulkTemplatePicker = false;
      await this.refreshData();
    } catch (e) {
      this.toast.error('Bulk application failed');
    } finally {
      this.loadingService.hide();
    }
  }

  findIndexByShortCode(shortCode: string): number {
    return this.shortenedUrls.findIndex(url => url.shortCode === shortCode);
  }

  async loadMore() {
    this.isLoadingMore = true;
    try {
      let moreShortUrls: ShortUrl[] = (await this.shortUrlService.getNextPage()) as ShortUrl[];
      this.noMore = moreShortUrls.length === 0;
      this.shortenedUrls = [...this.shortenedUrls, ...moreShortUrls];
      this.sortByDate();
    } finally {
      this.isLoadingMore = false;
    }
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }
}
