import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-data-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            CSV <span class="text-primary-600">&lt;&gt;</span> JSON Converter
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Instantly transform spreadsheets into code and vice versa. 100% private browser-side conversion for secure data handling.
          </p>
        </div>

        <!-- Configuration Bar -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
           <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div class="flex flex-wrap gap-8">
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
                    <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                       <button (click)="setMode('csv2json')" [class.bg-white]="mode() === 'csv2json'" [class.shadow-sm]="mode() === 'csv2json'" class="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all">CSV to JSON</button>
                       <button (click)="setMode('json2csv')" [class.bg-white]="mode() === 'json2csv'" [class.shadow-sm]="mode() === 'json2csv'" class="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all">JSON to CSV</button>
                    </div>
                 </div>
                 <div class="space-y-1" *ngIf="mode() === 'csv2json'">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delimiter</p>
                    <select [(ngModel)]="delimiter" (ngModelChange)="process()" class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 px-3 py-1.5 outline-none focus:ring-4 focus:ring-primary-100">
                       <option value=",">Comma (,)</option>
                       <option value=";">Semicolon (;)</option>
                       <option value="\t">Tab</option>
                    </select>
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
          <div class="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
            <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Input {{ mode() === 'csv2json' ? 'CSV / Raw Text' : 'JSON Object' }}
              </span>
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
          <div class="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[400px] lg:min-h-0">
            <div class="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">Converted Result</span>
              <button (click)="copy()" [disabled]="!outputValue()" class="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2 disabled:opacity-20">
                 <i class="far fa-copy"></i> Copy Result
              </button>
            </div>
            
            <div class="flex-1 overflow-auto p-8 custom-scrollbar">
               <pre *ngIf="outputValue()" class="font-mono text-sm leading-relaxed whitespace-pre text-emerald-400"><code>{{ outputValue() }}</code></pre>
               <div *ngIf="!outputValue()" class="text-white/20 font-mono text-sm italic">// Conversion results will appear here...</div>
            </div>

            <!-- Error Overlay -->
            <div *ngIf="error()" class="absolute bottom-8 left-8 right-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                   <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="space-y-1">
                   <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Processing Error</p>
                   <p class="text-xs font-bold text-rose-200/80 leading-relaxed">{{ error() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO / Info Section -->
        <div class="mt-32 space-y-24">
           <!-- Why use iNNkie Converter -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">Secure & Private Data Conversion</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Most data converters upload your sensitive business files to their servers for processing. iNNkie is different. 
                    Your CSV and JSON data is transformed **entirely in your browser**, ensuring complete privacy and security for your data.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Instant Speed</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">No waiting for uploads or server response times. Processing happens at the speed of your device.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Privacy First</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Your data never touches a server. Perfect for sensitive financial, customer, or security data.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-table"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Developer Grade</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Clean, valid outputs ready for code projects, database seeds, or spreadsheet imports.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Convert Data</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Select your <strong>Mode</strong> (CSV to JSON or JSON to CSV) from the configuration bar at the top.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Paste your raw data into the <strong>Input Area</strong>. For CSV, ensure you select the correct delimiter (comma, semicolon, or tab).</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Review the <strong>Converted Result</strong> in real-time. Our engine automatically handles nested objects and data types.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                       <p class="text-slate-600 font-medium">Click <strong>Copy Result</strong> or <strong>Download</strong> to save your transformed data for use in your next project.</p>
                    </div>
                 </div>
                 <div class="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl"></div>
                    <h3 class="text-xl font-black mb-4 tracking-tight">Pro Tip: Tabbed Inputs</h3>
                    <p class="text-slate-300 text-sm leading-relaxed mb-6">
                       Did you know? You can paste data directly from **Excel or Google Sheets** into the CSV mode. Just select 'Tab' as your delimiter, and iNNkie will convert your clipboard spreadsheet data into clean JSON.
                    </p>
                    <div class="h-1 w-12 bg-primary-500 rounded-full"></div>
                 </div>
              </div>
           </section>

           <!-- Use Cases -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-12 text-center">Common Use Cases</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-database text-2xl text-blue-500"></i>
                       <h4 class="font-black text-slate-800">Database Seeding</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Quickly transform your production CSV exports into JSON arrays for seeding development databases, Mock APIs, or headless CMS platforms.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-chart-pie text-2xl text-emerald-500"></i>
                       <h4 class="font-black text-slate-800">Marketing Analytics</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Convert complex nested JSON exports from marketing APIs into flat CSV files that can be easily opened and analyzed in Google Sheets or Microsoft Excel.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-code-branch text-2xl text-amber-500"></i>
                       <h4 class="font-black text-slate-800">Legacy System Migration</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Bridge the gap between modern JSON-based apps and legacy systems that only support CSV/Excel formats. Ensure your data stays formatted correctly during the move.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-user-lock text-2xl text-indigo-500"></i>
                       <h4 class="font-black text-slate-800">Sensitive Data Prep</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Process financial or customer PII data without worry. Since iNNkie is 100% browser-side, your sensitive datasets are never exposed to the internet.
                    </p>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">Data Converter FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">How do I convert Excel to JSON?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Save your Excel sheet as a **CSV (Comma Separated Values)** file, then simply drag it into iNNkie to get a perfectly formatted JSON array.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Is there a row limit?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Since processing happens in your browser, the limit depends on your computer's RAM. We've optimized the tool to handle thousands of rows smoothly.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Can I convert nested JSON to CSV?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Yes! Our engine automatically "flattens" nested JSON objects into a tabular format, making it easy to open complex API responses in Excel or Google Sheets.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Developer Workspace</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a routerLink="/tools/json-formatter" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-code"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">JSON Formatter</h3>
                <p class="text-xs text-slate-500">Clean and validate your data</p>
              </div>
            </a>
            <a routerLink="/tools/jwt-decoder" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Secure JWT Decoder</h3>
                <p class="text-xs text-slate-500">Client-side token inspection</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Ad Slot Bottom -->
        <app-ad-slot slotId="data_converter_bottom" minHeight="250px"></app-ad-slot>

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
export class DataConverterComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);

  mode = signal<'csv2json' | 'json2csv'>('csv2json');
  inputValue = '';
  outputValue = signal('');
  error = signal<string | null>(null);
  delimiter = ',';

  placeholderText = computed(() => {
    return this.mode() === 'csv2json' 
      ? 'name,email,role\nJohn Doe,john@example.com,Admin' 
      : '[ { "name": "John" } ]';
  });

  ngOnInit() {
    this.seo.updateSeo(
      'Secure CSV to JSON Converter | Excel to JSON Online',
      'Instantly convert CSV files to JSON and JSON to CSV in your browser. 100% private, client-side data transformation utility for developers and marketers.',
      '/tools/csv-json-converter'
    );
    this.loadSample();
  }

  setMode(newMode: 'csv2json' | 'json2csv') {
    this.mode.set(newMode);
    this.loadSample();
  }

  process() {
    const raw = this.inputValue.trim();
    if (!raw) {
      this.outputValue.set('');
      this.error.set(null);
      return;
    }

    try {
      if (this.mode() === 'csv2json') {
        this.convertCsvToJson(raw);
      } else {
        this.convertJsonToCsv(raw);
      }
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e.message);
      this.outputValue.set('');
    }
  }

  private convertCsvToJson(csv: string) {
    const lines = csv.split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV must contain at least a header and one row.');

    const headers = lines[0].split(this.delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Simple CSV parser handling quotes
      const obj: any = {};
      const currentline = this.parseCsvLine(lines[i]);

      headers.forEach((header, index) => {
        let val: any = currentline[index]?.trim().replace(/^"|"$/g, '');
        // Auto-detect numbers/booleans
        if (!isNaN(val) && val !== '') val = Number(val);
        if (val === 'true') val = true;
        if (val === 'false') val = false;
        
        obj[header] = val;
      });
      result.push(obj);
    }

    this.outputValue.set(JSON.stringify(result, null, 2));
    this.metrics.logToolUsage('data_converter', 'convert');
  }

  private parseCsvLine(line: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === this.delimiter && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
      }
    }
    result.push(line.substring(start));
    return result;
  }

  private convertJsonToCsv(jsonStr: string) {
    let json = JSON.parse(jsonStr);
    if (!Array.isArray(json)) json = [json];

    if (json.length === 0) {
      this.outputValue.set('');
      return;
    }

    // Flatten objects and collect all unique keys for headers
    const flattened = json.map((obj: any) => this.flattenObject(obj));
    const headers = Array.from(new Set(flattened.reduce((acc: string[], obj: any) => acc.concat(Object.keys(obj)), [])));

    const csv = [
      headers.join(','),
      ...flattened.map((row: any) => headers.map(fieldName => JSON.stringify(row[fieldName as string] ?? '')).join(','))
    ].join('\r\n');

    this.outputValue.set(csv);
    this.metrics.logToolUsage('data_converter', 'convert');
  }

  private flattenObject(obj: any, prefix = ''): any {
    return Object.keys(obj).reduce((acc: any, k) => {
      const pre = prefix.length ? prefix + '_' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, this.flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  }

  copy() {
    if (!this.outputValue()) return;
    navigator.clipboard.writeText(this.outputValue());
    this.toast.success('Converted data copied!');
  }

  download() {
    const blob = new Blob([this.outputValue()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = this.mode() === 'csv2json' ? 'json' : 'csv';
    a.href = url;
    a.download = `innkie-export-${Date.now()}.${ext}`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Download started');
  }

  loadSample() {
    if (this.mode() === 'csv2json') {
      this.inputValue = `id,name,email,active,revenue
101,Acme Corp,contact@acme.com,true,450000.50
102,Globex,hr@globex.com,false,12000.00
103,Soylent Corp,sales@soylent.com,true,88900.25`;
    } else {
      const sample = [
        { id: 1, name: "Marketing Campaign", stats: { clicks: 120, conversions: 5 } },
        { id: 2, name: "Newsletter", stats: { clicks: 450, conversions: 22 } }
      ];
      this.inputValue = JSON.stringify(sample, null, 2);
    }
    this.process();
  }

  clear() {
    this.inputValue = '';
    this.outputValue.set('');
    this.error.set(null);
  }
}
