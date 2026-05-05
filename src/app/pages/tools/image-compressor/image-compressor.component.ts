import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import imageCompression from 'browser-image-compression';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

interface CompressionResult {
  originalName: string;
  originalSize: number;
  compressedSize: number;
  savings: string;
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-image-compressor',
  standalone: true,
  imports: [CommonModule, FormsModule, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Free <span class="text-primary-600">Image</span> Compressor
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto">
            Reduce image file size instantly without losing quality. 
            Supports JPG, PNG, and WebP.
          </p>
        </div>

        <!-- Ad Slot Top -->
        <app-ad-slot slotId="image_compressor_top" format="horizontal" minHeight="90px"></app-ad-slot>

        <!-- Main Workspace -->
        <div class="space-y-8">

          <!-- Compression Settings -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="flex-1">
                <div class="flex justify-between mb-2">
                  <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Target Quality</label>
                  <span class="text-primary-600 font-black">{{ (quality() * 100).toFixed(0) }}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05" 
                  [(ngModel)]="quality"
                  class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <div class="flex gap-4">
                <div class="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[100px]">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode</p>
                  <p class="text-xs font-bold text-slate-600">{{ quality() > 0.8 ? 'High Fidelity' : (quality() > 0.4 ? 'Balanced' : 'Max Saving') }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dropzone -->
          <div 
            *ngIf="!result() && !isCompressing()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.border-primary-500]="isDragging"
            [class.bg-primary-50]="isDragging"
            class="relative overflow-hidden group bg-white border-2 border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center transition-all duration-300 hover:border-primary-400"
          >
            <input 
              type="file" 
              (change)="onFileSelected($event)"
              accept="image/*"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              [disabled]="isCompressing()"
            />
            
            <div class="relative z-0 space-y-4">
              <div class="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div>
                <p class="text-xl font-black text-slate-900 mb-1">Click or drag image here</p>
                <p class="text-slate-500 font-medium">Supports JPG, PNG, WebP • Max 20MB</p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="isCompressing()" class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center animate-in fade-in zoom-in-95 duration-300">
             <div class="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
             <p class="text-lg font-black text-slate-900 mb-2">Compressing your image...</p>
             <p class="text-slate-500 font-medium">This won't take long. Optimization in progress.</p>
             
             <!-- Wait-time Ad -->
             <app-ad-slot slotId="image_compressor_wait"></app-ad-slot>
          </div>

          <!-- Result Table -->
          <div *ngIf="result() && !isCompressing()" class="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div class="flex flex-col md:flex-row">
              <!-- Preview -->
              <div class="md:w-1/3 bg-slate-900 flex items-center justify-center p-4">
                <img [src]="result()?.previewUrl" class="max-h-64 rounded-xl shadow-2xl object-contain" alt="Compressed Preview" />
              </div>
              
              <!-- Details -->
              <div class="md:w-2/3 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-6">
                    <h3 class="text-2xl font-black text-slate-900 truncate pr-4">{{ result()?.originalName }}</h3>
                    <span class="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">
                      -{{ result()?.savings }}
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Original Size</p>
                      <p class="text-xl font-bold text-slate-600">{{ formatSize(result()?.originalSize || 0) }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Compressed Size</p>
                      <p class="text-xl font-black text-primary-600">{{ formatSize(result()?.compressedSize || 0) }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-4">
                  <button 
                    (click)="downloadResult()"
                    class="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
                  >
                    <i class="fas fa-download"></i> Download Image
                  </button>
                  <button 
                    (click)="reset()"
                    class="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    New Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO Content / FAQs -->
        <div class="mt-24 space-y-12">
          <div class="prose prose-slate max-w-none">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Why use iNNkie's Image Compressor?</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div class="space-y-3">
                <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <i class="fas fa-shield-alt"></i>
                </div>
                <h4 class="font-black text-slate-800">Privacy First</h4>
                <p class="text-sm text-slate-500 leading-relaxed">Your security is our priority. We use industry-standard encryption and protocols to ensure your data remains protected.</p>
              </div>
              <div class="space-y-3">
                <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <i class="fas fa-rocket"></i>
                </div>
                <h4 class="font-black text-slate-800">Lightning Fast</h4>
                <p class="text-sm text-slate-500 leading-relaxed">Optimized for speed. Get your compressed images in seconds with our high-performance processing engine.</p>
              </div>
              <div class="space-y-3">
                <div class="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <i class="fas fa-compress-arrows-alt"></i>
                </div>
                <h4 class="font-black text-slate-800">Smart Optimization</h4>
                <p class="text-sm text-slate-500 leading-relaxed">Our algorithm maintains visual quality while aggressively shrinking the file size for faster web loading.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ImageCompressorComponent implements OnInit {
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private metrics = inject(PlatformMetricsService);

  isCompressing = signal(false);
  isDragging = false;
  quality = signal(0.75); // Default 75%
  result = signal<CompressionResult | null>(null);

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'iNNkie Free Image Compressor',
      'operatingSystem': 'Any',
      'applicationCategory': 'MultimediaApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': 'Compress images instantly without losing quality. iNNkie Free Image Compressor provides high-performance optimization with maximum privacy.'
    };

    this.seo.updateSeo(
      'Free Online Image Compressor | Shrink JPG, PNG, WebP',
      'Compress images instantly without losing quality. iNNkie Free Image Compressor provides high-performance optimization with maximum privacy.',
      '/tools/image-compressor',
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
    if (files && files.length > 0) {
      this.processImage(files[0]);
    }
  }

  onFileSelected(e: any) {
    const files = e.target.files;
    if (files && files.length > 0) {
      this.processImage(files[0]);
    }
  }

  async processImage(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    this.isCompressing.set(true);
    
    const options = {
      maxSizeMB: this.quality() > 0.8 ? 2 : (this.quality() > 0.5 ? 1 : 0.5),
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: this.quality()
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);
      
      const savings = Math.round(((file.size - compressedFile.size) / file.size) * 100);

      this.result.set({
        originalName: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        savings: `${savings}%`,
        file: compressedFile,
        previewUrl
      });

      this.toast.success('Image optimized successfully!');

      // Log platform event for analytics
      this.metrics.logToolUsage('image_optimizer', 'compress', {
        bytesSaved: file.size - compressedFile.size,
        originalName: file.name
      });
    } catch (error) {
      console.error('Compression failed:', error);
      this.toast.error('Failed to compress image. Try another file.');
    } finally {
      this.isCompressing.set(false);
    }
  }

  downloadResult() {
    const res = this.result();
    if (!res) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(res.file);
    link.download = `optimized-${res.originalName}`;
    link.click();
  }

  reset() {
    this.result.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
