import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-json-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="font-mono text-sm">
      <div class="flex items-center gap-2 group py-0.5">
        <!-- Toggle for Objects/Arrays -->
        <button *ngIf="isExpandable" (click)="toggle()" class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors">
          <i class="fas" [ngClass]="expanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
        </button>
        <div *ngIf="!isExpandable" class="w-4"></div>

        <!-- Key (if provided) -->
        <span *ngIf="key" class="text-indigo-400 font-bold">"{{ key }}":</span>

        <!-- Value / Preview -->
        <ng-container [ngSwitch]="type">
          <span *ngSwitchCase="'string'" class="text-emerald-400">"{{ value }}"</span>
          <span *ngSwitchCase="'number'" class="text-amber-500">{{ value }}</span>
          <span *ngSwitchCase="'boolean'" class="text-rose-400">{{ value }}</span>
          <span *ngSwitchCase="'null'" class="text-slate-500 italic">null</span>
          
          <span *ngSwitchCase="'object'" class="text-slate-400 text-xs italic">
            {{ expanded ? '{' : '{ ... }' }}
            <span *ngIf="!expanded" class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{{ getChildCount() }} keys</span>
          </span>
          
          <span *ngSwitchCase="'array'" class="text-slate-400 text-xs italic">
            {{ expanded ? '[' : '[ ... ]' }}
            <span *ngIf="!expanded" class="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{{ getChildCount() }} items</span>
          </span>
        </ng-container>
      </div>

      <!-- Recursive Children -->
      <div *ngIf="isExpandable && expanded" class="ml-6 border-l border-white/5 pl-4 animate-in fade-in slide-in-from-left-1 duration-200">
        <div *ngFor="let child of children">
          <app-json-tree-node [key]="child.key" [value]="child.value"></app-json-tree-node>
        </div>
        <div class="text-slate-400 text-xs italic opacity-50">
          {{ type === 'object' ? '}' : ']' }}
        </div>
      </div>
    </div>
  `
})
export class JsonTreeNodeComponent {
  @Input() key?: string;
  @Input() value: any;

  expanded = true;

  get type(): string {
    if (this.value === null) return 'null';
    if (Array.isArray(this.value)) return 'array';
    return typeof this.value;
  }

  get isExpandable(): boolean {
    return this.type === 'object' || this.type === 'array';
  }

  get children(): { key?: string; value: any }[] {
    if (this.type === 'object') {
      return Object.keys(this.value).map(k => ({ key: k, value: this.value[k] }));
    }
    if (this.type === 'array') {
      return this.value.map((v: any, i: number) => ({ key: i.toString(), value: v }));
    }
    return [];
  }

  toggle() {
    this.expanded = !this.expanded;
  }

  getChildCount(): number {
    if (this.type === 'object') return Object.keys(this.value).length;
    if (this.type === 'array') return this.value.length;
    return 0;
  }
}

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, JsonTreeNodeComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            JSON <span class="text-primary-600">Formatter</span>
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            Interactive visual explorer and automated TypeScript generator for your data.
          </p>
        </div>

        <!-- Dashboard Header: Stats & Quick Actions -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
           <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <!-- Stats -->
              <div class="flex flex-wrap gap-8">
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Type</p>
                    <p class="text-sm font-black text-slate-700 uppercase tracking-tighter">{{ stats().dataType }}</p>
                 </div>
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Nodes</p>
                    <p class="text-sm font-black text-slate-700 uppercase tracking-tighter">{{ stats().nodeCount }}</p>
                 </div>
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Depth</p>
                    <p class="text-sm font-black text-slate-700 uppercase tracking-tighter">{{ stats().maxDepth }}</p>
                 </div>
                 <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validation</p>
                    <span [class]="error() ? 'text-rose-500' : 'text-emerald-500'" class="text-sm font-black uppercase tracking-tighter">
                       {{ error() ? 'Invalid' : (parsedData ? 'Valid JSON' : 'Waiting...') }}
                    </span>
                 </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3">
                 <button (click)="sortKeys()" [disabled]="!parsedData" class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">
                    Sort Keys
                 </button>
                 <button (click)="copyAsTS()" [disabled]="!parsedData" class="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">
                    Copy as TS Interface
                 </button>
              </div>
           </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 lg:h-[700px]">
          
          <!-- Left: Input Area -->
          <div class="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
            <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div class="flex items-center gap-4">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Raw JSON</span>
                <button (click)="loadSample()" class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all">Load Sample</button>
              </div>
              <div class="flex gap-4">
                 <button (click)="format()" class="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700">Format</button>
                 <button (click)="minify()" class="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-900">Minify</button>
                 <button (click)="clear()" class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600">Clear</button>
              </div>
            </div>
            <textarea 
              [(ngModel)]="jsonInput"
              (ngModelChange)="onInputChange()"
              (keydown.tab)="handleTab($any($event))"
              (paste)="onPaste($any($event))"
              placeholder="Paste your JSON here..."
              class="flex-1 w-full p-8 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
            ></textarea>
          </div>

          <!-- Right: Output Area (Pro) -->
          <div class="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[600px]">
            <!-- Tabs -->
            <div class="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div class="flex p-1 bg-white/5 rounded-xl">
                 <button (click)="viewMode = 'code'" 
                         [ngClass]="viewMode === 'code' ? 'bg-white text-slate-900' : 'text-white/40'"
                         class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Code</button>
                 <button (click)="viewMode = 'tree'" 
                         [ngClass]="viewMode === 'tree' ? 'bg-white text-slate-900' : 'text-white/40'"
                         class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Tree Explorer</button>
              </div>
              <button (click)="copy()" class="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2">
                 <i class="far fa-copy"></i> Copy Result
              </button>
            </div>
            
            <div class="flex-1 overflow-auto p-8 custom-scrollbar">
               <!-- Code View with Highlighting -->
               <div *ngIf="viewMode === 'code'" class="font-mono text-sm leading-relaxed whitespace-pre-wrap" [innerHTML]="highlightedHtml || '// Output will appear here...'"></div>
               
               <!-- Tree Explorer -->
               <div *ngIf="viewMode === 'tree'" class="pb-10">
                  <app-json-tree-node *ngIf="parsedData" [value]="parsedData"></app-json-tree-node>
                  <div *ngIf="!parsedData" class="text-white/20 font-mono text-sm italic">// Paste valid JSON to explore tree...</div>
               </div>
            </div>
            
            <!-- Error Badge -->
            <div *ngIf="error()" class="absolute bottom-8 left-8 right-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                   <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="space-y-1">
                   <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Syntax Error</p>
                   <p class="text-xs font-bold text-rose-200/80 leading-relaxed">{{ error() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO Content Section -->
        <div class="mt-32 space-y-24">
           <!-- How to Use Section -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">How to use the JSON Formatter?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Our professional utility makes it easy to visualize and manage your data. 
                    Whether you're debugging an API or generating types, iNNkie has you covered.
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">1</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Paste JSON</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Paste your raw or minified JSON into the input area. You can also use the 'Load Sample' button to test features.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">2</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Explore Data</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Switch to the 'Tree Explorer' for an interactive view of nested structures or stay in 'Code' for syntax highlighting.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">3</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Generate Types</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Click 'Copy as TS Interface' to instantly generate TypeScript definitions based on your JSON structure.</p>
                 </div>
              </div>
           </section>

           <!-- Why Use JSON Formatter -->
           <section class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div class="space-y-6">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight">Why is a good JSON tool important?</h2>
                 <p class="text-slate-500 leading-relaxed font-medium">
                    JSON is the backbone of modern web communication. A robust formatter is essential for rapid development and debugging.
                 </p>
                 <div class="space-y-4">
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-microchip text-indigo-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Instant Validation</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Automatically detect syntax errors like missing commas or quotes with real-time feedback and clear error messages.</p>
                       </div>
                    </div>
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-project-diagram text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Visual Navigation</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Stop scrolling through thousands of lines. Use our tree view to jump straight to the data points you care about.</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div class="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div class="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px]"></div>
                 <h3 class="text-2xl font-black mb-8 tracking-tight">Pro Utilities at Glance</h3>
                 <div class="space-y-6">
                    <div class="pb-6 border-b border-white/10">
                       <p class="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">TypeScript Ready</p>
                       <p class="text-sm font-medium text-slate-300">Convert complex objects into clean TypeScript interfaces with one click. Ideal for frontend developers.</p>
                    </div>
                    <div>
                       <p class="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Smart Sorting</p>
                       <p class="text-sm font-medium text-slate-300">Alphabetically sort your keys deep into the structure to make comparisons between objects easier.</p>
                    </div>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-4xl mx-auto space-y-12">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Is my data secure?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Yes, 100%. All JSON processing and formatting happen locally in your browser. No data is ever sent to our servers.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Can I format very large files?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Our pro formatter is highly optimized for performance. While extremely large files depend on your browser's RAM, it can handle most common datasets easily.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">What does "Copy as TS" do?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">It analyzes your JSON structure and generates a matching TypeScript interface definition, which you can then paste directly into your code projects.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">How do I fix syntax errors?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The tool provides real-time error messages at the bottom of the output area. It will tell you exactly what character or line is causing the invalidation.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Ad Slot Bottom -->
        <app-ad-slot slotId="json_formatter_bottom" minHeight="250px"></app-ad-slot>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `]
})
export class JsonFormatterComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);

  jsonInput: string = '';
  parsedData: any = null;
  highlightedHtml: string = '';
  viewMode: 'code' | 'tree' = 'code';
  error = signal<string | null>(null);
  stats = signal({ nodeCount: 0, maxDepth: 0, dataType: 'None' });

  ngOnInit() {
    const schema = [{
      '@type': 'SoftwareApplication',
      'name': 'iNNkie JSON Formatter',
      'operatingSystem': 'Any',
      'applicationCategory': 'DeveloperApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Professional JSON utility for modern developers. Syntax highlighting, interactive tree view, and automated TypeScript interface generation.'
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'JSON Formatter', url: '/tools/json-formatter' }
    ])];

    this.seo.updateSeo(
      'JSON Formatter | Interactive Tree Explorer & TS Generator',
      'Professional JSON utility for modern developers. Syntax highlighting, interactive tree view, and automated TypeScript interface generation.',
      '/tools/json-formatter',
      'assets/preview.png',
      schema
    );

    // Initialize with default sample
    const defaultSample = {
      message: "Welcome to JSON Formatter",
      version: "2.0.0",
      active: true,
      useful_features: [
        "Interactive Tree View",
        "Syntax Highlighting",
        "TypeScript Interface Generator"
      ]
    };
    this.jsonInput = JSON.stringify(defaultSample, null, 2);
    this.processJson(false);
  }

  onInputChange() {
    if (!this.jsonInput.trim()) {
      this.clear();
      return;
    }
    this.processJson(false);
  }

  format() {
    this.processJson(true);
    if (!this.error()) this.toast.success('Formatted successfully!');
  }

  minify() {
    if (!this.jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonInput = JSON.stringify(parsed);
      this.processJson(false);
      this.toast.success('Minified successfully!');
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  sortKeys() {
    if (!this.parsedData) return;
    this.parsedData = this.deepSort(this.parsedData);
    this.jsonInput = JSON.stringify(this.parsedData, null, 2);
    this.processJson(true);
    this.toast.success('Keys sorted alphabetically');
  }

  private deepSort(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this.deepSort(v));
    return Object.keys(obj).sort().reduce((res: any, key) => {
      res[key] = this.deepSort(obj[key]);
      return res;
    }, {});
  }

  private processJson(updateInput: boolean = false) {
    try {
      this.parsedData = JSON.parse(this.jsonInput);
      this.error.set(null);
      
      const formatted = JSON.stringify(this.parsedData, null, 2);
      if (updateInput) this.jsonInput = formatted;
      
      this.highlightedHtml = this.syntaxHighlight(formatted);
      this.updateStats();
      
      this.metrics.logToolUsage('json_formatter', 'process');
    } catch (e: any) {
      this.error.set(e.message);
      this.parsedData = null;
      this.highlightedHtml = '';
      this.stats.set({ nodeCount: 0, maxDepth: 0, dataType: 'Invalid' });
    }
  }

  private updateStats() {
    let count = 0;
    let depth = 0;

    const traverse = (obj: any, currentDepth: number) => {
      count++;
      depth = Math.max(depth, currentDepth);
      if (obj !== null && typeof obj === 'object') {
        Object.values(obj).forEach(v => traverse(v, currentDepth + 1));
      }
    };

    traverse(this.parsedData, 1);
    this.stats.set({
      nodeCount: count,
      maxDepth: depth,
      dataType: Array.isArray(this.parsedData) ? 'Array' : 'Object'
    });
  }

  private syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-500'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-indigo-400 font-bold'; // key
        } else {
          cls = 'text-emerald-400'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-rose-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-slate-500 italic'; // null
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  copyAsTS() {
    if (!this.parsedData) return;
    const ts = this.jsonToTypeScript(this.parsedData, 'RootInterface');
    navigator.clipboard.writeText(ts);
    this.toast.success('TS Interface copied!');
  }

  private jsonToTypeScript(obj: any, name: string): string {
    const interfaces: string[] = [];
    
    const generate = (val: any, interfaceName: string): string => {
      if (val === null) return 'any';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'any[]';
        return `${generate(val[0], interfaceName)}[]`;
      }
      if (typeof val === 'object') {
        let res = '{\n';
        Object.keys(val).forEach(k => {
          const subName = k.charAt(0).toUpperCase() + k.slice(1);
          res += `  ${k}: ${generate(val[k], subName)};\n`;
        });
        res += '}';
        return res;
      }
      return typeof val;
    };

    return `export interface ${name} ${generate(obj, name)}`;
  }

  handleTab(event: KeyboardEvent) {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insert 2 spaces
    this.jsonInput = this.jsonInput.substring(0, start) + '  ' + this.jsonInput.substring(end);

    // Reset cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
    
    this.processJson(false);
  }

  loadSample() {
    const sample = {
      user: {
        id: "usr_88231",
        profile: {
          name: "Alex Developer",
          roles: ["admin", "editor"],
          verified: true
        }
      },
      settings: {
        theme: "dark",
        notifications: {
          email: true,
          push: false,
          frequency: "daily"
        }
      },
      stats: {
        loginCount: 42,
        lastActive: "2026-05-06T12:00:00Z",
        score: 9.5
      }
    };
    this.jsonInput = JSON.stringify(sample, null, 2);
    this.processJson(true);
    this.toast.info('Sample JSON loaded');
  }

  onPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text');
    if (!pastedText) return;

    try {
      // If it looks like minified JSON, auto-format it
      if (!pastedText.includes('\n') && (pastedText.trim().startsWith('{') || pastedText.trim().startsWith('['))) {
        const parsed = JSON.parse(pastedText);
        const formatted = JSON.stringify(parsed, null, 2);
        
        event.preventDefault();
        
        // Manual insertion to keep it in sync with ngModel
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        this.jsonInput = this.jsonInput.substring(0, start) + formatted + this.jsonInput.substring(end);
        
        this.processJson(false);
        this.toast.success('Auto-formatted minified JSON');
      }
    } catch (e) {
      // Not valid or already handled
    }
  }

  copy() {
    if (!this.jsonInput) return;
    navigator.clipboard.writeText(this.jsonInput);
    this.toast.success('Copied to clipboard!');
  }

  clear() {
    this.jsonInput = '';
    this.parsedData = null;
    this.highlightedHtml = '';
    this.error.set(null);
    this.stats.set({ nodeCount: 0, maxDepth: 0, dataType: 'None' });
  }
}
