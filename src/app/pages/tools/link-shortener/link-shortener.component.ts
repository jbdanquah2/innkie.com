import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../shared/services/auth.service';
import { ShortUrlService } from '../../../shared/services/short-url.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { AppUser, ShortUrl } from '@innkie/shared-models';
import { generateQrCode } from '../../../shared/utils/utils.urls';
import { LogoComponent } from '../../../logo/logo.component';
import { LinkCardComponent } from '../../../dashboard/link-card/link-card.component';

@Component({
  selector: 'app-link-shortener',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LinkCardComponent,
    LogoComponent
  ],
  templateUrl: './link-shortener.component.html',
  styleUrl: './link-shortener.component.scss'
})
export class LinkShortenerComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private shortUrlService = inject(ShortUrlService);
  private loading: LoadingService = inject(LoadingService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);

  urlForm: FormGroup;
  apiUrl = environment.appUrl;
  isLoading = false;
  shortenedUrl: string | undefined;
  shortCode: string | undefined;
  qrCodeUrl: string | null = null;
  imagePreview: any;
  currentUser: AppUser = {} as AppUser;
  userId: string | null = null;
  previouslyShortened: boolean = false;
  existingUrl: ShortUrl | undefined = undefined;
  isLoggedIn: boolean = false;
  recentGuestLinks: ShortUrl[] = [];

  constructor(private fb: FormBuilder) {
    this.urlForm = this.fb.group({
      originalUrl: ['', [Validators.required, Validators.pattern('https?://.*')]]
    });
  }

  ngOnInit() {
    // Check for URL in query params (e.g. from UTM builder)
    const prefilledUrl = this.route.snapshot.queryParamMap.get('url');
    if (prefilledUrl) {
      this.urlForm.patchValue({ originalUrl: prefilledUrl });
      this.getPreview();
    }

    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (user) => {
        this.isLoggedIn = !!user;
        if (!this.isLoggedIn) {
          this.loadGuestLinks();
        }
      });
    }

    this.themeService.resetTheme();
    
    const schema = [
      {
        '@type': 'SoftwareApplication',
        'name': 'iNNkie Free URL Shortener',
        'operatingSystem': 'Any',
        'applicationCategory': 'BusinessApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'description': 'Shorten links and track smarter with iNNkie. Advanced analytics, custom aliases, and secure redirects for modern teams.'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Do my links expire?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Never. Links shortened on iNNkie stay active permanently unless you manually delete them from your dashboard.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is it free to use?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, the basic shortener is completely free. You can shorten links as a guest or create a free account to track analytics.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can I create branded short links?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Branded link management is supported for Pro workspaces. This allows you to use your own brand identity in your short links.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What is a Dynamic Link?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A dynamic link is a short URL that can be redirected to a new destination after it has been shared. It also provides advanced click tracking.'
            }
          }
        ]
      },
      this.seo.getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: 'URL Shortener', url: '/tools/link-shortener' }
      ])
    ];

    this.seo.updateSeo(
      'Free Premium URL Shortener & Analytics',
      'Shorten links and track smarter with iNNkie. Advanced analytics, custom aliases, and secure redirects for modern teams.',
      '/tools/link-shortener',
      'assets/preview.png',
      schema
    );

    this.currentUser = this.authService.currentUser as AppUser;
    this.userId = this.currentUser?.uid;

    if (this.userId && this.shortUrlService.getAll.length <= 1) {
      this.shortUrlService.getUserShortUrls(this.userId)
        .then(res => {
          this.shortUrlService.updateAllShortUrlsArray(res);
        })
    } else {
      this.loadGuestLinks();
    }
  }

  loadGuestLinks() {
    this.recentGuestLinks = this.shortUrlService.getGuestLinks();
  }

  ngOnDestroy() {}

  async getPreview() {
    if (this.urlForm.invalid) {
      if (!this.urlForm.value?.originalUrl) return;
      this.toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      const res: any = await firstValueFrom(this.http.get(environment.previewLongURL + '?longUrl=' + encodeURIComponent(this.urlForm.value?.originalUrl)));
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
      this.toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    this.isLoading = true;
    const originalUrl = this.urlForm.value?.originalUrl.trim();

    try {
      const result = await this.shortUrlService.createShortUrl(originalUrl);

      if (this.isLoggedIn) {
        this.existingUrl = this.shortUrlService.getAll.find(url => url.id === result.id);
      } else {
        this.loadGuestLinks();
        this.existingUrl = this.recentGuestLinks.find(url => url.id === result.id);
      }

      // Check if it was already shortened (service returns existing if found)
      if (result.shortCode === this.shortCode) {
         this.previouslyShortened = true;
      }

      const qrCode = await generateQrCode(result.originalUrl);
      this.shortCode = result.shortCode;
      this.shortenedUrl = `${this.apiUrl}/${this.shortCode}`;
      this.qrCodeUrl = qrCode || '';
      this.toast.success('URL successfully shortened!');
    } catch (err) {
      // Error handled by service toast
    } finally {
      this.isLoading = false;
    }
  }

  copyToClipboard(url?: string) {
    const textToCopy = url || this.shortenedUrl;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => this.toast.success('URL copied to clipboard!'))
        .catch(() => this.toast.error('Failed to copy URL.'));
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
      }).catch(err => console.error('Share failed:', err));
    } else {
      this.toast.info('Sharing not supported on this browser.');
    }
  }

  editQRCode(shortUrl: ShortUrl) {
    this.router.navigate(['/tools/qr-studio']);
  }

  deleteGuestLink(shortCode: string) {
    this.shortUrlService.removeGuestLink(shortCode);
    this.loadGuestLinks();
    this.toast.success('Guest link removed.');
  }
}
