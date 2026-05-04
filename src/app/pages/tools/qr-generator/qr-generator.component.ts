import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { generateQrCode } from '../../../shared/utils/utils.urls';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
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

            <!-- Ad Space during wait/input -->
            <app-ad-slot slotId="qr_generator_sidebar"></app-ad-slot>
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

            <div class="w-full mt-10 space-y-4">
              <button 
                [disabled]="!qrResult()"
                (click)="downloadQr()"
                class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
              >
                <i class="fas fa-download"></i> Download PNG
              </button>
              
              <p class="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                High Resolution • 300x300 DPI
              </p>
            </div>
          </div>
        </div>

        <!-- Related Tools / Ad Block -->
        <div class="mt-16 pt-16 border-t border-slate-200">
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
    if (!this.qrInput.trim()) {
      this.qrResult.set(null);
      return;
    }

    const res = await generateQrCode(this.qrInput.trim());
    this.qrResult.set(res);
  }

  downloadQr() {
    const res = this.qrResult();
    if (!res) return;

    const link = document.createElement('a');
    link.href = res;
    link.download = `innkie-qr-${Date.now()}.png`;
    link.click();
    
    this.toast.success('QR Code download started!');

    // Log platform event for analytics
    this.metrics.logToolUsage('qr_studio', 'generate');
  }
}
