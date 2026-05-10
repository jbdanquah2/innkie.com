import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-base64-encoder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Base64 <span class="text-primary-600">Encoder</span> & Decoder
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Fast, secure, and bidirectional Base64 transformation. 100% browser-side processing ensures your sensitive data never leaves your machine.
          </p>
        </div>

        <!-- Configuration Bar -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
           <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div class="flex flex-wrap gap-8">
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
                    <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                       <button (click)="setMode('encode')" [class.bg-white]="mode() === 'encode'" [class.shadow-sm]="mode() === 'encode'" class="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all">Encode</button>
                       <button (click)="setMode('decode')" [class.bg-white]="mode() === 'decode'" [class.shadow-sm]="mode() === 'decode'" class="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all">Decode</button>
                    </div>
                 </div>
              </div>

              <div class="flex items-center gap-3">
                 <button (click)="clear()" class="px-4 py-2 text-slate-400 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all">
                    Clear Workspace
                 </button>
                 <button (click)="download()" [disabled]="!outputValue()" class="px-6 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-30 disabled:grayscale">
                    <i class="fas fa-download mr-2"></i> Download Result
                 </button>
              </div>
           </div>
        </div>

        <!-- Main Workspace -->
        <div class="flex flex-col lg:flex-row gap-6 lg:h-[600px]">
          
          <!-- Input Area -->
          <div class="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[350px] lg:min-h-0">
            <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Input {{ mode() === 'encode' ? 'Raw Text' : 'Base64' }}
                </span>
                <span class="text-[9px] font-bold text-slate-300 px-2 py-0.5 bg-white border border-slate-100 rounded-full">{{ inputValue.length | number }} chars</span>
              </div>
              <button (click)="loadSample()" class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-all">Load Sample</button>
            </div>
            <textarea 
              [(ngModel)]="inputValue"
              (ngModelChange)="process()"
              [placeholder]="placeholderText()"
              class="flex-1 w-full p-8 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none leading-relaxed custom-scrollbar"
            ></textarea>
          </div>

          <!-- Output Area -->
          <div class="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[350px] lg:min-h-0">
            <div class="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {{ mode() === 'encode' ? 'Base64 Result' : 'Decoded Result' }}
                </span>
                <span *ngIf="outputValue()" class="text-[9px] font-bold text-white/20 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full">{{ outputValue().length | number }} chars</span>
              </div>
              <div class="flex items-center gap-3">
                @if (isUrl()) {
                  <a [href]="outputValue()" target="_blank" class="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                    <i class="fas fa-external-link-alt"></i> Open Link
                  </a>
                }
                <button (click)="copy()" [disabled]="!outputValue()" class="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2 disabled:opacity-20">
                   <i class="far fa-copy"></i> Copy Result
                </button>
              </div>
            </div>
            
            <div class="flex-1 overflow-auto p-8 custom-scrollbar">
               @if (outputValue()) {
                 <div class="relative group">
                    <pre class="font-mono text-sm leading-relaxed whitespace-pre-wrap" 
                         [class.text-emerald-400]="!isJson()" 
                         [class.text-blue-300]="isJson()"><code>{{ outputValue() }}</code></pre>
                    
                    @if (isJson()) {
                      <div class="absolute top-0 right-0 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest">
                        JSON Detected
                      </div>
                    }
                 </div>
               } @else if (!error()) {
                 <div class="text-white/20 font-mono text-sm italic">// Transformation results will appear here...</div>
               }
               
               @if (error()) {
                 <div class="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div class="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-xl">
                       <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="space-y-1">
                       <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Decoding Error</p>
                       <p class="text-xs font-bold text-rose-200/80 leading-relaxed max-w-[250px] mx-auto">{{ error() }}</p>
                    </div>
                 </div>
               }
            </div>
          </div>
        </div>

        <!-- Ad Slot Bottom -->
        <app-ad-slot slotId="base64_bottom" minHeight="90px" class="mt-12 block"></app-ad-slot>

        <!-- SEO / Info Section -->
        <div class="mt-32 space-y-24">
           <!-- Why use iNNkie Base64 -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">Why use iNNkie's Base64 Utility?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Security is paramount when handling data. Most online tools send your strings to their servers for processing. iNNkie's Base64 engine runs **100% in your browser**, ensuring your passwords, tokens, and data stay private.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">100% Secure</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">No data is ever transmitted to a server. Processing happens entirely in your local RAM.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-globe"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">UTF-8 Support</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Robust encoding for special characters, emojis, and international text without data loss.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Zero Latency</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Instant real-time conversion as you type. No waiting for uploads or network responses.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Use Base64</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Toggle between <strong>Encode</strong> (text to Base64) or <strong>Decode</strong> (Base64 back to text).</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Paste your input into the left workspace. The result will appear instantly on the right.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Use the <strong>Copy</strong> button to grab your result or <strong>Download</strong> it as a .txt file.</p>
                    </div>
                 </div>
                 <div class="bg-primary-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <h3 class="text-2xl font-black mb-4 tracking-tight">What is Base64?</h3>
                    <p class="text-primary-100 text-sm leading-relaxed mb-6">
                       Base64 is a group of binary-to-text encoding schemes that represent binary data in an ASCII string format. 
                       It is widely used to embed images in HTML/CSS, send binary data over text-based protocols (like email), 
                       or store complex strings in configuration files.
                    </p>
                    <div class="h-1 w-12 bg-white/20 rounded-full"></div>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Is this tool free to use?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Yes, iNNkie's Base64 utility is 100% free and open for everyone. All processing happens on your device.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Can I encode files?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">This tool is optimized for text and strings. For media optimization and conversion, please use our <strong>Media Hub</strong> tools.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Why did my decoding fail?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Base64 strings must follow a specific character set (A-Z, a-z, 0-9, +, /, =). If your input contains other characters or is incomplete, decoding will fail.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Developer Workspace</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/jwt-decoder" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">JWT Decoder</h3>
                <p class="text-xs text-slate-500">Secure client-side token inspection</p>
              </div>
            </a>
            <a routerLink="/tools/json-formatter" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-code"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">JSON Formatter</h3>
                <p class="text-xs text-slate-500">Beautify and validate JSON data</p>
              </div>
            </a>
            <a routerLink="/tools/csv-json-converter" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-table"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">CSV <> JSON Converter</h3>
                <p class="text-xs text-slate-500">Bi-directional transformation</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    
    /* Input Area (Light) */
    .bg-white .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(0,0,0,0.05); 
      border-radius: 20px; 
      border: 2px solid white;
    }
    .bg-white .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }

    /* Output Area (Dark) */
    .bg-slate-900 .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(255,255,255,0.1); 
      border-radius: 20px;
      border: 2px solid #0f172a;
    }
    .bg-slate-900 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  `]
})
export class Base64EncoderComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);

  mode = signal<'encode' | 'decode'>('encode');
  inputValue = '';
  outputValue = signal('');
  error = signal<string | null>(null);

  isJson = signal(false);
  isUrl = computed(() => {
    const val = this.outputValue().trim();
    return val.startsWith('http://') || val.startsWith('https://');
  });

  placeholderText = computed(() => {
    return this.mode() === 'encode' 
      ? 'Paste your raw text here to encode...' 
      : 'Paste your Base64 string here to decode...';
  });

  ngOnInit() {
    const schema = [{
      '@type': 'SoftwareApplication',
      '@id': 'https://innkie.com/tools/base64-encoder#app',
      'name': 'iNNkie Base64 Encoder & Decoder',
      'url': 'https://innkie.com/tools/base64-encoder',
      'operatingSystem': 'Any',
      'applicationCategory': 'DeveloperApplication',
      'description': 'Securely encode and decode Base64 data locally in your browser. Supports UTF-8 strings and special characters with 100% privacy.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'Base64 Encoder', url: '/tools/base64-encoder' }
    ])];

    this.seo.updateSeo(
      'Base64 Encoder & Decoder',
      'Encode and decode Base64 strings securely in your browser. 100% client-side processing ensures your sensitive data is never sent to a server.',
      '/tools/base64-encoder',
      'assets/preview.png',
      schema
    );
  }

  setMode(newMode: 'encode' | 'decode') {
    this.mode.set(newMode);
    this.process();
  }

  process() {
    const raw = this.inputValue.trim();
    if (!raw) {
      this.outputValue.set('');
      this.error.set(null);
      this.isJson.set(false);
      return;
    }

    try {
      if (this.mode() === 'encode') {
        this.encode(raw);
      } else {
        this.decode(raw);
      }
      this.error.set(null);
    } catch (e: any) {
      this.error.set(this.mode() === 'decode' ? 'Invalid Base64 format or encoding issue.' : 'Encoding failed.');
      this.outputValue.set('');
      this.isJson.set(false);
    }
  }

  private encode(str: string) {
    // Robust UTF-8 safe encoding
    const encoded = btoa(unescape(encodeURIComponent(str)));
    this.outputValue.set(encoded);
    this.isJson.set(false);
    this.metrics.logToolUsage('base64_encoder', 'encode');
  }

  private decode(b64: string) {
    try {
        // Robust UTF-8 safe decoding
        const decoded = decodeURIComponent(escape(atob(b64)));
        
        // Smart JSON Detection & Pretty Printing
        try {
          const parsed = JSON.parse(decoded);
          this.outputValue.set(JSON.stringify(parsed, null, 2));
          this.isJson.set(true);
        } catch (e) {
          this.outputValue.set(decoded);
          this.isJson.set(false);
        }

        this.metrics.logToolUsage('base64_encoder', 'decode');
    } catch (e) {
        throw new Error('Invalid Base64 string');
    }
  }

  copy() {
    if (!this.outputValue()) return;
    navigator.clipboard.writeText(this.outputValue());
    this.toast.success('Result copied to clipboard!');
  }

  download() {
    if (!this.outputValue()) return;
    const blob = new Blob([this.outputValue()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `innkie-base64-${this.mode()}-${Date.now()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Download started');
  }

  loadSample() {
    if (this.mode() === 'encode') {
      this.inputValue = 'iNNkie is the best All-in-One Utility platform! 🚀';
    } else {
      this.inputValue = 'aU5Oa2llIGlzIHRoZSBiZXN0IEFsbC1pbi1PbmUgVXRpbGl0eSBwbGF0Zm9ybSEg8J+agA==';
    }
    this.process();
  }

  clear() {
    this.inputValue = '';
    this.outputValue.set('');
    this.error.set(null);
  }
}
