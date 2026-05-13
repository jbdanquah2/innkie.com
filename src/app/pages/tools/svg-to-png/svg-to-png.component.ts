import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { RelatedToolsComponent } from '../../../shared/components/related-tools/related-tools.component';
import { TOOL_REGISTRY, UtilityTool } from '../../../shared/config/tool-registry';
import JSZip from 'jszip';

interface SvgJob {
  id: string;
  file?: File;
  name: string;
  pngBlob?: Blob;
  previewUrl?: string;
  svgContent?: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  originalWidth?: number;
  originalHeight?: number;
  finalWidth?: number;
  finalHeight?: number;
}

@Component({
  selector: 'app-svg-to-png',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, RelatedToolsComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            {{ currentTool?.name || 'SVG to PNG Converter' }}
          </h1>
          <p class="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            {{ currentTool?.description || 'Convert vector SVGs to high-resolution PNG images with custom scaling. Pixel-perfect rendering for designers and developers.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left: Settings (Sidebar) -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
             <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
                
                <!-- Scaling Settings -->
                <div class="space-y-6">
                   <div class="flex justify-between items-end mb-1">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Scale</label>
                      <span class="text-primary-600 font-black text-lg">{{ scale() }}x</span>
                   </div>
                   <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      step="1" 
                      [(ngModel)]="scale" 
                      (change)="reprocessAll()"
                      class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" 
                   />
                   <div class="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                      <span>Standard</span>
                      <span>High DPI (8K Ready)</span>
                   </div>
                </div>

                <!-- Renaming Pattern -->
                <div class="space-y-4 pt-6 border-t border-slate-50">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Naming Pattern</label>
                   <div class="grid grid-cols-2 gap-3">
                      <div class="space-y-1">
                        <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Prefix</span>
                        <input type="text" [(ngModel)]="prefix" placeholder="None" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                      <div class="space-y-1">
                        <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Suffix</span>
                        <input type="text" [(ngModel)]="suffix" placeholder="None" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                   </div>
                </div>

                <div class="pt-6 border-t border-slate-50 space-y-3">
                   <button 
                     [disabled]="jobs().length === 0 || !isAllDone()"
                     (click)="downloadAllZip()"
                     class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                   >
                     <i class="fas fa-file-archive"></i> Download All (.zip)
                   </button>
                   <button 
                     *ngIf="jobs().length > 0"
                     (click)="clearAll()"
                     class="w-full py-3 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                   >
                     Clear Workspace
                   </button>
                </div>
             </div>

             <app-ad-slot slotId="svg_to_png_sidebar" minHeight="250px"></app-ad-slot>
          </div>

          <!-- Right: Workspace -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Paste Mode Toggle -->
            <div class="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit mx-auto lg:mx-0">
               <button (click)="inputMode.set('upload')" [class.bg-slate-900]="inputMode() === 'upload'" [class.text-white]="inputMode() === 'upload'" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Upload Files</button>
               <button (click)="inputMode.set('paste')" [class.bg-slate-900]="inputMode() === 'paste'" [class.text-white]="inputMode() === 'paste'" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Paste Code</button>
            </div>

            <!-- Dropzone -->
            <div *ngIf="inputMode() === 'upload'"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              [class.border-primary-500]="isDragging"
              [class.bg-primary-50]="isDragging"
              [class.p-20]="jobs().length === 0"
              [class.p-8]="jobs().length > 0"
              class="relative overflow-hidden group bg-white border-4 border-dashed border-slate-200 rounded-[3rem] text-center transition-all duration-300 hover:border-primary-400"
            >
              <input type="file" (change)="onFileSelected($event)" accept=".svg" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              
              <div class="relative z-0">
                <div [class.w-24]="jobs().length === 0" [class.h-24]="jobs().length === 0" [class.w-12]="jobs().length > 0" [class.h-12]="jobs().length > 0" class="bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <i class="fas fa-vector-square" [class.text-4xl]="jobs().length === 0" [class.text-xl]="jobs().length > 0"></i>
                </div>
                <div class="mt-4" [class.mt-8]="jobs().length === 0">
                  <p class="font-black text-slate-900 mb-2" [class.text-2xl]="jobs().length === 0" [class.text-sm]="jobs().length > 0">
                    {{ jobs().length === 0 ? 'Drop your SVGs here' : 'Add more vectors' }}
                  </p>
                  <p class="text-slate-500 font-medium italic" [class.text-xs]="jobs().length > 0">
                    {{ jobs().length === 0 ? 'or click to browse your files' : 'Click or drag to continue' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Paste Area -->
            <div *ngIf="inputMode() === 'paste'" class="space-y-4">
               <div class="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group">
                  <textarea 
                    [(ngModel)]="pastedSvg" 
                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...'
                    class="w-full h-48 p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-100 rounded-2xl font-mono text-xs outline-none transition-all"
                  ></textarea>
                  <div class="flex justify-end mt-4">
                     <button 
                       (click)="handlePaste()" 
                       [disabled]="!pastedSvg.trim()"
                       class="px-8 py-3 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                     >
                       Add Vector Code
                     </button>
                  </div>
               </div>
            </div>

            <!-- List -->
            <div class="grid grid-cols-1 gap-4">
               @for (job of jobs(); track job.id) {
                 <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group/job hover:border-primary-200 transition-all animate-in slide-in-from-top-2 duration-300">
                    <!-- Thumbnail with Zoom -->
                    <div class="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 relative cursor-zoom-in" (click)="openComparison(job)">
                       <img [src]="job.previewUrl" class="w-full h-full object-contain p-2" *ngIf="job.status === 'done'" />
                       <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity" *ngIf="job.status === 'done'">
                          <i class="fas fa-search-plus"></i>
                       </div>
                       <i class="fas fa-file-code text-slate-200 text-xl" *ngIf="job.status !== 'done'"></i>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                       <p class="text-sm font-black text-slate-900 truncate">{{ job.name }}</p>
                       <div class="flex items-center gap-2 mt-1">
                          <span class="text-[10px] font-bold text-slate-400 uppercase" *ngIf="job.status === 'done'">{{ job.finalWidth }}x{{ job.finalHeight }}</span>
                          <span class="text-slate-200" *ngIf="job.status === 'done'">•</span>
                          <span [class]="job.status === 'done' ? 'text-emerald-500' : 'text-primary-500'" class="text-[10px] font-black uppercase tracking-widest">
                             {{ job.status }}
                          </span>
                       </div>
                       <div *ngIf="job.status === 'converting'" class="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
                          <div class="h-full bg-primary-500 transition-all" [style.width.%]="job.progress"></div>
                       </div>
                    </div>

                    <div class="shrink-0 flex gap-2">
                       <button *ngIf="job.status === 'done'" (click)="downloadOne(job)" class="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                          <i class="fas fa-download"></i>
                       </button>
                       <button (click)="removeJob(job.id)" class="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                          <i class="fas fa-times"></i>
                       </button>
                    </div>
                 </div>
               }
            </div>
          </div>
        </div>

        <!-- Related Tools -->
        <app-related-tools 
          *ngIf="currentTool"
          [category]="currentTool.category" 
          [excludeId]="currentTool.id">
        </app-related-tools>

        <!-- SEO Content Section -->
        <div *ngIf="isPublicRoute() && currentTool" class="mt-32 space-y-24">
           <!-- Features/Sections from Registry -->
           <section *ngFor="let section of (currentTool.sections || [])" class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">{{ section.title }}</h2>
                 <p class="text-slate-500 font-medium leading-relaxed" *ngIf="section.description">
                    {{ section.description }}
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div *ngFor="let item of section.items" class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center absolute -top-5 left-8 shadow-lg shadow-primary-200">
                      <i [class]="item.icon"></i>
                    </div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">{{ item.title }}</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">{{ item.description }}</p>
                 </div>
              </div>
           </section>

           <!-- Explainer -->
           <section class="max-w-4xl mx-auto text-center space-y-6">
              <h2 class="text-4xl font-black text-slate-900 tracking-tight">The ultimate vector-to-raster engine.</h2>
              <p class="text-lg text-slate-500 leading-relaxed font-medium">
                 SVGs (Scalable Vector Graphics) are perfect for design, but PNGs are often required for web optimization, social media, and presentations. Our converter ensures your graphics remain pixel-perfect even when upscaling to 8x resolution.
              </p>
           </section>

           <!-- Use Cases from Template -->
           <section class="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
...
                    </div>
                 </div>
              </div>
           </section>

           <!-- FAQ from Registry -->
           <section class="max-w-4xl mx-auto space-y-12 pb-20">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2" *ngFor="let faq of (currentTool.faqs || [])">
                    <h4 class="font-black text-slate-800 text-sm">{{ faq.question }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">{{ faq.answer }}</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Static Fallback Section (if not public route) -->
        <div *ngIf="!isPublicRoute()" class="mt-32 space-y-24">
           <!-- How to Convert -->
           <section class="max-w-4xl mx-auto">
...

      </div>
    </div>

    <!-- Inspection Modal -->
    <div *ngIf="activeJob" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
       <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" (click)="activeJob = null"></div>
       <div class="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
             <div>
                <h3 class="text-xl font-black text-slate-900">Raster Quality Check</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ activeJob.name }}</p>
             </div>
             <button (click)="activeJob = null" class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <i class="fas fa-times text-xl"></i>
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
             <!-- Original SVG -->
             <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                   <span class="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Vector Source (SVG)</span>
                   <span class="text-sm font-bold text-slate-400">{{ activeJob.originalWidth }}x{{ activeJob.originalHeight }}</span>
                </div>
                <div class="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center checkerboard p-8">
                   <div [innerHTML]="activeJob.svgContent" class="w-full h-full flex items-center justify-center"></div>
                </div>
             </div>
             <!-- Converted PNG -->
             <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                   <span class="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">Rasterized PNG ({{ scale() }}x)</span>
                   <span class="text-sm font-black text-primary-600">{{ activeJob.finalWidth }}x{{ activeJob.finalHeight }}</span>
                </div>
                <div class="aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-primary-100 flex items-center justify-center shadow-inner p-8">
                   <img [src]="activeJob.previewUrl" class="max-w-full max-h-full object-contain" />
                </div>
             </div>
          </div>
          
          <div class="p-8 bg-slate-50 flex items-center justify-between shrink-0">
             <div class="flex items-center gap-8">
                <div>
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale Factor</p>
                   <p class="text-2xl font-black text-primary-600">{{ scale() }}x</p>
                </div>
                <div class="hidden sm:block">
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Filename</p>
                   <p class="text-sm font-black text-slate-700">{{ getFinalName(activeJob.name) }}</p>
                </div>
             </div>
             <button (click)="downloadOne(activeJob)" class="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">
                Download PNG
             </button>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    .checkerboard {
      background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
  `]
})
export class SvgToPngComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  isDragging = false;
  jobs = signal<SvgJob[]>([]);
  activeJob: SvgJob | null = null;
  currentTool: UtilityTool | undefined;
  isPublicRoute = signal(false);

  // Settings
  scale = signal(2);
  prefix = signal('');
  suffix = signal('');
  inputMode = signal<'upload' | 'paste'>('upload');
  pastedSvg = '';

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];
    this.isPublicRoute.set(currentPath.includes('/tools/'));
    this.currentTool = TOOL_REGISTRY.find(t => t.route === currentPath || t.aliases?.some(a => a.path === currentPath));
    const alias = this.currentTool?.aliases?.find(a => a.path === currentPath);
    
    const pageTitle = alias?.title || this.currentTool?.seo.title || 'SVG to PNG Converter';
    const pageDesc = alias?.description || this.currentTool?.seo.description || 'Convert SVGs to crisp PNG images with custom scaling.';

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
      'mainEntity': (alias?.faqs || this.currentTool?.faqs || []).map(f => ({
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
      { name: this.currentTool?.name || 'SVG to PNG', url: currentPath }
    ])];

    this.seo.updateSeo({
      title: pageTitle,
      description: pageDesc,
      path: currentPath,
      image: alias?.image || this.currentTool?.seo.image || 'assets/preview.png',
      schema,
      keywords: this.currentTool?.seo.keywords,
      noindex: !this.isPublicRoute()
    });
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    
    const files = e.dataTransfer?.files;
    if (files) this.handleFiles(files);
  }

  onFileSelected(e: any) {
    const files = e.target.files;
    if (files) this.handleFiles(files);
  }

  handlePaste() {
    if (!this.pastedSvg.trim()) return;

    const id = Math.random().toString(36).substring(7);
    const newJob: SvgJob = {
      id,
      name: `pasted-vector-${id.substring(0,4)}.svg`,
      svgContent: this.pastedSvg,
      status: 'pending',
      progress: 0
    };

    this.jobs.update(current => [...current, newJob]);
    this.pastedSvg = ''; // Clear for next one
    this.processQueue();
  }

  private async handleFiles(fileList: FileList) {
    if (!isPlatformBrowser(this.platformId)) return;

    const newJobs: SvgJob[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.name.toLowerCase().endsWith('.svg')) {
        this.toast.warn(`Skipped ${file.name} (not an SVG)`);
        continue;
      }

      const id = Math.random().toString(36).substring(7);
      const svgText = await file.text();

      newJobs.push({
        id,
        file,
        name: file.name,
        svgContent: svgText,
        status: 'pending',
        progress: 0
      });
    }

    this.jobs.update(current => [...current, ...newJobs]);
    this.processQueue();
  }

  async reprocessAll() {
    this.jobs.update(current => current.map(j => ({ ...j, status: 'pending', progress: 0 })));
    this.processQueue();
  }

  private async processQueue() {
    const pending = this.jobs().filter(j => j.status === 'pending');
    for (const job of pending) {
      await this.convertSvg(job);
    }
  }

  private async convertSvg(job: SvgJob) {
    this.updateJob(job.id, { status: 'converting', progress: 30 });

    try {
      const img = new Image();
      const svgBlob = new Blob([job.svgContent!], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Dimension detection logic
      let originalWidth = img.width;
      let originalHeight = img.height;

      // Fallback to viewBox if width/height are not set or 0
      if (!originalWidth || !originalHeight) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(job.svgContent!, 'image/svg+xml');
        const svgEl = svgDoc.querySelector('svg');
        if (svgEl && svgEl.hasAttribute('viewBox')) {
          const viewBox = svgEl.getAttribute('viewBox')!.split(' ').map(Number);
          if (viewBox.length === 4) {
            originalWidth = originalWidth || viewBox[2];
            originalHeight = originalHeight || viewBox[3];
          }
        }
      }

      // Final fallbacks if everything else fails
      originalWidth = originalWidth || 300;
      originalHeight = originalHeight || 300;

      const finalWidth = originalWidth * this.scale();
      const finalHeight = originalHeight * this.scale();

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const previewUrl = URL.createObjectURL(pngBlob);

      this.updateJob(job.id, {
        status: 'done',
        progress: 100,
        pngBlob,
        previewUrl,
        originalWidth,
        originalHeight,
        finalWidth,
        finalHeight
      });

      URL.revokeObjectURL(url);
      this.metrics.logToolUsage('svg_to_png', 'convert');

    } catch (e) {
      console.error(e);
      this.updateJob(job.id, { status: 'error' });
      this.toast.error(`Failed to convert ${job.name}`);
    }
  }

  private updateJob(id: string, updates: Partial<SvgJob>) {
    this.jobs.update(current => current.map(j => j.id === id ? { ...j, ...updates } : j));
    if (this.activeJob?.id === id) {
      this.activeJob = { ...this.activeJob, ...updates };
    }
  }

  removeJob(id: string) {
    this.jobs.update(current => current.filter(j => j.id !== id));
    if (this.activeJob?.id === id) this.activeJob = null;
  }

  openComparison(job: SvgJob) {
    if (job.status !== 'done') return;
    this.activeJob = job;
  }

  getFinalName(originalName: string): string {
    const baseName = originalName.split('.')[0];
    return `${this.prefix()}${baseName}${this.suffix()}.png`;
  }

  downloadOne(job: SvgJob) {
    if (!job.pngBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(job.pngBlob);
    link.download = this.getFinalName(job.name);
    link.click();
  }

  async downloadAllZip() {
    const zip = new JSZip();
    const done = this.jobs().filter(j => j.status === 'done' && j.pngBlob);
    
    done.forEach(j => {
      zip.file(this.getFinalName(j.name), j.pngBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `converted-vectors-${Date.now()}.zip`;
    link.click();
    
    this.toast.success('ZIP download started!');
  }

  clearAll() {
    this.jobs.set([]);
    this.activeJob = null;
  }

  isAllDone() {
    const current = this.jobs();
    return current.length > 0 && current.every(j => j.status === 'done' || j.status === 'error');
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
