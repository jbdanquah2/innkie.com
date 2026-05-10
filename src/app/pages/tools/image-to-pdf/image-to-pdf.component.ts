import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { jsPDF } from 'jspdf';
import * as JSZip from 'jszip';

// Correct way to import JSZip for certain build environments
const JSZipConstructor = (JSZip as any).default || JSZip;

interface PDFImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-image-to-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Image to <span class="text-primary-600">PDF</span> Converter
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-lg">
            Combine multiple photos into a single professional PDF document. 100% private browser-side conversion.
          </p>
        </div>

        <!-- Main Workspace Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Column: Editor (Left) -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Upload Zone -->
            <div (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave()"
                 (drop)="onDrop($event)"
                 [class.border-primary-400]="isDragging()"
                 [class.bg-primary-50]="isDragging()"
                 [class.opacity-50]="isGenerating()"
                 [class.pointer-events-none]="isGenerating()"
                 class="group relative bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-all duration-500 cursor-pointer overflow-hidden">
               <input type="file" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" multiple />
               <div class="relative z-10">
                  <div [class.w-16]="images().length === 0" [class.h-16]="images().length === 0"
                       [class.w-12]="images().length > 0" [class.h-12]="images().length > 0"
                       class="bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <i class="fas fa-plus"></i>
                  </div>
                  <h3 [class.text-lg]="images().length === 0" [class.text-base]="images().length > 0" class="font-black text-slate-900 mb-1">
                    {{ images().length === 0 ? 'Add Images' : 'Add More Images' }}
                  </h3>
                  <p class="text-slate-400 text-sm font-medium italic">Drop photos or click to browse</p>
               </div>
            </div>

            <!-- Images Gallery -->
            <div *ngIf="images().length > 0" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div class="flex items-center justify-between mb-8">
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Document Pages ({{ images().length }})</h3>
                  <button (click)="clearAll()" class="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors">Clear All</button>
               </div>
               <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <div *ngFor="let img of images(); let i = index" class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-primary-200 transition-all">
                     <div class="w-12 h-16 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                        <img [src]="img.previewUrl" class="w-full h-full object-cover" />
                     </div>
                     <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-slate-700 truncate">{{ img.file.name }}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">{{ img.width }} x {{ img.height }}px</p>
                     </div>
                     <div class="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button (click)="moveImage(i, -1)" [disabled]="i === 0" class="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><i class="fas fa-arrow-up text-xs"></i></button>
                        <button (click)="moveImage(i, 1)" [disabled]="i === images().length - 1" class="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><i class="fas fa-arrow-down text-xs"></i></button>
                        <button (click)="removeImage(img.id)" class="p-2 text-slate-400 hover:text-rose-600"><i class="fas fa-trash-alt text-xs"></i></button>
                     </div>
                  </div>
               </div>
            </div>
            <app-ad-slot slotId="image_to_pdf_middle" format="horizontal" minHeight="90px"></app-ad-slot>
          </div>

          <!-- Column: Controls (Right) -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
               <!-- Layout -->
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Document Layout</label>
                  <div class="space-y-4">
                     <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button (click)="pageSize.set('a4')" [class.bg-white]="pageSize() === 'a4'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">A4 Paper</button>
                        <button (click)="pageSize.set('auto')" [class.bg-white]="pageSize() === 'auto'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">Fit Image</button>
                     </div>
                     <div *ngIf="pageSize() === 'a4'" class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button (click)="orientation.set('p')" [class.bg-white]="orientation() === 'p'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">Portrait</button>
                        <button (click)="orientation.set('l')" [class.bg-white]="orientation() === 'l'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">Landscape</button>
                     </div>
                  </div>
               </div>
               <!-- Margin -->
               <div>
                  <div class="flex items-center justify-between mb-4">
                     <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Margin</label>
                     <span class="text-xs font-black text-primary-600">{{ marginValue() }}mm</span>
                  </div>
                  <input type="range" min="0" max="50" step="5" [ngModel]="marginValue()" (ngModelChange)="marginValue.set($event)" class="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
               </div>
               <button (click)="generatePDF()" [disabled]="images().length === 0 || isGenerating()" class="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  <i class="fas" [class.fa-file-pdf]="!isGenerating()" [class.fa-circle-notch]="isGenerating()" [class.animate-spin]="isGenerating()"></i>
                  {{ isGenerating() ? 'Creating PDF...' : 'Create PDF Document' }}
               </button>
            </div>
            <div class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
               <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <i class="fas fa-shield-alt"></i>
               </div>
               <div>
                  <p class="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Privacy Guard</p>
                  <p class="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens locally in your browser. Your images never touch a server.</p>
               </div>
            </div>
          </div>
        </div>

        <!-- SEO Section -->
        <div class="mt-32 space-y-24">
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">Secure Image to PDF Converter</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Convert your JPG, PNG, and WebP images into a single, high-quality PDF document. 
                    iNNkie handles everything privately in your browser.
                 </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-file-pdf"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Multi-Image Support</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Add as many images as you need. Our engine perfectly bundles JPG, PNG, and WebP into one file.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-sort"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Custom Ordering</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Sequence your document exactly how you want it with our intuitive visual page reordering tool.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-lock"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">100% Private</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">We believe in data sovereignty. Your files never leave your machine; all processing happens in RAM.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Convert Images to PDF</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Select or drag your photos into the upload zone. You can add multiple files at once.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Use the **Up/Down arrows** on each image to set the perfect page sequence for your document.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Adjust your **Page Settings**. Choose A4 for standard printing or 'Fit Image' to preserve original dimensions.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                       <p class="text-slate-600 font-medium">Click **Create PDF Document** and watch the real-time progress. Your file will download automatically.</p>
                    </div>
                 </div>
                 <div class="bg-primary-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <h3 class="text-xl font-black mb-4">Pro Tip: Margin Control</h3>
                    <p class="text-primary-100 text-sm leading-relaxed mb-6">
                       If you're creating a PDF for official submission, use a **10mm to 20mm margin**. This ensures your content isn't cut off by printers and gives the document a clean, professional "breathing" space.
                    </p>
                    <div class="h-1 w-12 bg-white/20 rounded-full"></div>
                 </div>
              </div>
           </section>

           <!-- Use Cases -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-12 text-center">Common Use Cases</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-file-contract text-2xl text-blue-500"></i>
                       <h4 class="font-black text-slate-800">Official Documentation</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Combine scans of your ID cards, passports, or legal certificates into a single, secure PDF. Perfect for visa applications, apartment rentals, or job onboarding where privacy is a top priority.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-receipt text-2xl text-emerald-500"></i>
                       <h4 class="font-black text-slate-800">Expense Reporting</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Stop sending dozens of individual receipt photos to your accounting team. Merging them into a single PDF makes expense tracking organized and professional for both freelancers and small businesses.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-briefcase text-2xl text-indigo-500"></i>
                       <h4 class="font-black text-slate-800">Portfolio Bundling</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Are you a designer or photographer? Combine your best work into a high-fidelity PDF portfolio. Our 4x scaling ensures your visuals remain sharp and impressive even after conversion.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-graduation-cap text-2xl text-rose-500"></i>
                       <h4 class="font-black text-slate-800">Academic Submissions</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Merge photos of handwritten homework, diagrams, or whiteboard notes into a single document. It’s the easiest way to submit physical assignments to digital learning platforms like Canvas or Moodle.
                    </p>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">Image to PDF FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Is there a limit on the number of images?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Technically, the limit depends on your device's available memory. iNNkie is optimized to handle dozens of high-resolution images smoothly without crashing your browser.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">What image formats are supported?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">We support all major web formats, including **JPG, PNG, WebP, and BMP**. All formats are converted into high-quality PDF assets instantly.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Will my images be stored on iNNkie?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">No. We believe in absolute privacy. Your files are processed only in your browser's local memory and are never uploaded to a cloud server.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-rose-500 underline-offset-8">Document Tools</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/pdf-to-image" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">PDF to Image</h3>
                <p class="text-xs text-slate-500">Extract pages from PDF files</p>
              </div>
            </a>
            <a routerLink="/tools/image-resizer" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-expand"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Image Resizer</h3>
                <p class="text-xs text-slate-500">Perfectly align social media assets</p>
              </div>
            </a>
            <a routerLink="/tools/image-compressor" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-compress-arrows-alt"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Image Optimizer</h3>
                <p class="text-xs text-slate-500">Fast, browser-side compression</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Processing Overlay -->
        <div *ngIf="isGenerating()" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div class="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div class="relative w-24 h-24 mx-auto">
                 <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                 <div class="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                 <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xl font-black text-slate-900">{{ currentProgress() }}%</span>
                 </div>
              </div>
              <div>
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">Generating PDF</h3>
                 <p class="text-slate-500 font-medium mt-1">{{ currentStepMessage() }}</p>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div [style.width.%]="currentProgress()" class="h-full bg-primary-600 transition-all duration-300"></div>
              </div>
           </div>
        </div>

        <!-- Ad Slot Bottom -->
        <app-ad-slot slotId="image_to_pdf_bottom" minHeight="250px" class="mt-12 block"></app-ad-slot>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
  `]
})
export class ImageToPdfComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  images = signal<PDFImage[]>([]);
  pageSize = signal<'a4' | 'auto'>('a4');
  orientation = signal<'p' | 'l'>('p');
  marginValue = signal(10);
  isGenerating = signal(false);
  isDragging = signal(false);

  // Progress Tracking
  currentProgress = signal(0);
  currentStepMessage = signal('');

  margin = computed(() => this.marginValue());

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Private Image to PDF Converter',
      'operatingSystem': 'Any',
      'applicationCategory': 'BusinessApplication',
      'description': 'Securely combine multiple images into a single professional PDF document locally in your browser. No uploads required.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    };

    this.seo.updateSeo(
      'Combine Images to PDF Online | Private & Secure',
      'Turn your photos into professional PDF documents instantly. 100% private, browser-side conversion for JPG, PNG, and WebP images. No uploads, no storage.',
      '/tools/image-to-pdf',
      'assets/preview.png',
      schema
    );
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) this.loadImages(Array.from(files));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.loadImages(Array.from(files));
  }

  private async loadImages(files: File[]) {
    const newImages: PDFImage[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const imgData = await this.getImageData(file);
      newImages.push({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: imgData.url,
        width: imgData.width,
        height: imgData.height
      });
    }

    this.images.update(current => [...current, ...newImages]);
  }

  private getImageData(file: File): Promise<{url: string, width: number, height: number}> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({ url, width: img.width, height: img.height });
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(id: string) {
    this.images.update(current => current.filter(img => img.id !== id));
  }

  clearAll() {
    this.images.set([]);
  }

  moveImage(index: number, direction: number) {
    const current = this.images();
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const updated = [...current];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    this.images.set(updated);
  }

  async generatePDF() {
    if (this.images().length === 0) return;
    
    this.isGenerating.set(true);
    this.currentProgress.set(0);
    this.currentStepMessage.set('Initializing engine...');

    try {
      // Small delay for initial feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      const doc = new jsPDF({
        orientation: this.orientation(),
        unit: 'mm',
        format: this.pageSize() === 'a4' ? 'a4' : undefined
      });

      const margin = this.margin();
      const imageList = this.images();

      for (let i = 0; i < imageList.length; i++) {
        const img = imageList[i];
        const pageNum = i + 1;
        
        this.currentStepMessage.set(`Processing page ${pageNum} of ${imageList.length}...`);
        this.currentProgress.set(Math.round(((i) / imageList.length) * 100));

        if (i > 0) doc.addPage(this.pageSize() === 'a4' ? 'a4' : [img.width, img.height], this.orientation());

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        // Calculate aspect ratio to fit image on page
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const finalWidth = img.width * ratio;
        const finalHeight = img.height * ratio;

        // Center on page
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        doc.addImage(img.previewUrl, 'JPEG', x, y, finalWidth, finalHeight);
        
        // Let the UI breathe and show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.currentProgress.set(100);
      this.currentStepMessage.set('Saving document...');
      await new Promise(resolve => setTimeout(resolve, 500));

      doc.save(`innkie-combined-${Date.now()}.pdf`);
      this.toast.success('PDF created and downloaded!');
      this.metrics.logToolUsage('image_to_pdf', 'convert');
    } catch (err) {
      this.toast.error('Failed to generate PDF. Please try again.');
      console.error(err);
    } finally {
      this.isGenerating.set(false);
    }
  }
}
