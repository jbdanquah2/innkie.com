import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { generateQrCode } from '../../../shared/utils/utils.urls';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { RelatedToolsComponent } from '../../../shared/components/related-tools/related-tools.component';
import { ToolAlias, TOOL_REGISTRY, ToolFaq, UtilityTool } from '../../../shared/config/tool-registry';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, RouterLink, RelatedToolsComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {{ pageName }}
          </h1>
          <p class="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            {{ pageDescription }}
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
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">How to create a QR code</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Generate a high-resolution QR code for a website, campaign, menu, document, or plain text in a few steps.
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">1</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Enter Data</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Paste a URL, short message, email, Wi-Fi details, or any supported text into the QR input.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">2</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Preview Instantly</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">The QR code updates as you type, so you can confirm the content before downloading.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">3</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Download</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Save a PNG for quick sharing or export SVG when you need crisp print-ready vector output.</p>
                 </div>
              </div>
           </section>

           <!-- Why iNNkie QR -->
           <section class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div class="space-y-6">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight">Standard vs. branded QR codes</h2>
                 <p class="text-slate-500 leading-relaxed font-medium">
                    Standard static QR codes are fast and reliable for simple destinations. Branded QR codes help campaigns look more polished when color, logo, and design control matter.
                 </p>
                 <div class="space-y-4">
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-check-circle text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Fast static codes</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Classic black-on-white QR codes are widely compatible and scan quickly across modern phones.</p>
                       </div>
                    </div>
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-expand text-blue-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Print-ready exports</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">SVG export keeps QR edges sharp for menus, signage, packaging, and presentation materials.</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div class="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div class="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px]"></div>
                 <h3 class="text-2xl font-black mb-8 tracking-tight">Need a branded QR code?</h3>
                 <p class="text-slate-400 text-sm leading-relaxed mb-8">
                    Use QR Studio when you want brand colors, gradients, and a logo in the center of the code.
                 </p>
                 <ul class="space-y-6">
                    <li class="flex gap-4">
                       <i class="fas fa-palette text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-sm">Custom colors</p>
                          <p class="text-xs text-slate-500 mt-1 font-medium">Match codes to campaign visuals, packaging, and event materials.</p>
                       </div>
                    </li>
                    <li class="flex gap-4">
                       <i class="fas fa-upload text-blue-500 mt-1"></i>
                       <div>
                          <p class="font-black text-sm">Logo support</p>
                          <p class="text-xs text-slate-500 mt-1 font-medium">Add a centered mark for more recognizable branded scans.</p>
                       </div>
                    </li>
                 </ul>
                 <a [routerLink]="['/tools/qr-studio']" class="inline-block mt-8 px-8 py-3 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Go to Studio</a>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-4xl mx-auto space-y-12 pb-20">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2" *ngFor="let faq of pageFaqs">
                    <h4 class="font-black text-slate-800 text-sm">{{ faq.question }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">{{ faq.answer }}</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <app-related-tools 
          *ngIf="currentTool"
          [category]="currentTool.category" 
          [excludeId]="currentTool.id">
        </app-related-tools>

      </div>
    </div>
  `
})
export class QrGeneratorComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);
  private router = inject(Router);

  qrInput: string = '';
  qrResult = signal<string | null>(null);
  showUpsell = signal(false);
  currentTool: UtilityTool | undefined;
  currentAlias: ToolAlias | undefined;
  pageName = 'QR Code Generator';
  pageDescription = 'Create high-resolution, professional QR codes instantly. Completely free and runs entirely in your browser.';
  pageFaqs: ToolFaq[] = [];

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];
    this.currentTool = TOOL_REGISTRY.find(t => t.route === currentPath || t.aliases?.some(a => a.path === currentPath));
    this.currentAlias = this.currentTool?.aliases?.find(a => a.path === currentPath);
    
    const pageTitle = this.currentAlias?.title || this.currentTool?.seo.title || 'Free Online QR Code Generator';
    const pageDesc = this.currentAlias?.description || this.currentTool?.seo.description || 'Create high-resolution, professional QR codes for free.';
    this.pageName = this.currentAlias?.h1 || this.currentAlias?.name || this.currentTool?.name || 'QR Code Generator';
    this.pageDescription = this.currentAlias?.intro || this.currentAlias?.description || this.currentTool?.description || 'Create high-resolution, professional QR codes instantly.';
    this.pageFaqs = this.currentAlias?.faqs || this.currentTool?.faqs || [];

    const schema = [{
      '@type': 'SoftwareApplication',
      '@id': `https://innkie.com${currentPath}#app`,
      'name': pageTitle,
      'url': `https://innkie.com${currentPath}`,
      'operatingSystem': 'Any',
      'applicationCategory': 'UtilityApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': pageDesc
    }, {
      '@type': 'FAQPage',
      'mainEntity': this.pageFaqs.map(f => ({
        '@type': 'Question',
        'name': f.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.answer
        }
      }))
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: this.currentAlias?.name || this.currentTool?.name || 'QR Code Generator', url: currentPath }
    ])];

    this.seo.updateSeo({
      title: pageTitle,
      description: pageDesc,
      path: currentPath,
      image: this.currentAlias?.image || this.currentTool?.seo.image || 'assets/preview.png',
      schema,
      keywords: this.currentTool?.seo.keywords
    });
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
