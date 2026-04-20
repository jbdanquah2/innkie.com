import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {AuthService} from '../shared/services/auth.service';
import {AppUser} from '@innkie/shared-models';
import {generateQrCode} from '../shared/utils/utils.urls';
import {ShortUrlService} from '../shared/services/short-url.service';
import {ShortUrl} from '@innkie/shared-models';
import {LoadingService} from '../shared/services/loading.service';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';
import {Router, RouterLink} from '@angular/router';
import {LinkCardComponent} from '../dashboard/link-card/link-card.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TimeAgoPipe,
    RouterLink,
    LinkCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private shortUrlService = inject(ShortUrlService);
  private loading: LoadingService = inject(LoadingService);
  private router = inject(Router);

  urlForm: FormGroup;
  apiUrl = environment.appUrl;
  isLoading = false;
  shortenedUrl: string | undefined;
  shortCode: string | undefined;
  error: string | null = null;
  qrCodeUrl: string | null = null;
  imagePreview: any;
  currentUser: AppUser = {} as AppUser;
  currentPath: string = '/';
  allShortUrls: ShortUrl[] = [];
  userId: string | null = null;
  previouslyShortened: boolean = false;
  existingUrl: ShortUrl | undefined = undefined;
  isLoggedIn: boolean = false;
  recentGuestLinks: ShortUrl[] = [];

  upgradeHooks = [
    'Unlock deeper analytics and see what truly drives your clicks.',
    'Increase your link limits and track performance in real time.',
    'Add your own custom domain and brand every short link. (coming soon)',
    'Get faster redirects and priority support with Pro.',
    'Access audience insights to optimize your campaigns.'
  ];
  currentHook: string = '';
  hookIndex: number = 0;
  private intervalId: any | null = null;


  constructor(
    private fb: FormBuilder) {
    this.urlForm = this.fb.group({
      originalUrl: ['', [Validators.required, Validators.pattern('https?://.*')]]
    });

    onAuthStateChanged(this.auth, (user) => {
      this.isLoggedIn = !!user;
      if (!this.isLoggedIn) {
        this.loadGuestLinks();
      }
    });
  }

  ngOnInit() {

    this.currentUser = this.authService.currentUser as AppUser;
    this.userId = this.currentUser?.uid;

    if (this.userId && this.shortUrlService.getAll.length <= 1) {
      // using .then to allow normal page load without being blocked
      this.shortUrlService.getUserShortUrls(this.userId)
        .then(res => {
          this.allShortUrls = res;
          this.shortUrlService.updateAllShortUrlsArray(this.allShortUrls);
          console.log("done!!")
        })
    } else {
      console.log("user not logged!")
      this.loadGuestLinks();
    }

    this.rotateHook();
    this.intervalId = setInterval(() => this.rotateHook(), 4000);
  }

  loadGuestLinks() {
    this.recentGuestLinks = this.shortUrlService.getGuestLinks();
  }

  private rotateHook() {
    this.currentHook = this.upgradeHooks[this.hookIndex];
    this.hookIndex = (this.hookIndex + 1) % this.upgradeHooks.length;
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async getPreview() {

    this.error = null;

    console.log("getPreview", this.urlForm.value?.originalUrl);
    if (this.urlForm.invalid) {
      // Don't show error on blur if empty
      if (!this.urlForm.value?.originalUrl) return;
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    try {
      const res: any = await firstValueFrom(this.http.get(environment.previewLongURL + '?longUrl=' + encodeURIComponent(this.urlForm.value?.originalUrl)));
      console.log("###getPreview", res);
      this.imagePreview = res;
    } catch (e) {
      console.error("Preview failed", e);
    }
  }

  downloadQrCode() {
    if (!this.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = `qr-code-${this.shortCode}.png`;
    link.click();
  }


  async shortenUrl() {
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('Form Value:', this.urlForm.value);

    const originalUrl = this.urlForm.value?.originalUrl.trim();
    const userId = this.auth.currentUser?.uid ?? null;

    // check if the originalUrl has been shortened before (for logged in user)
    if (this.isLoggedIn) {
      this.existingUrl  = this.shortUrlService.getAll.find(url => url.originalUrl === originalUrl);
    } else {
      this.existingUrl = this.recentGuestLinks.find(url => url.originalUrl === originalUrl);
    }

    if (this.existingUrl) {

      console.log("shortened before:", this.existingUrl);

      this.shortenedUrl = `${this.apiUrl}/${this.existingUrl.shortCode}`;
      this.qrCodeUrl = await generateQrCode(originalUrl) || '';
      this.shortCode = this.existingUrl.shortCode;
      this.previouslyShortened = true;
      this.isLoading = false;
      return;
    }

    try {

      console.log("Generating shortened URL for:", originalUrl, "User ID:", userId);

      const result: any =  await firstValueFrom(this.http.post(environment.shortenUrl, {
        originalUrl: originalUrl,
        userId: userId
      }))

      console.log("###Result:", result);

      if (result.error) {
        this.error = result.error;
        this.isLoading = false;
        return;
      }

      this.shortUrlService.incrementUrlCount()
        .then(res => {
          console.log("incrementUrlCount", res);
        })

      if (this.isLoggedIn) {
        const totalUrls = this.currentUser?.totalUrls || 0;
        await this.authService.patchUser({totalUrls: totalUrls + 1})
        this.shortUrlService.updateShortUrlArray(result);
      } else {
        // Save to guest links
        this.shortUrlService.saveGuestLink(result);
        this.loadGuestLinks();
      }

      console.log("result.originalUrl", result.originalUrl);
      const qrCode = await generateQrCode(result.originalUrl);

      this.shortCode = result.shortCode;
      this.shortenedUrl = `${this.apiUrl}/${this.shortCode}`;
      this.qrCodeUrl = qrCode || ''

    } catch (err) {
      console.error('Error saving shortened URL:', err);
      this.error = 'Failed to save URL. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  copyToClipboard(url?: string) {
    const textToCopy = url || this.shortenedUrl;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('URL copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  }

  openUrl() {
    if (this.shortenedUrl) {
      window.open(this.urlForm.value.originalUrl, '_blank');
    }
  }

  shareUrl() {
    if (navigator.share) {
      navigator.share({
        title: 'Check out my shortened link',
        text: 'Here’s a link I shortened:',
        url: this.shortenedUrl,
      })
        .catch(err => console.error('Share failed:', err));
    } else {
      // fallback if not supported
      alert('Sharing not supported on this browser.');
    }
  }

  editQRCode(shortUrl: ShortUrl) {
    console.log('Edit QR Code clicked', shortUrl);
    // TODO: Implement a non-material dialog for QR code editing if needed
  }

  deleteGuestLink(shortCode: string) {
    this.shortUrlService.removeGuestLink(shortCode);
    this.loadGuestLinks();
  }

}
