import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { generateQrCode } from '../../../shared/utils/utils.urls';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Free <span class="text-primary-600">QR Code</span> Generator
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            Create high-resolution, professional QR codes instantly. 
            Completely free and runs entirely in your browser.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <!-- Left: Input Side -->
          <div class="space-y-6">
            <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target URL or Text</label>
                <textarea 
                  [(ngModel)]="qrInput"
                  (ngModelChange)="onInputChange()"
                  placeholder="https://example.com"
                  class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700 min-h-[120px] resize-none"
                ></textarea>
              </div>

              <!-- Dynamic Link Upsell -->
              <div *ngIf="showUpsell()" class="p-5 bg-primary-50 rounded-2xl border border-primary-100 animate-in slide-in-from-top-2 duration-300">
                <div class="flex gap-4">
                  <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-primary-600">
                    <i class="fas fa-magic"></i>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-black text-slate-900">Make it a Dynamic Link?</h4>
                      <p class="text-xs text-slate-500 font-medium leading-relaxed">Dynamic links let you track scan analytics and change the destination URL even after printing.</p>
                    </div>
                    <a [routerLink]="['/tools/link-shortener']" [queryParams]="{ url: qrInput }" 
                       class="inline-flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">
                      Try for Free <i class="fas fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ad Space during wait/input -->
            <app-ad-slot slotId="qr_generator_sidebar" minHeight="250px"></app-ad-slot>
          </div>

          <!-- Right: Preview & Download -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <label class="w-full text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Live Preview</label>
            
            <div class="relative group">
              <div *ngIf="!qrResult()" class="w-64 h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                <i class="fas fa-qrcode text-5xl mb-4 opacity-50"></i>
                <p class="text-sm font-bold">Awaiting input...</p>
              </div>
              
              <div *ngIf="qrResult()" class="p-4 bg-white rounded-3xl shadow-2xl border border-slate-100 transition-transform duration-500 group-hover:scale-105">
                <img [src]="qrResult()" alt="Generated QR Code" class="w-64 h-64 rounded-xl" />
              </div>
            </div>

            <div class="w-full mt-10 space-y-3">
              <button 
                [disabled]="!qrResult()"
                (click)="downloadQr()"
                class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
              >
                <i class="fas fa-download"></i> Download PNG
              </button>

              <div class="grid grid-cols-2 gap-3">
                <button 
                  [disabled]="!qrResult()"
                  (click)="downloadSVG()"
                  class="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                >
                  <i class="fas fa-file-code"></i> SVG Vector
                </button>
                <button 
                  [disabled]="!qrResult()"
                  (click)="copyImage()"
                  class="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <i class="far fa-copy"></i> Copy Image
                </button>
              </div>

              <div class="pt-4 mt-4 border-t border-slate-100">
                <a [routerLink]="['/tools/qr-studio']" [queryParams]="{ data: qrInput }" class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all group">
                  <i class="fas fa-palette group-hover:rotate-12 transition-transform"></i> 
                  Add Logo & Colors
                </a>
              </div>
              
              <p class="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
                High Resolution • Print Ready
              </p>
            </div>
          </div>
        </div>

        <!-- SEO Content Section -->
        <div class="mt-32 space-y-24">
           <!-- How to Generate -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">How to create a QR code?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Generating a high-resolution QR code for your website or business is faster than ever. 
                    Follow this simple guide to get your code ready for print or digital sharing.
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">1</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Enter Data</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Paste your target URL, email, or plain text into the input field. The QR code updates in real-time as you type.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">2</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Customize</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Need colors or a logo? Click 'Add Logo & Colors' to switch to our Pro QR Studio for advanced branding features.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">3</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Download</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Grab your free QR code as a high-quality PNG for web or a scalable SVG vector for high-end printing.</p>
                 </div>
              </div>
           </section>

           <!-- Why iNNkie QR -->
           <section class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div class="space-y-6">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight">Standard vs. Branded QR Codes</h2>
                 <p class="text-slate-500 leading-relaxed font-medium">
                    Our free generator provides classic, highly-compatible QR codes suitable for any standard use case.
                 </p>
                 <div class="space-y-4">
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-check-circle text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Universal Scan-ability</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Classic black-on-white designs are optimized for the fastest possible scans across all mobile devices and lens qualities.</p>
                       </div>
                    </div>
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-expand text-blue-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Vector Formats</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Download in SVG format to ensure your codes never look blurry, even on large billboards or corporate signage.</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div class="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div class="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px]"></div>
                 <h3 class="text-2xl font-black mb-8 tracking-tight">Need a professional look?</h3>
                 <p class="text-slate-400 text-sm leading-relaxed mb-8">
                    Upgrade to our **QR Studio** for free to unlock brand-building features:
                 </p>
                 <ul class="space-y-6">
                    <li class="flex gap-4">
                       <i class="fas fa-palette text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-sm">Custom Colors & Gradients</p>
                          <p class="text-xs text-slate-500 mt-1 font-medium">Match your brand identity with precise hex codes.</p>
                       </div>
                    </li>
                    <li class="flex gap-4">
                       <i class="fas fa-upload text-blue-500 mt-1"></i>
                       <div>
                          <p class="font-black text-sm">Logo Integration</p>
                          <p class="text-xs text-slate-500 mt-1 font-medium">Upload your company logo to the center of your QR.</p>
                       </div>
                    </li>
                 </ul>
                 <a [routerLink]="['/tools/qr-studio']" class="inline-block mt-8 px-8 py-3 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Go to Studio</a>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-4xl mx-auto space-y-12">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Are these QR codes permanent?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Static QR codes generated here never expire. However, if the destination URL changes, the QR code will break. For trackable, editable links, try our Dynamic Links.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Is there a scan limit?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">No. You can scan our generated QR codes an unlimited number of times. There are no registration-based restrictions.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">What data can I encode?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">You can encode website URLs, plain text, Wi-Fi credentials, or email addresses. The tool handles up to 4000 characters, but shorter data scans faster.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Are my codes private?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Yes. The generation happens entirely on your local machine using our secure client-side engine. We don't log the data you type.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools / Ad Block -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">You might also need</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a routerLink="/tools/image-compressor" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <i class="fas fa-file-image"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Image Compressor</h3>
                <p class="text-xs text-slate-500">Shrink images 100% in browser</p>
              </div>
            </a>
            <a routerLink="/tools/utm-builder" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <i class="fas fa-link"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">UTM Link Builder</h3>
                <p class="text-xs text-slate-500">Track your marketing campaigns</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class QrGeneratorComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);

  qrInput: string = '';
  qrResult = signal<string | null>(null);
  showUpsell = signal(false);

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Free QR Code Generator',
      'operatingSystem': 'Any',
      'applicationCategory': 'UtilityApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Create high-resolution, professional QR codes for free. Instantly generate QR codes for URLs, text, and business cards entirely in your browser.'
    };

    this.seo.updateSeo(
      'Free Online QR Code Generator',
      'Create high-resolution, professional QR codes for free. Instantly generate QR codes for URLs, text, and business cards entirely in your browser.',
      '/tools/qr-generator',
      'assets/preview.png',
      schema
    );
  }

  async onInputChange() {
    const input = this.qrInput.trim();
    if (!input) {
      this.qrResult.set(null);
      this.showUpsell.set(false);
      return;
    }

    const res = await generateQrCode(input);
    this.qrResult.set(res);

    // Show upsell if it's a valid URL
    const isUrl = input.startsWith('http://') || input.startsWith('https://');
    this.showUpsell.set(isUrl);
  }

  downloadQr() {
    const res = this.qrResult();
    if (!res) return;

    const link = document.createElement('a');
    link.href = res;
    link.download = `innkie-qr-${Date.now()}.png`;
    link.click();
    
    this.toast.success('QR Code download started!');
    this.metrics.logToolUsage('qr_studio', 'generate');
  }

  async downloadSVG() {
    const input = this.qrInput.trim();
    if (!input) return;

    try {
      const svgString = await QRCode.toString(input, {
        type: 'svg',
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `innkie-qr-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      this.toast.success('SVG Vector download started!');
      this.metrics.logToolUsage('qr_studio', 'generate');
    } catch (e) {
      this.toast.error('Failed to generate SVG');
    }
  }

  async copyImage() {
    const res = this.qrResult();
    if (!res) return;

    try {
      const response = await fetch(res);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      this.toast.success('QR Code copied to clipboard!');
    } catch (e) {
      console.error('Copy failed', e);
      this.toast.error('Failed to copy image. Try downloading instead.');
    }
  }
}
