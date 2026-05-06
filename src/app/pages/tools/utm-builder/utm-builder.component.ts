import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-utm-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
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
                (ngModelChange)="generateUrl()"
                placeholder="https://example.com"
                class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Source *</label>
                <input 
                  [(ngModel)]="source"
                  (ngModelChange)="generateUrl()"
                  placeholder="google, newsletter"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Medium *</label>
                <input 
                  [(ngModel)]="medium"
                  (ngModelChange)="generateUrl()"
                  placeholder="cpc, email, social"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Name *</label>
              <input 
                [(ngModel)]="name"
                (ngModelChange)="generateUrl()"
                placeholder="spring_sale"
                class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Term</label>
                <input 
                  [(ngModel)]="term"
                  (ngModelChange)="generateUrl()"
                  placeholder="running_shoes"
                  class="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Content</label>
                <input 
                  [(ngModel)]="content"
                  (ngModelChange)="generateUrl()"
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

              <div class="w-full grid grid-cols-1 gap-3">
                <button 
                  [disabled]="!finalUrl()"
                  (click)="copyUrl()"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                  <i class="fas fa-copy"></i> Copy to Clipboard
                </button>
                <button 
                  [disabled]="!finalUrl()"
                  (click)="shorten()"
                  class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                >
                  <i class="fas fa-compress-arrows-alt"></i> Shorten this Link
                </button>
              </div>
            </div>

            <!-- Ad Space -->
            <app-ad-slot slotId="utm_builder_sidebar" minHeight="250px"></app-ad-slot>
          </div>
        </div>

        <!-- Related Tools -->
        <div class="mt-16 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Complementary Tools</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

  baseUrl: string = '';
  source: string = '';
  medium: string = '';
  name: string = '';
  term: string = '';
  content: string = '';

  finalUrl = signal<string>('');

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Free UTM Link Builder',
      'operatingSystem': 'Any',
      'applicationCategory': 'BusinessApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Generate tracking URLs with Google Analytics UTM parameters easily. iNNkie UTM Builder helps you track marketing campaigns with source, medium, and campaign parameters.'
    };

    this.seo.updateSeo(
      'Free Online UTM Link Builder | Campaign Tracker',
      'Generate tracking URLs with Google Analytics UTM parameters easily. iNNkie UTM Builder helps you track marketing campaigns with source, medium, and campaign parameters.',
      '/tools/utm-builder',
      'assets/preview.png',
      schema
    );
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

      this.finalUrl.set(url.toString());
    } catch (e) {
      this.finalUrl.set('');
    }
  }

  copyUrl() {
    const url = this.finalUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    this.toast.success('UTM link copied to clipboard!');

    // Log platform event for analytics
    this.metrics.logToolUsage('utm_builder', 'generate');
  }

  shorten() {
    const url = this.finalUrl();
    if (!url) return;
    
    // Redirect to link shortener with the generated URL
    window.location.href = `/tools/link-shortener?url=${encodeURIComponent(url)}`;
  }
}
