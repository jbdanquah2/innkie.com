import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Free <span class="text-primary-600">JSON</span> Formatter & Validator
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            Clean, validate, and format your JSON data instantly. 
            All processing happens locally in your browser.
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 h-[600px]">
          
          <!-- Input Area -->
          <div class="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input JSON</span>
              <button (click)="clear()" class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">Clear</button>
            </div>
            <textarea 
              [(ngModel)]="jsonInput"
              (ngModelChange)="onInputChange()"
              placeholder="Paste your JSON here..."
              class="flex-1 w-full p-6 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none"
            ></textarea>
          </div>

          <!-- Controls (Mobile: Row, Desktop: Column) -->
          <div class="flex lg:flex-col justify-center gap-4 py-4">
            <button 
              (click)="format()"
              class="w-12 h-12 lg:w-16 lg:h-16 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center hover:bg-primary-700 transition-all active:scale-95"
              title="Format JSON"
            >
              <i class="fas fa-magic text-xl"></i>
            </button>
            <button 
              (click)="minify()"
              class="w-12 h-12 lg:w-16 lg:h-16 bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center hover:bg-slate-900 transition-all active:scale-95"
              title="Minify JSON"
            >
              <i class="fas fa-compress text-xl"></i>
            </button>
          </div>

          <!-- Output Area -->
          <div class="flex-1 flex flex-col bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative">
            <div class="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">Formatted Output</span>
              <div class="flex gap-4">
                <button (click)="copy()" class="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors">Copy</button>
              </div>
            </div>
            
            <pre class="flex-1 p-6 font-mono text-sm text-emerald-400 overflow-auto whitespace-pre-wrap"><code>{{ jsonOutput() || '// Output will appear here...' }}</code></pre>
            
            <!-- Error Badge -->
            <div *ngIf="error()" class="absolute bottom-6 left-6 right-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl backdrop-blur-md animate-in slide-in-from-bottom-2">
              <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-triangle text-rose-500"></i>
                <p class="text-xs font-bold text-rose-200">{{ error() }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ad Slot Bottom -->
        <app-ad-slot slotId="json_formatter_bottom"></app-ad-slot>

      </div>
    </div>
  `
})
export class JsonFormatterComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);

  jsonInput: string = '';
  jsonOutput = signal<string>('');
  error = signal<string | null>(null);

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Free JSON Formatter & Validator',
      'operatingSystem': 'Any',
      'applicationCategory': 'DeveloperApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Clean, validate, and format your JSON data instantly. iNNkie Free JSON Tool offers pretty-printing, minification, and syntax validation entirely in your browser.'
    };

    this.seo.updateSeo(
      'Free Online JSON Formatter & Validator',
      'Clean, validate, and format your JSON data instantly. iNNkie Free JSON Tool offers pretty-printing, minification, and syntax validation entirely in your browser.',
      '/tools/json-formatter',
      'assets/preview.png',
      schema
    );
  }

  onInputChange() {
    if (!this.jsonInput.trim()) {
      this.jsonOutput.set('');
      this.error.set(null);
    }
  }

  format() {
    if (!this.jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonOutput.set(JSON.stringify(parsed, null, 2));
      this.error.set(null);
      this.toast.success('JSON formatted successfully!');

      // Log platform event for analytics
      this.metrics.logToolUsage('json_formatter', 'format');
    } catch (e: any) {
      this.error.set(e.message);
      this.toast.error('Invalid JSON structure');
    }
  }

  minify() {
    if (!this.jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonOutput.set(JSON.stringify(parsed));
      this.error.set(null);
      this.toast.success('JSON minified successfully!');

      // Log platform event for analytics
      this.metrics.logToolUsage('json_formatter', 'minify');
    } catch (e: any) {
      this.error.set(e.message);
      this.toast.error('Invalid JSON structure');
    }
  }

  copy() {
    const output = this.jsonOutput();
    if (!output) return;
    navigator.clipboard.writeText(output);
    this.toast.success('Copied to clipboard!');
  }

  clear() {
    this.jsonInput = '';
    this.jsonOutput.set('');
    this.error.set(null);
  }
}
