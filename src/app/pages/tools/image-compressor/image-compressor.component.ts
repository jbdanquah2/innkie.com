import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import imageCompression from 'browser-image-compression';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { RelatedToolsComponent } from '../../../shared/components/related-tools/related-tools.component';
import { TOOL_REGISTRY, UtilityTool } from '../../../shared/config/tool-registry';
import JSZip from 'jszip';

interface ImageJob {
  id: string;
  originalFile: File;
  compressedFile?: File;
  previewUrl?: string;
  originalPreviewUrl?: string;
  status: 'pending' | 'compressing' | 'done' | 'error';
  progress: number;
  error?: string;
  originalSize: number;
  compressedSize?: number;
  savings?: number;
}

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'original';

@Component({
  selector: 'app-image-compressor',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent, RelatedToolsComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {{ currentTool?.name || 'Image Compressor' }}
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            {{ currentTool?.description || 'Professional batch compression with side-by-side quality comparison. Supports ultra-fast browser-side optimization.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left: Settings & Control (Sticky) -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
              <div>
                <div class="flex justify-between items-end mb-4">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Quality</label>
                  <span class="text-primary-600 font-black text-lg">{{ (quality() * 100).toFixed(0) }}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05" 
                  [(ngModel)]="quality"
                  (change)="reprocessAll()"
                  class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div class="flex justify-between mt-2 text-[8px] font-black text-slate-400 uppercase">
                  <span>Smaller File</span>
                  <span>Better Quality</span>
                </div>
              </div>

              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resize Dimensions</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Max Width</span>
                    <input type="number" [(ngModel)]="maxWidth" (change)="reprocessAll()" placeholder="Auto" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                  <div class="space-y-1">
                    <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Max Height</span>
                    <input type="number" [(ngModel)]="maxHeight" (change)="reprocessAll()" placeholder="Auto" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                </div>
              </div>

              <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Output Format</label>
                <select [(ngModel)]="outputFormat" (change)="reprocessAll()" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer">
                  <option value="original">Original Format</option>
                  <option value="image/webp">WebP (Recommended)</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-end mb-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max File Size</label>
                  <span class="text-primary-600 font-black text-sm">{{ targetSizeMB() }} MB</span>
                </div>
                <div class="flex items-center gap-3">
                   <input 
                      type="number" 
                      [(ngModel)]="targetSizeMB" 
                      (change)="reprocessAll()" 
                      step="0.1" 
                      min="0.05"
                      class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" 
                   />
                </div>
                <p class="text-[8px] text-slate-400 font-bold uppercase leading-tight italic">The optimizer will aggressively downscale to hit this target.</p>
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

            <app-ad-slot slotId="image_compressor_sidebar" minHeight="250px"></app-ad-slot>
          </div>

          <!-- Right: Workspace -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Dropzone / Add More -->
            <div 
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              [class.border-primary-500]="isDragging"
              [class.bg-primary-50]="isDragging"
              [class.p-20]="jobs().length === 0"
              [class.p-8]="jobs().length > 0"
              class="relative overflow-hidden group bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center transition-all duration-300 hover:border-primary-400"
            >
              <input type="file" (change)="onFileSelected($event)" accept="image/*" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              
              <div class="relative z-0">
                <div [class.w-20]="jobs().length === 0" [class.h-20]="jobs().length === 0" [class.w-12]="jobs().length > 0" [class.h-12]="jobs().length > 0" class="bg-primary-50 text-primary-600 rounded-2xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                  <i class="fas fa-plus text-xl" *ngIf="jobs().length > 0"></i>
                  <i class="fas fa-images text-3xl" *ngIf="jobs().length === 0"></i>
                </div>
                <div class="mt-4">
                  <p class="font-black text-slate-900" [class.text-xl]="jobs().length === 0" [class.text-sm]="jobs().length > 0">
                    {{ jobs().length === 0 ? 'Click or drag images here to begin' : 'Add more images' }}
                  </p>
                  <p class="text-slate-500 font-medium text-xs mt-1" *ngIf="jobs().length === 0">Supports batch processing for JPG, PNG, and WebP</p>
                </div>
              </div>
            </div>

            <!-- Job List -->
            <div class="space-y-4">
               @for (job of jobs(); track job.id) {
                 <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group/job hover:border-primary-200 transition-all">
                    <div class="flex flex-col md:flex-row items-center p-4 gap-6">
                       <!-- Thumbnail -->
                       <div class="shrink-0 w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative cursor-zoom-in" (click)="openComparison(job)">
                          <img [src]="job.previewUrl || job.originalPreviewUrl" class="w-full h-full object-cover" alt="Thumb" />
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity">
                             <i class="fas fa-search-plus"></i>
                          </div>
                       </div>

                       <!-- Progress & Stats -->
                       <div class="flex-1 min-w-0 space-y-3">
                          <div class="flex justify-between items-start">
                             <div>
                               <h4 class="text-sm font-black text-slate-900 truncate max-w-[200px]">{{ job.originalFile.name }}</h4>
                               <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ formatSize(job.originalSize) }}</p>
                             </div>
                             @if (job.status === 'done') {
                               <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                 -{{ job.savings }}%
                               </span>
                             }
                          </div>

                          <div class="relative h-2 bg-slate-50 rounded-full overflow-hidden">
                             <div class="absolute inset-y-0 left-0 bg-primary-600 transition-all duration-300" [style.width.%]="job.progress"></div>
                          </div>
                          
                          <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span [class.text-primary-600]="job.status === 'compressing'" [class.text-emerald-500]="job.status === 'done'" class="flex items-center gap-1.5">
                                <i class="fas fa-circle-notch animate-spin" *ngIf="job.status === 'compressing'"></i>
                                <i class="fas fa-check-circle" *ngIf="job.status === 'done'"></i>
                                {{ job.status }}
                             </span>
                             <span class="text-slate-400" *ngIf="job.status === 'done'">{{ formatSize(job.compressedSize || 0) }}</span>
                          </div>
                       </div>

                       <!-- Actions -->
                       <div class="shrink-0 flex gap-2">
                          <button 
                            *ngIf="job.status === 'done'"
                            (click)="downloadJob(job)"
                            class="w-10 h-10 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl flex items-center justify-center transition-all"
                          >
                            <i class="fas fa-download"></i>
                          </button>
                          <button 
                            (click)="removeJob(job.id)"
                            class="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all"
                          >
                            <i class="fas fa-times"></i>
                          </button>
                       </div>
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
        <div class="mt-32 space-y-24">
           <!-- FAQ -->
           <section class="max-w-4xl mx-auto space-y-12">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2" *ngFor="let faq of (currentTool?.faqs || [])">
                    <h4 class="font-black text-slate-800 text-sm">{{ faq.question }}</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">{{ faq.answer }}</p>
                 </div>
              </div>
           </section>
        </div>

      </div>
    </div>

    <!-- Comparison Modal -->
    <div *ngIf="activeJob" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
       <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" (click)="activeJob = null"></div>
       <div class="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
             <div>
                <h3 class="text-xl font-black text-slate-900">Quality Inspection</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Compare visual fidelity</p>
             </div>
             <button (click)="activeJob = null" class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <i class="fas fa-times text-xl"></i>
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
             <!-- Original -->
             <div class="space-y-4">
                <div class="flex justify-between items-center">
                   <span class="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">Original</span>
                   <span class="text-sm font-bold text-slate-400">{{ formatSize(activeJob.originalSize) }}</span>
                </div>
                <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center">
                   <img [src]="activeJob.originalPreviewUrl" class="max-w-full max-h-full object-contain" />
                </div>
             </div>
             <!-- Compressed -->
             <div class="space-y-4">
                <div class="flex justify-between items-center">
                   <span class="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">Optimized ({{ (quality() * 100).toFixed(0) }}%)</span>
                   <span class="text-sm font-black text-primary-600">{{ formatSize(activeJob.compressedSize || 0) }}</span>
                </div>
                <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-primary-100 flex items-center justify-center">
                   <img [src]="activeJob.previewUrl" class="max-w-full max-h-full object-contain" />
                </div>
             </div>
          </div>
          
          <div class="p-8 bg-slate-50 flex items-center justify-between shrink-0">
             <div class="flex items-center gap-8">
                <div>
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                   <p class="text-2xl font-black text-emerald-500">{{ activeJob.savings }}%</p>
                </div>
                <div class="hidden sm:block">
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bytes Saved</p>
                   <p class="text-2xl font-black text-slate-700">{{ formatSize(activeJob.originalSize - (activeJob.compressedSize || 0)) }}</p>
                </div>
             </div>
             <button (click)="downloadJob(activeJob)" class="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">
               Download This Image
             </button>
             </div>
             </div>
             </div>
             `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  `]
})
export class ImageCompressorComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  isDragging = false;
  quality = signal(0.75);
  targetSizeMB = signal(0.5); 
  maxWidth = signal<number | undefined>(undefined);
  maxHeight = signal<number | undefined>(undefined);
  outputFormat = signal<OutputFormat>('image/jpeg');
  
  jobs = signal<ImageJob[]>([]);
  activeJob: ImageJob | null = null;
  currentTool: UtilityTool | undefined;

  ngOnInit() {
    const currentPath = this.router.url.split('?')[0];
    this.currentTool = TOOL_REGISTRY.find(t => t.route === currentPath || t.aliases?.some(a => a.path === currentPath));
    const alias = this.currentTool?.aliases?.find(a => a.path === currentPath);
    
    const pageTitle = alias?.title || this.currentTool?.seo.title || 'Free Online Image Compressor';
    const pageDesc = alias?.description || this.currentTool?.seo.description || 'Professional batch image optimizer.';

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
      { name: this.currentTool?.name || 'Image Compressor', url: currentPath }
    ])];

    this.seo.updateSeo(
      pageTitle,
      pageDesc,
      currentPath,
      'assets/preview.png',
      schema
    );
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
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(e: any) {
    const files = e.target.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  private async handleFiles(fileList: FileList) {
    if (!isPlatformBrowser(this.platformId)) return;

    const newJobs: ImageJob[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const id = Math.random().toString(36).substring(7);
      const originalPreviewUrl = await imageCompression.getDataUrlFromFile(file);

      const job: ImageJob = {
        id,
        originalFile: file,
        originalSize: file.size,
        originalPreviewUrl,
        status: 'pending',
        progress: 0
      };
      newJobs.push(job);
    }

    this.jobs.update(current => [...current, ...newJobs]);
    this.processPending();
  }

  async reprocessAll() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.jobs.update(current => current.map(job => ({
      ...job,
      status: 'pending',
      progress: 0
    })));
    
    this.processPending();
  }

  private async processPending() {
    const pending = this.jobs().filter(j => j.status === 'pending');
    if (pending.length === 0) return;

    for (const job of pending) {
      await this.compressImage(job);
    }
  }

  private async compressImage(job: ImageJob) {
    this.updateJob(job.id, { status: 'compressing', progress: 10 });

    const options = {
      maxSizeMB: this.targetSizeMB(),
      maxWidthOrHeight: this.maxWidth() || this.maxHeight() || 1920,
      useWebWorker: true,
      initialQuality: this.quality(),
      alwaysKeepResolution: false,
      onProgress: (p: number) => {
        this.updateJob(job.id, { progress: Math.max(10, p) });
      },
      fileType: this.outputFormat() === 'original' ? undefined : (this.outputFormat() as string)
    };

    try {
      const compressedFile = await imageCompression(job.originalFile, options);
      const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);
      const savings = Math.round(((job.originalSize - compressedFile.size) / job.originalSize) * 100);

      this.updateJob(job.id, {
        status: 'done',
        progress: 100,
        compressedFile,
        previewUrl,
        compressedSize: compressedFile.size,
        savings
      });

      this.metrics.logToolUsage('image_optimizer', 'compress', {
        bytesSaved: job.originalSize - compressedFile.size
      });
    } catch (error) {
      console.error('Compression failed:', error);
      this.updateJob(job.id, { status: 'error', error: 'Failed' });
      this.toast.error(`Failed to compress ${job.originalFile.name}`);
    }
  }

  private updateJob(id: string, updates: Partial<ImageJob>) {
    this.jobs.update(current => current.map(j => j.id === id ? { ...j, ...updates } : j));
    if (this.activeJob?.id === id) {
      this.activeJob = { ...this.activeJob, ...updates };
    }
  }

  removeJob(id: string) {
    this.jobs.update(current => current.filter(j => j.id !== id));
    if (this.activeJob?.id === id) this.activeJob = null;
  }

  clearAll() {
    this.jobs.set([]);
    this.activeJob = null;
  }

  isAllDone() {
    return this.jobs().every(j => j.status === 'done' || j.status === 'error');
  }

  openComparison(job: ImageJob) {
    if (job.status !== 'done') return;
    this.activeJob = job;
  }

  downloadJob(job: ImageJob) {
    if (!job.compressedFile) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(job.compressedFile);
    link.download = `optimized-${job.originalFile.name.split('.')[0]}.${this.getFileExtension(job.compressedFile.type)}`;
    link.click();
  }

  async downloadAllZip() {
    const zip = new JSZip();
    const doneJobs = this.jobs().filter(j => j.status === 'done' && j.compressedFile);
    
    for (const job of doneJobs) {
      const ext = this.getFileExtension(job.compressedFile!.type);
      const name = `${job.originalFile.name.split('.')[0]}.${ext}`;
      zip.file(name, job.compressedFile!);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `innkie-optimized-batch-${Date.now()}.zip`;
    link.click();
    
    this.toast.success('ZIP download started!');
    this.metrics.logToolUsage('image_optimizer', 'download_zip', { count: doneJobs.length });
  }

  private getFileExtension(mime: string): string {
    return mime.split('/')[1] || 'jpg';
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
