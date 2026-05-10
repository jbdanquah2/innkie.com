import { Component, OnInit, inject, signal, computed, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

interface ResizePreset {
  label: string;
  width: number;
  height: number;
  icon: string;
}

@Component({
  selector: 'app-image-resizer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Image <span class="text-primary-600">Resizer</span> & Cropper
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Professional browser-side image scaling. Resize, crop, and optimize your images for social media instantly and privately.
          </p>
        </div>

        <!-- Main Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Editor Area -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Upload Zone -->
            <div *ngIf="!originalImage()" 
                 (dragover)="$event.preventDefault()"
                 (drop)="onDrop($event)"
                 class="group relative bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-500 cursor-pointer overflow-hidden">
               <input type="file" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
               <div class="relative z-10">
                  <div class="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <i class="fas fa-cloud-upload-alt"></i>
                  </div>
                  <h3 class="text-xl font-black text-slate-900 mb-2">Drop your image here</h3>
                  <p class="text-slate-400 font-medium italic">Supports PNG, JPEG, WebP (Max 20MB)</p>
               </div>
            </div>

            <!-- Preview Canvas -->
            <div *ngIf="originalImage()" class="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center min-h-[400px] relative group">
               <canvas #previewCanvas class="max-w-full max-h-[600px] rounded-2xl shadow-2xl transition-all duration-300"></canvas>
               
               <button (click)="reset()" class="absolute top-8 right-8 w-10 h-10 bg-white/90 backdrop-blur text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                  <i class="fas fa-times"></i>
               </button>
            </div>

            <!-- Ad Space -->
            <app-ad-slot slotId="image_resizer_middle" format="horizontal" minHeight="90px"></app-ad-slot>
          </div>

          <!-- Controls Panel -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            <!-- Dimensions Card -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
               <div>
                  <div class="flex items-center justify-between mb-4">
                     <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions (px)</label>
                     <button (click)="toggleAspectLock()" [class.text-primary-600]="aspectLocked()" class="text-xs font-bold flex items-center gap-1.5 transition-colors">
                        <i class="fas" [class.fa-lock]="aspectLocked()" [class.fa-unlock]="!aspectLocked()"></i>
                        {{ aspectLocked() ? 'Locked' : 'Unlocked' }}
                     </button>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 block ml-1">Width</span>
                        <input type="number" [(ngModel)]="targetWidth" (input)="onWidthChange()" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-slate-700" />
                     </div>
                     <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 block ml-1">Height</span>
                        <input type="number" [(ngModel)]="targetHeight" (input)="onHeightChange()" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-slate-700" />
                     </div>
                  </div>
               </div>

               <!-- Presets -->
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Presets</label>
                  <div class="grid grid-cols-2 gap-2">
                     <button *ngFor="let p of presets" (click)="applyPreset(p)" class="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 group">
                        <i [class]="p.icon + ' text-slate-400 group-hover:text-primary-600 text-xs'"></i>
                        <span class="text-[10px] font-black text-slate-600 group-hover:text-primary-700">{{ p.label }}</span>
                     </button>
                  </div>
               </div>

               <!-- Export Settings -->
               <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Export Format</label>
                  <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                     <button (click)="exportFormat = 'image/png'" [class.bg-white]="exportFormat === 'image/png'" [class.shadow-sm]="exportFormat === 'image/png'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">PNG</button>
                     <button (click)="exportFormat = 'image/jpeg'" [class.bg-white]="exportFormat === 'image/jpeg'" [class.shadow-sm]="exportFormat === 'image/jpeg'" class="flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all">JPEG</button>
                  </div>
               </div>

               <!-- Download Action -->
               <button (click)="download()" [disabled]="!originalImage()" class="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  <i class="fas fa-download"></i>
                  Download Image
               </button>
            </div>

            <!-- Privacy Tip -->
            <div class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
               <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <i class="fas fa-shield-alt"></i>
               </div>
               <div>
                  <p class="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Privacy Guard</p>
                  <p class="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens locally on your device. Your image is never uploaded to our servers.</p>
               </div>
            </div>
          </div>
        </div>

        <!-- SEO Section -->
        <div class="mt-32 space-y-24">
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">Why use iNNkie's Image Resizer?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    Whether you're an Instagram influencer needing a perfect 1:1 square or a developer looking to scale UI assets, 
                    our tool provides high-fidelity results without the overhead of complex software.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-expand"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Custom Dimensions</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Set exact width and height with optional aspect ratio locking for pixel-perfect results.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-bolt"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">Instant Speed</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Using the power of your browser's hardware acceleration, resizing happens in milliseconds.</p>
                 </div>
                 <div class="text-center space-y-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm">
                       <i class="fas fa-lock"></i>
                    </div>
                    <h3 class="text-lg font-black text-slate-900">100% Private</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">We believe in data sovereignty. Your files stay on your machine, period.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Resize Images</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Upload your image (JPG, PNG, or WebP) by dragging it into the workspace or clicking the upload zone.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Enter your desired Width or Height. Toggle the <strong>Lock Icon</strong> to maintain the original aspect ratio automatically.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Use <strong>Quick Presets</strong> for standard social media sizes like Instagram Squares or Twitter headers.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">4</div>
                       <p class="text-slate-600 font-medium">Select your output format and click <strong>Download Image</strong> to save the optimized result.</p>
                    </div>
                 </div>
                 <div class="bg-primary-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-primary-200">
                    <h3 class="text-xl font-black mb-4">Pro Tip: Formats</h3>
                    <p class="text-primary-100 text-sm leading-relaxed mb-6">
                       Use **PNG** if you need to preserve transparency (like logos). Use **JPEG** for photographs to get the smallest file size possible while maintaining great visual quality.
                    </p>
                    <div class="h-1 w-12 bg-white/20 rounded-full"></div>
                 </div>
              </div>
           </section>

           <!-- FAQ -->
           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">Image Resizer FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Will my image lose quality?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Scaling down (making an image smaller) generally preserves sharpness perfectly. Scaling up significantly may result in some pixelation, as with all raster-based resizing.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">What is the maximum file size?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">iNNkie supports images up to 20MB. Since all processing happens in your browser's memory, the limit depends on your device's available RAM.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Is there a bulk resize option?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Currently, the Resizer & Cropper focuses on single-image precision. For bulk file size reduction, check out our <strong>Image Compressor</strong> tool.</p>
                 </div>
              </div>
           </section>

           <!-- Use Cases -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-12 text-center">Social Media Content Alignment</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fab fa-instagram text-2xl text-pink-500"></i>
                       <h4 class="font-black text-slate-800">Instagram & Meta</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Align your visuals with the exact requirements of Instagram. Crop your photos to a 1:1 square for feed posts, 4:5 for portraits, or 9:16 for high-impact Stories and Reels.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fab fa-x-twitter text-2xl text-slate-900"></i>
                       <h4 class="font-black text-slate-800">X (Twitter) Optimization</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Ensure your campaign images aren't cropped in the feed. Scale your images to the optimal 16:9 or 1200x675 dimensions to guarantee your message is always fully visible.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fab fa-youtube text-2xl text-rose-600"></i>
                       <h4 class="font-black text-slate-800">YouTube Thumbnails</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Create perfectly sized 1280x720 thumbnails that grab attention. Our high-fidelity scaling keeps your graphics sharp even at the small sizes used in search results.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-bullhorn text-2xl text-primary-500"></i>
                       <h4 class="font-black text-slate-800">Marketing Banners</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Scale promotional banners for email campaigns, Google Ads, or blog headers. Consistent dimensions across all channels build a stronger, more professional brand.
                    </p>
                 </div>
              </div>
           </section>
        </div>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Media Workspace</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/image-compressor" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-compress-arrows-alt"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Image Optimizer</h3>
                <p class="text-xs text-slate-500">Compress without quality loss</p>
              </div>
            </a>
            <a routerLink="/tools/png-to-jpeg" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-file-export"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">PNG to JPEG</h3>
                <p class="text-xs text-slate-500">Instant format conversion</p>
              </div>
            </a>
            <a routerLink="/tools/svg-to-png" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-image"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">SVG to PNG</h3>
                <p class="text-xs text-slate-500">Vector to raster conversion</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class ImageResizerComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('previewCanvas') canvas?: ElementRef<HTMLCanvasElement>;

  originalImage = signal<HTMLImageElement | null>(null);
  originalAspectRatio = 1;
  aspectLocked = signal(true);
  
  targetWidth = 0;
  targetHeight = 0;
  exportFormat = 'image/png';

  presets: ResizePreset[] = [
    { label: 'Instagram Square', width: 1080, height: 1080, icon: 'fab fa-instagram' },
    { label: 'Twitter Post', width: 1200, height: 675, icon: 'fab fa-twitter' },
    { label: 'YouTube Thmb', width: 1280, height: 720, icon: 'fab fa-youtube' },
    { label: 'Standard HD', width: 1920, height: 1080, icon: 'fas fa-desktop' }
  ];

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Social Media Image Resizer',
      'operatingSystem': 'Any',
      'applicationCategory': 'MultimediaApplication',
      'description': 'Align your images perfectly for Instagram, Twitter, and YouTube. iNNkie helps you scale and crop images to exact social platform requirements instantly and privately.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      }
    };

    this.seo.updateSeo(
      'Social Media Image Resizer & Cropper',
      'Align your images for Instagram, Twitter, and YouTube instantly. Professional browser-side scaling and cropping to meet social media platform requirements with 100% privacy.',
      '/tools/image-resizer',
      'assets/preview.png',
      schema
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.loadImage(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.loadImage(file);
  }

  private loadImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage.set(img);
        this.originalAspectRatio = img.width / img.height;
        this.targetWidth = img.width;
        this.targetHeight = img.height;
        
        // Use setTimeout to allow Angular to render the canvas element before drawing
        setTimeout(() => this.renderPreview());
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  toggleAspectLock() {
    this.aspectLocked.update(v => !v);
  }

  onWidthChange() {
    if (this.aspectLocked() && this.originalAspectRatio) {
      this.targetHeight = Math.round(this.targetWidth / this.originalAspectRatio);
    }
    this.renderPreview();
  }

  onHeightChange() {
    if (this.aspectLocked() && this.originalAspectRatio) {
      this.targetWidth = Math.round(this.targetHeight * this.originalAspectRatio);
    }
    this.renderPreview();
  }

  applyPreset(preset: ResizePreset) {
    this.aspectLocked.set(false); // Unlock to apply exact preset dimensions
    this.targetWidth = preset.width;
    this.targetHeight = preset.height;
    this.renderPreview();
  }

  renderPreview() {
    if (!isPlatformBrowser(this.platformId) || !this.canvas || !this.originalImage()) return;
    
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // We keep the preview canvas internal resolution high but display it CSS scaled
    this.canvas.nativeElement.width = this.targetWidth;
    this.canvas.nativeElement.height = this.targetHeight;
    
    ctx.clearRect(0, 0, this.targetWidth, this.targetHeight);
    ctx.drawImage(this.originalImage()!, 0, 0, this.targetWidth, this.targetHeight);
  }

  download() {
    if (!this.canvas) return;

    const dataUrl = this.canvas.nativeElement.toDataURL(this.exportFormat, 0.9);
    const link = document.createElement('a');
    const ext = this.exportFormat.split('/')[1];
    link.download = `innkie-resized-${Date.now()}.${ext}`;
    link.href = dataUrl;
    link.click();

    this.toast.success('Image resized and downloaded!');
    this.metrics.logToolUsage('image_resizer', 'resize');
  }

  reset() {
    this.originalImage.set(null);
    this.targetWidth = 0;
    this.targetHeight = 0;
  }
}
