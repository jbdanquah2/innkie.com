import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ShortUrlService } from '../../../shared/services/short-url.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { GuideCalloutComponent } from '../../../shared/components/guide-callout/guide-callout.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-utm-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, RouterLink, GuideCalloutComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Free <span class="text-primary-600">UTM</span> Link Builder
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            Generate tracking URLs with Google Analytics UTM parameters to track your marketing campaigns accurately.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <!-- Left: Input Side -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Website URL *</label>
              <input 
                [(ngModel)]="baseUrl"
                (ngModelChange)="onInputsChanged()"
                placeholder="https://example.com"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Source *</label>
                <input 
                  [(ngModel)]="source"
                  (ngModelChange)="onInputsChanged()"
                  placeholder="google, newsletter"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Medium *</label>
                <input 
                  [(ngModel)]="medium"
                  (ngModelChange)="onInputsChanged()"
                  placeholder="cpc, email, social"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Name *</label>
              <input 
                [(ngModel)]="name"
                (ngModelChange)="onInputsChanged()"
                placeholder="spring_sale"
                class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Term</label>
                <input 
                  [(ngModel)]="term"
                  (ngModelChange)="onInputsChanged()"
                  placeholder="running_shoes"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Content</label>
                <input 
                  [(ngModel)]="content"
                  (ngModelChange)="onInputsChanged()"
                  placeholder="logolink"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>
            
            <p class="text-[10px] text-slate-400 font-bold uppercase italic">
              * Required fields
            </p>
          </div>

          <!-- Right: Output & Result -->
          <div class="space-y-6 lg:sticky lg:top-24">
            <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
              <label class="w-full text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Generated Campaign URL</label>
              
              <div class="w-full p-6 bg-slate-900 rounded-3xl shadow-inner mb-8 overflow-hidden">
                <p class="text-emerald-400 font-mono text-sm break-all leading-relaxed h-24 overflow-y-auto custom-scrollbar">
                  {{ finalUrl() || 'URL will appear here...' }}
                </p>
              </div>

              <!-- Result Card -->
              <div *ngIf="shortenedUrl()" class="w-full mb-8 p-5 bg-primary-50 border border-primary-100 rounded-2xl animate-in zoom-in-95 duration-300">
                <label class="block text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Short Link Ready</label>
                <div class="flex items-center justify-between gap-4">
                  <p class="text-sm font-black text-slate-900 truncate">{{ shortenedUrl() }}</p>
                  <button (click)="copyToClipboard(shortenedUrl())" class="shrink-0 w-8 h-8 bg-white border border-primary-200 text-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                    <i class="fas fa-copy text-xs"></i>
                  </button>
                </div>
              </div>

              <!-- Custom Alias Input (Before shortening) -->
              <div *ngIf="!shortenedUrl()" class="w-full mb-6 space-y-2">
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custom Alias (Optional)</label>
                 <div class="flex">
                    <span class="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      innkie.com/
                    </span>
                    <input type="text" [(ngModel)]="customAlias"
                           placeholder="campaign-slug"
                           class="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-slate-700 text-sm" />
                 </div>
              </div>

              <div class="w-full grid grid-cols-1 gap-3">
                <button 
                  [disabled]="!finalUrl()"
                  (click)="copyToClipboard(finalUrl())"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                  <i class="fas fa-copy"></i> Copy to Clipboard
                </button>
                
                <button 
                  *ngIf="!shortenedUrl()"
                  [disabled]="!finalUrl() || isShortening()"
                  (click)="shorten()"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                  <i class="fas" [ngClass]="isShortening() ? 'fa-circle-notch animate-spin' : 'fa-compress-arrows-alt'"></i> 
                  {{ isShortening() ? 'Shortening...' : 'Shorten this Link' }}
                </button>
                
                <a *ngIf="shortenedUrl() && isLoggedIn()" [routerLink]="['/dashboard/details', shortCode()]" class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
                  <i class="fas fa-cog"></i> Manage Link
                </a>

                <div *ngIf="shortenedUrl() && !isLoggedIn()" class="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                  <p class="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Want to track this link?</p>
                  <a [routerLink]="['/login']" [queryParams]="{ signUp: true }" class="text-xs font-black text-amber-600 hover:text-amber-800 underline decoration-2 underline-offset-4">Create a Free Account</a>
                </div>
              </div>
            </div>

            <!-- Ad Space -->
            <app-ad-slot slotId="utm_builder_sidebar" minHeight="250px"></app-ad-slot>
          </div>
        </div>

        <!-- Related Guide -->
        <app-guide-callout toolRoute="/tools/utm-builder" class="mt-16 block"></app-guide-callout>

        <!-- SEO Content Section -->
        <div class="mt-32 space-y-24">
           <!-- What is UTM? -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">What is a UTM Link?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    UTM (Urchin Tracking Module) parameters are simple tags added to the end of a URL to track the effectiveness of your marketing campaigns across different traffic sources and media.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div class="space-y-4">
                    <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                       <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Precise Attribution</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">
                       Know exactly where your traffic is coming from. Whether it's a social media post, an email newsletter, or a paid ad, UTM links provide granular data in Google Analytics.
                    </p>
                 </div>
                 <div class="space-y-4">
                    <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                       <i class="fas fa-bullseye"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Campaign Optimization</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">
                       Identify which campaigns are performing best and which need adjustment. Optimize your marketing spend by focusing on the channels that drive the most conversions.
                    </p>
                 </div>
              </div>
           </section>

           <!-- Explaining Parameters -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">Understanding UTM Parameters</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 class="text-sm font-black text-primary-600 uppercase tracking-widest mb-2">utm_source</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The platform or vendor where the traffic originates (e.g., google, facebook, newsletter).</p>
                 </div>
                 <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 class="text-sm font-black text-primary-600 uppercase tracking-widest mb-2">utm_medium</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The marketing medium used (e.g., cpc, email, social_post, organic).</p>
                 </div>
                 <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 class="text-sm font-black text-primary-600 uppercase tracking-widest mb-2">utm_campaign</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The specific campaign name or promo code you are tracking (e.g., summer_sale_2026).</p>
                 </div>
                 <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 class="text-sm font-black text-primary-600 uppercase tracking-widest mb-2">utm_content / utm_term</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Used for A/B testing (content) or tracking specific keywords (term) in paid search.</p>
                 </div>
              </div>
           </section>

           <!-- FAQ Section -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">UTM Builder FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Are UTM links permanent?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Yes, UTM parameters are just part of the URL. As long as the destination website supports them (like any site with Google Analytics), they will work indefinitely.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Do UTM links affect SEO?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Generally, no. Most modern websites use canonical tags to tell search engines which version of a page is the primary one, preventing duplicate content issues caused by UTM parameters.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Can I shorten UTM links?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Absolutely! Shortening a long UTM link makes it cleaner for social media or print while still preserving all the tracking data for your analytics.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Complementary Tools</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/link-shortener" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <i class="fas fa-link"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">URL Shortener</h3>
                <p class="text-xs text-slate-500">Shrink and track your campaign links</p>
              </div>
            </a>
            <a routerLink="/tools/qr-generator" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <i class="fas fa-qrcode"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">QR Code Generator</h3>
                <p class="text-xs text-slate-500">Create QR codes for your UTM links</p>
              </div>
            </a>
            <a routerLink="/tools/qr-studio" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <i class="fas fa-palette"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Branded QR Studio</h3>
                <p class="text-xs text-slate-500">Professional custom branded QRs</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
  `]
})
export class UtmBuilderComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);

  baseUrl: string = '';
  source: string = '';
  medium: string = '';
  name: string = '';
  term: string = '';
  content: string = '';
  customAlias: string = '';

  finalUrl = signal<string>('');
  shortenedUrl = signal<string>('');
  shortCode = signal<string>('');
  isShortening = signal<boolean>(false);
  isLoggedIn = signal<boolean>(false);

  ngOnInit() {
    this.isLoggedIn.set(!!this.authService.currentUser);
    const schema = [{
      '@type': 'SoftwareApplication',
      '@id': 'https://innkie.com/tools/utm-builder#app',
      'name': 'iNNkie Free UTM Link Builder',
      'url': 'https://innkie.com/tools/utm-builder',
      'operatingSystem': 'Any',
      'applicationCategory': 'BusinessApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Generate tracking URLs with Google Analytics UTM parameters easily. iNNkie UTM Builder helps you track marketing campaigns with source, medium, and campaign parameters.'
    }, {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Are UTM links permanent?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. UTM parameters are part of the URL and will work indefinitely as long as the destination website supports them.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Do UTM links affect SEO?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Generally, no. Most modern websites use canonical tags to identify the primary page and avoid duplicate content issues from UTM parameters.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Can I shorten UTM links?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Shortening a long UTM link makes it cleaner for social media or print while preserving tracking data for analytics.'
          }
        }
      ]
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'UTM Link Builder', url: '/tools/utm-builder' }
    ])];

    this.seo.updateSeo(
      'UTM Link Builder',
      'Generate tracking URLs with Google Analytics UTM parameters easily. iNNkie UTM Builder helps you track marketing campaigns with source, medium, and campaign parameters.',
      '/tools/utm-builder',
      'assets/preview.png',
      schema
    );
  }

  onInputsChanged() {
    this.shortenedUrl.set(''); // Clear previous short link if parameters change
    this.generateUrl();
  }

  generateUrl() {
    if (!this.baseUrl.trim() || !this.source.trim() || !this.medium.trim() || !this.name.trim()) {
      this.finalUrl.set('');
      return;
    }

    try {
      const url = new URL(this.baseUrl.startsWith('http') ? this.baseUrl : `https://${this.baseUrl}`);
      url.searchParams.set('utm_source', this.source);
      url.searchParams.set('utm_medium', this.medium);
      url.searchParams.set('utm_campaign', this.name);
      
      if (this.term) url.searchParams.set('utm_term', this.term);
      if (this.content) url.searchParams.set('utm_content', this.content);

      const generated = url.toString();
      if (generated !== this.finalUrl()) {
        this.metrics.logToolUsage('utm_builder', 'generate');
      }
      this.finalUrl.set(generated);
    } catch (e) {
      this.finalUrl.set('');
    }
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.toast.success('Copied to clipboard!');

    // No longer logging tool usage for 'copy' to reduce dashboard noise
  }

  async shorten() {
    const url = this.finalUrl();
    if (!url) return;
    
    this.isShortening.set(true);
    try {
      const result = await this.shortUrlService.createShortUrl(url, null, this.customAlias);
      this.shortenedUrl.set(`${environment.appUrl}/${result.shortCode}`);
      this.shortCode.set(result.shortCode);
    } catch (err) {
      // Error handled by service toast
    } finally {
      this.isShortening.set(false);
    }
  }
}
