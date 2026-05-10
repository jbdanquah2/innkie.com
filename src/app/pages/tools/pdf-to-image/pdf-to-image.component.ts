import { Component, OnInit, inject, signal, computed, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import * as JSZip from 'jszip';
const JSZipConstructor = (JSZip as any).default || JSZip;

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-to-image',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            PDF to <span class="text-primary-600">Image</span> Converter
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-lg">
            Extract high-quality images from your PDF documents privately. 100% browser-side processing—your sensitive documents never leave your device.
          </p>
        </div>

        <!-- Main Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Editor Area -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Upload Zone -->
            <div *ngIf="!pdfDocument()" 
                 (dragover)="$event.preventDefault()"
                 (drop)="onDrop($event)"
                 class="group relative bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-500 cursor-pointer overflow-hidden">
               <input type="file" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-20" accept="application/pdf" />
               <div class="relative z-10">
                  <div class="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <i class="fas fa-file-pdf"></i>
                  </div>
                  <h3 class="text-xl font-black text-slate-900 mb-2">Drop your PDF here</h3>
                  <p class="text-slate-400 font-medium italic">Supports standard PDF documents (Max 50MB)</p>
               </div>
            </div>

            <!-- PDF Preview & Pages -->
            <div *ngIf="pdfDocument()" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
               <div class="flex items-center justify-between mb-8">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                        <i class="fas fa-file-pdf"></i>
                     </div>
                     <div>
                        <h3 class="text-sm font-black text-slate-900 truncate max-w-[200px]">{{ fileName }}</h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ totalPages() }} Pages Detected</p>
                     </div>
                  </div>
                  <button (click)="reset()" class="w-10 h-10 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center transition-all">
                     <i class="fas fa-times"></i>
                  </button>
               </div>

               <!-- Page Preview Scroll -->
               <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                  <div *ngFor="let page of pagePreviews(); let i = index" 
                       (click)="selectedPage.set(i + 1)"
                       [class.ring-4]="selectedPage() === i + 1"
                       class="relative aspect-[3/4] bg-slate-50 rounded-xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-primary-300 transition-all ring-primary-100 ring-offset-2">
                     <img [src]="page" class="w-full h-full object-cover" />
                     <div class="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/60 backdrop-blur rounded text-[8px] font-black text-white">PAGE {{ i + 1 }}</div>
                  </div>
               </div>
            </div>

            <!-- Ad Space -->
            <app-ad-slot slotId="pdf_to_image_middle" format="horizontal" minHeight="90px"></app-ad-slot>
          </div>

          <!-- Controls Panel -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            <!-- Settings Card -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
               
               <!-- Extraction Mode -->
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Extraction Range</label>
                  <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                     <button (click)="extractMode.set('single')" [class.bg-white]="extractMode() === 'single'" [class.shadow-sm]="extractMode() === 'single'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">Selected Page</button>
                     <button (click)="extractMode.set('all')" [class.bg-white]="extractMode() === 'all'" [class.shadow-sm]="extractMode() === 'all'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">All Pages</button>
                  </div>
               </div>

               <!-- Scaling / Quality -->
               <div>
                  <div class="flex items-center justify-between mb-4">
                     <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Scale</label>
                     <span class="text-xs font-black text-primary-600">{{ scale() }}x</span>
                  </div>
                  <input type="range" min="1" max="4" step="0.5" [(ngModel)]="scaleValue" class="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                  <div class="flex justify-between mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                     <span>Normal</span>
                     <span>Ultra HD</span>
                  </div>
               </div>

               <!-- Format Selection -->
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Export Format</label>
                  <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                     <button (click)="exportFormat = 'image/png'" [class.bg-white]="exportFormat === 'image/png'" [class.shadow-sm]="exportFormat === 'image/png'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">PNG</button>
                     <button (click)="exportFormat = 'image/jpeg'" [class.bg-white]="exportFormat === 'image/jpeg'" [class.shadow-sm]="exportFormat === 'image/jpeg'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">JPEG</button>
                  </div>
               </div>

               <!-- Convert Action -->
               <button (click)="convert()" [disabled]="!pdfDocument() || isProcessing()" class="w-full py-5 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  <i class="fas" [class.fa-magic]="!isProcessing()" [class.fa-circle-notch]="isProcessing()" [class.animate-spin]="isProcessing()"></i>
                  {{ isProcessing() ? 'Processing PDF...' : 'Convert to Images' }}
               </button>
            </div>

            <!-- Privacy Tip -->
            <div class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
               <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <i class="fas fa-shield-alt"></i>
               </div>
               <div>
                  <p class="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Document Guard</p>
                  <p class="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens in your RAM. Your PDF never touches a server. <strong>Data sovereignty guaranteed.</strong></p>
               </div>
            </div>
          </div>
        </div>

        <!-- SEO Section -->
        <div class="mt-32 space-y-24">
           <!-- Why use iNNkie PDF tools -->
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">Why use iNNkie's PDF Converter?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Legal documents and financial reports shouldn't be uploaded to random online converters. Our tool provides a high-fidelity, 
                    private alternative that runs entirely on your local machine.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-file-pdf"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Zero Uploads</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Your documents stay in your browser. We never see, store, or transmit your sensitive PDF data.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-images"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">High Fidelity</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Extract crisp, high-resolution images up to 4x scaling, perfect for professional presentations or web use.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Instant Speed</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">No queue times or server delays. Process multi-page documents at the full power of your local hardware.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Convert PDF to Images</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Upload your PDF document by dragging it into the workspace or clicking the upload zone.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Browse the visual page gallery and select a specific page to extract, or choose 'All Pages'.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Adjust the **Image Scale** (up to 4x) and choose between PNG or JPEG export formats.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                       <p class="text-slate-600 font-medium">Click **Convert to Images**. Your files will download individually or as a single ZIP bundle.</p>
                    </div>
                 </div>
                 <div class="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl"></div>
                    <h3 class="text-xl font-black mb-4 tracking-tight">Pro Tip: Image Quality</h3>
                    <p class="text-slate-300 text-sm leading-relaxed mb-6">
                       For documents with small text or intricate diagrams, we recommend a **Scale of 2x or higher**. This ensures the resulting image remains sharp even when zoomed in.
                    </p>
                    <div class="h-1 w-12 bg-primary-500 rounded-full"></div>
                 </div>
              </div>
           </section>

           <!-- Use Cases -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-12 text-center underline decoration-rose-500 underline-offset-8">Document Workflows</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-rose-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-signature text-2xl text-rose-500"></i>
                       <h4 class="font-black text-slate-800">Legal & Contracts</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Need a copy of a signed page from a 50-page contract? Quickly extract specific pages as high-resolution PNGs for archival or email attachment without compromising privacy.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-rose-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-presentation text-2xl text-blue-500"></i>
                       <h4 class="font-black text-slate-800">Slide Presentations</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Convert report pages into high-quality JPEG images to insert directly into PowerPoint, Keynote, or Google Slides. Avoid formatting issues and keep your file sizes manageable.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-rose-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-mobile-alt text-2xl text-emerald-500"></i>
                       <h4 class="font-black text-slate-800">Mobile Optimization</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Turn heavy, hard-to-read PDFs into lightweight images that are easy to view and proof on mobile devices. Perfect for quick reviews on the go.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-rose-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-file-invoice text-2xl text-amber-500"></i>
                       <h4 class="font-black text-slate-800">Receipt Archiving</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Extract receipts and invoices from multi-page PDF statements. Organize your financial records with individual image files for easier tax preparation.
                    </p>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">PDF to Image FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Are my documents safe?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Absolutely. iNNkie's engine runs 100% in your browser. We never see your documents, and they are never transmitted over the network or stored in any database.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Can I convert many pages at once?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Yes! You can choose 'All Pages', and the tool will automatically bundle all converted images into a single ZIP file for easy downloading.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">What is the best scale for text?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">We recommend a **2x scale** for standard text documents. This provides a high-DPI result that looks sharp on retina displays and in professional reports.</p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-rose-500 underline-offset-8">Document Tools</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/image-to-pdf" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-images"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Image to PDF</h3>
                <p class="text-xs text-slate-500">Combine photos into documents</p>
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
                <p class="text-xs text-slate-500">Shrink images for faster load times</p>
              </div>
            </a>
          </div>
        </div>

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
export class PdfToImageComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  pdfDocument = signal<any>(null);
  totalPages = signal(0);
  pagePreviews = signal<string[]>([]);
  selectedPage = signal(1);
  extractMode = signal<'single' | 'all'>('single');
  scaleValue = 2;
  exportFormat = 'image/png';
  isProcessing = signal(false);
  fileName = '';

  scale = computed(() => this.scaleValue);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
        // Configure PDF.js worker using CDN to ensure version match for standard dist
        const pdfjsVersion = '4.10.38'; // Matches installed pdfjs-dist
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Private PDF to Image Converter',
      'operatingSystem': 'Any',
      'applicationCategory': 'BusinessApplication',
      'description': 'Securely convert PDF documents to high-quality images (PNG/JPEG) entirely in your browser. No document uploads required.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    };

    this.seo.updateSeo(
      'Private PDF to Image Converter',
      'Convert PDF pages to high-quality PNG or JPEG images safely in your browser. 100% private document processing—no uploads or data storage.',
      '/tools/pdf-to-image',
      'assets/preview.png',
      schema
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.loadPdf(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') this.loadPdf(file);
  }

  private async loadPdf(file: File) {
    this.fileName = file.name;
    this.isProcessing.set(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      this.pdfDocument.set(pdf);
      this.totalPages.set(pdf.numPages);
      
      // Generate low-res previews for the first few pages (or all if short)
      const previews = [];
      const previewLimit = Math.min(pdf.numPages, 12);
      
      for (let i = 1; i <= previewLimit; i++) {
        previews.push(await this.renderPageToDataUrl(i, 0.3));
      }
      this.pagePreviews.set(previews);

    } catch (err) {
      this.toast.error('Failed to load PDF. Please ensure it is a valid document.');
      console.error(err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async renderPageToDataUrl(pageNum: number, scale: number): Promise<string> {
    const pdf = this.pdfDocument();
    if (!pdf) return '';

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  }

  async convert() {
    if (!this.pdfDocument()) return;
    this.isProcessing.set(true);

    try {
      if (this.extractMode() === 'single') {
        const dataUrl = await this.renderPageToDataUrl(this.selectedPage(), this.scale());
        this.downloadDataUrl(dataUrl, `page-${this.selectedPage()}`);
      } else {
        await this.convertAllPages();
      }
      
      this.toast.success('Conversion completed successfully!');
      this.metrics.logToolUsage('pdf_to_image', 'convert');
    } catch (err) {
      this.toast.error('Failed to convert PDF to images.');
      console.error(err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async convertAllPages() {
    const pdf = this.pdfDocument();
    const zip = new JSZipConstructor();
    const ext = this.exportFormat.split('/')[1];

    for (let i = 1; i <= this.totalPages(); i++) {
      const dataUrl = await this.renderPageToDataUrl(i, this.scale());
      // Remove data:image/png;base64, prefix
      const base64Data = dataUrl.split(',')[1];
      zip.file(`page-${i}.${ext}`, base64Data, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `innkie-pdf-export-${Date.now()}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private downloadDataUrl(dataUrl: string, suffix: string) {
    const ext = this.exportFormat.split('/')[1];
    const link = document.createElement('a');
    link.download = `innkie-pdf-${suffix}-${Date.now()}.${ext}`;
    link.href = dataUrl;
    link.click();
  }

  reset() {
    this.pdfDocument.set(null);
    this.totalPages.set(0);
    this.pagePreviews.set([]);
    this.selectedPage.set(1);
    this.fileName = '';
  }
}
