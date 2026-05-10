import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import imageCompression from 'browser-image-compression';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import JSZip from 'jszip';

interface ConvertJob {
  id: string;
  file: File;
  convertedFile?: File;
  previewUrl?: string;
  originalPreviewUrl?: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  originalSize: number;
  convertedSize?: number;
  savings?: number;
}

@Component({
  selector: 'app-png-to-jpeg',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            PNG to <span class="text-primary-600">JPEG</span> Pro
          </h1>
          <p class="text-slate-600 font-medium max-w-xl mx-auto">
            Professional batch conversion with visual inspection and smart renaming.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left: Settings (Sidebar) -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
             <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
                
                <!-- Renaming Pattern -->
                <div class="space-y-6">
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Filenames Pattern</label>
                   
                   <div class="space-y-4">
                      <div class="space-y-1">
                        <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Prefix</span>
                        <input type="text" [(ngModel)]="filenamePrefix" placeholder="e.g. web-" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                      <div class="space-y-1">
                        <span class="text-[8px] font-bold text-slate-400 uppercase ml-1">Suffix</span>
                        <input type="text" [(ngModel)]="filenameSuffix" placeholder="e.g. -converted" class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                      <p class="text-[9px] text-slate-400 font-medium italic px-1">Preview: {{ filenamePrefix() }}image{{ filenameSuffix() }}.jpg</p>
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

             <app-ad-slot slotId="png_to_jpeg_sidebar" minHeight="250px"></app-ad-slot>
          </div>

          <!-- Right: Workspace -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Dropzone -->
            <div 
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              [class.border-primary-500]="isDragging"
              [class.bg-primary-50]="isDragging"
              [class.p-20]="jobs().length === 0"
              [class.p-8]="jobs().length > 0"
              class="relative overflow-hidden group bg-white border-4 border-dashed border-slate-200 rounded-[3rem] text-center transition-all duration-300 hover:border-primary-400"
            >
              <input type="file" (change)="onFileSelected($event)" accept="image/png" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              
              <div class="relative z-0">
                <div [class.w-24]="jobs().length === 0" [class.h-24]="jobs().length === 0" [class.w-12]="jobs().length > 0" [class.h-12]="jobs().length > 0" class="bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <i class="fas fa-file-export" [class.text-4xl]="jobs().length === 0" [class.text-xl]="jobs().length > 0"></i>
                </div>
                <div class="mt-4" [class.mt-8]="jobs().length === 0">
                  <p class="font-black text-slate-900 mb-2" [class.text-2xl]="jobs().length === 0" [class.text-sm]="jobs().length > 0">
                    {{ jobs().length === 0 ? 'Drop your PNGs here' : 'Add more PNGs' }}
                  </p>
                  <p class="text-slate-500 font-medium italic" [class.text-xs]="jobs().length > 0">
                    {{ jobs().length === 0 ? 'or click to browse your files' : 'Click or drag to continue' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- List -->
            <div class="grid grid-cols-1 gap-4">
               @for (job of jobs(); track job.id) {
                 <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group/job hover:border-primary-200 transition-all">
                    <!-- Thumbnail with Zoom -->
                    <div class="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 relative cursor-zoom-in" (click)="openComparison(job)">
                       <img [src]="job.previewUrl || job.originalPreviewUrl" class="w-full h-full object-cover" />
                       <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <i class="fas fa-search-plus"></i>
                       </div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                       <p class="text-sm font-black text-slate-900 truncate">{{ job.file.name }}</p>
                       <div class="flex items-center gap-2 mt-1">
                          <span class="text-[10px] font-bold text-slate-400 uppercase">{{ formatSize(job.originalSize) }}</span>
                          <i class="fas fa-arrow-right text-[8px] text-slate-300" *ngIf="job.status === 'done'"></i>
                          <span class="text-[10px] font-black text-primary-600 uppercase" *ngIf="job.status === 'done'">{{ formatSize(job.convertedSize || 0) }}</span>
                          <span class="text-slate-200">•</span>
                          <span [class]="job.status === 'done' ? 'text-emerald-500' : 'text-primary-500'" class="text-[10px] font-black uppercase tracking-widest">
                             {{ job.status === 'done' ? '-' + job.savings + '%' : job.status }}
                          </span>
                       </div>
                       <!-- Progress bar during conversion -->
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

        <!-- SEO Content Section -->
        <div class="mt-32 space-y-24">
           <!-- How to Convert -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">How to convert PNG to JPEG?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Our professional converter makes it easy to transform your images in seconds. 
                    Follow these simple steps to batch convert your PNG files to high-quality JPEGs.
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">1</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Upload PNGs</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Drag and drop your PNG files into the area above. You can upload dozens of files at once for batch processing.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">2</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Check Quality</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Click any image to open the Quality Inspection tool. Compare the original and converted versions side-by-side.</p>
                 </div>
                 <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                    <div class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-black italic absolute -top-5 left-8 shadow-lg shadow-primary-200">3</div>
                    <h4 class="font-black text-slate-900 mb-2 mt-2">Bulk Download</h4>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">Once ready, download individual JPEGs or grab all your converted images in a single, organized ZIP archive.</p>
                 </div>
              </div>
           </section>

           <!-- Deep Dive -->
           <section class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div class="space-y-6">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight">Why convert PNG to JPEG?</h2>
                 <p class="text-slate-500 leading-relaxed font-medium">
                    While PNG is great for lossless graphics, JPEG is the undisputed king of web performance and compatibility.
                 </p>
                 <div class="space-y-4">
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-weight-hanging text-emerald-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Superior Compression</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">JPEGs can be up to 10x smaller than PNGs with almost no visible loss in quality, making your website load lightning fast.</p>
                       </div>
                    </div>
                    <div class="flex gap-4 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <i class="fas fa-globe text-blue-500 mt-1"></i>
                       <div>
                          <p class="font-black text-slate-800 text-sm">Universal Compatibility</p>
                          <p class="text-xs text-slate-400 mt-1 leading-relaxed">Every browser, social media platform, and operating system supports JPEG perfectly, ensuring your images look great everywhere.</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div class="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div class="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[100px]"></div>
                 <h3 class="text-2xl font-black mb-8 tracking-tight">PNG vs. JPEG at a Glance</h3>
                 <div class="space-y-6">
                    <div class="pb-6 border-b border-white/10">
                       <p class="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Use PNG when...</p>
                       <p class="text-sm font-medium text-slate-300">You need a transparent background or perfectly lossless text and sharp-edged icons.</p>
                    </div>
                    <div>
                       <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Use JPEG when...</p>
                       <p class="text-sm font-medium text-slate-300">You are sharing photos, complex artwork, or any image where file size and load speed are a priority.</p>
                    </div>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-4xl mx-auto space-y-12">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Is this converter free to use?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Yes, the iNNkie PNG to JPEG converter is completely free. We don't have daily limits, and you don't need an account to start converting.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Are my images secure?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Absolutely. We value your privacy. The conversion happens entirely within your web browser using JavaScript. Your files never leave your computer.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">Can I convert large PNG files?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Our "Pro" engine supports high-resolution images up to 4096px and large file sizes. If your browser has enough memory, our tool can handle it.</p>
                 </div>
                 <div class="space-y-2">
                    <h4 class="font-black text-slate-800 text-sm">What happens to transparency?</h4>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">JPEG does not support transparency. When you convert a transparent PNG, our tool will automatically fill the transparent areas with a clean white background.</p>
                 </div>
              </div>
           </section>
        </div>

      </div>
    </div>

    <!-- Quality Inspection Modal -->
    <div *ngIf="activeJob" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
       <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" (click)="activeJob = null"></div>
       <div class="relative bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
             <div>
                <h3 class="text-xl font-black text-slate-900">Conversion Quality Check</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ activeJob.file.name }}</p>
             </div>
             <button (click)="activeJob = null" class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <i class="fas fa-times text-xl"></i>
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
             <!-- Original -->
             <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                   <span class="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Original PNG</span>
                   <span class="text-sm font-bold text-slate-400">{{ formatSize(activeJob.originalSize) }}</span>
                </div>
                <div class="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center checkerboard">
                   <img [src]="activeJob.originalPreviewUrl" class="max-w-full max-h-full object-contain" />
                </div>
             </div>
             <!-- Converted -->
             <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                   <span class="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">Converted JPEG</span>
                   <span class="text-sm font-black text-primary-600">{{ formatSize(activeJob.convertedSize || 0) }}</span>
                </div>
                <div class="aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-primary-100 flex items-center justify-center shadow-inner">
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
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Filename</p>
                   <p class="text-sm font-black text-slate-700">{{ filenamePrefix() }}{{ activeJob.file.name.split('.')[0] }}{{ filenameSuffix() }}.jpg</p>
                </div>
             </div>
             <button (click)="downloadOne(activeJob)" class="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">
                Download JPEG
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
export class PngToJpegComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);
  private platformId = inject(PLATFORM_ID);

  isDragging = false;
  jobs = signal<ConvertJob[]>([]);
  activeJob: ConvertJob | null = null;

  // Settings
  filenamePrefix = signal('');
  filenameSuffix = signal('');

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie PNG to JPEG Converter',
      'operatingSystem': 'Any',
      'applicationCategory': 'UtilityApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Professional batch PNG to JPEG converter. Visual comparison tool, smart renaming, and instant ZIP downloads. No file uploads, 100% private in-browser processing.'
    };

    this.seo.updateSeo(
      'PNG to JPEG Pro Converter | Fast, Private & Online',
      'Professional batch PNG to JPEG converter. Visual comparison tool, smart renaming, and instant ZIP downloads. No file uploads, 100% private in-browser processing.',
      '/tools/png-to-jpeg',
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
    if (files) this.handleFiles(files);
  }

  onFileSelected(e: any) {
    const files = e.target.files;
    if (files) this.handleFiles(files);
  }

  private async handleFiles(fileList: FileList) {
    if (!isPlatformBrowser(this.platformId)) return;

    const newJobs: ConvertJob[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.includes('png')) {
        this.toast.warn(`Skipped ${file.name} (not a PNG)`);
        continue;
      }

      const originalPreviewUrl = await imageCompression.getDataUrlFromFile(file);

      newJobs.push({
        id: Math.random().toString(36).substring(7),
        file,
        originalSize: file.size,
        originalPreviewUrl,
        status: 'pending',
        progress: 0
      });
    }

    this.jobs.update(current => [...current, ...newJobs]);
    this.processQueue();
  }

  private async processQueue() {
    const pending = this.jobs().filter(j => j.status === 'pending');
    for (const job of pending) {
      await this.convertImage(job);
    }
  }

  private async convertImage(job: ConvertJob) {
    this.updateJob(job.id, { status: 'converting', progress: 20 });

    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: 0.92,
      fileType: 'image/jpeg'
    };

    try {
      const converted = await imageCompression(job.file, options);
      const previewUrl = await imageCompression.getDataUrlFromFile(converted);
      const savings = Math.round(((job.originalSize - converted.size) / job.originalSize) * 100);

      this.updateJob(job.id, {
        status: 'done',
        progress: 100,
        convertedFile: converted,
        convertedSize: converted.size,
        savings,
        previewUrl
      });

      this.metrics.logToolUsage('png_to_jpeg', 'convert');
    } catch (e) {
      this.updateJob(job.id, { status: 'error' });
      this.toast.error(`Failed to convert ${job.file.name}`);
    }
  }

  private updateJob(id: string, updates: Partial<ConvertJob>) {
    this.jobs.update(current => current.map(j => j.id === id ? { ...j, ...updates } : j));
    if (this.activeJob?.id === id) {
      this.activeJob = { ...this.activeJob, ...updates };
    }
  }

  removeJob(id: string) {
    this.jobs.update(current => current.filter(j => j.id !== id));
    if (this.activeJob?.id === id) this.activeJob = null;
  }

  openComparison(job: ConvertJob) {
    if (job.status !== 'done') return;
    this.activeJob = job;
  }

  private getFinalName(originalName: string): string {
    const baseName = originalName.split('.')[0];
    return `${this.filenamePrefix()}${baseName}${this.filenameSuffix()}.jpg`;
  }

  downloadOne(job: ConvertJob) {
    if (!job.convertedFile) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(job.convertedFile);
    link.download = this.getFinalName(job.file.name);
    link.click();
  }

  async downloadAllZip() {
    const zip = new JSZip();
    const done = this.jobs().filter(j => j.status === 'done' && j.convertedFile);
    
    done.forEach(j => {
      zip.file(this.getFinalName(j.file.name), j.convertedFile!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `converted-batch-${Date.now()}.zip`;
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
