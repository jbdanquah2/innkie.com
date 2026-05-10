import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface UtilityTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'media' | 'link' | 'dev' | 'docs';
  color: 'primary' | 'emerald' | 'blue' | 'rose' | 'amber' | 'indigo';
}

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, AdSlotComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header & Search -->
        <div class="text-center max-w-4xl mx-auto mb-16 space-y-8">
          <div class="space-y-4">
            <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Free <span class="text-primary-600">Utilities</span> Hub
            </h1>
            <p class="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              A professional suite of 100% private, browser-side tools for modern digital teams.
            </p>
          </div>

          <!-- Search Bar -->
          <div class="relative max-w-xl mx-auto group">
            <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
              <i class="fas fa-search text-lg"></i>
            </div>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChanged($event)"
              placeholder="Search for a tool (e.g. PDF, Image, JWT)..."
              class="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-lg shadow-xl shadow-slate-200/40"
            />
            <div *ngIf="searchQuery()" class="absolute inset-y-0 right-4 flex items-center">
               <button (click)="clearSearch()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                 <i class="fas fa-times text-xs"></i>
               </button>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="flex flex-wrap justify-center gap-3 pt-4">
            <button 
              (click)="activeCategory.set('all')"
              [class.bg-primary-600]="activeCategory() === 'all'"
              [class.text-white]="activeCategory() === 'all'"
              [class.shadow-xl]="activeCategory() === 'all'"
              [class.shadow-primary-200]="activeCategory() === 'all'"
              class="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-primary-400"
              [class.bg-white]="activeCategory() !== 'all'"
              [class.text-slate-500]="activeCategory() !== 'all'"
            >
              All Tools
            </button>
            <button 
              *ngFor="let cat of categories"
              (click)="activeCategory.set(cat.id)"
              [class.bg-primary-600]="activeCategory() === cat.id"
              [class.text-white]="activeCategory() === cat.id"
              [class.shadow-xl]="activeCategory() === cat.id"
              [class.shadow-primary-200]="activeCategory() === cat.id"
              class="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-primary-400"
              [class.bg-white]="activeCategory() !== cat.id"
              [class.text-slate-500]="activeCategory() !== cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Tool Categories -->
        <div class="space-y-20">
          <ng-container *ngFor="let category of categories">
            <section *ngIf="shouldShowCategory(category.id)" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-1 bg-primary-600 rounded-full"></div>
                  <h2 class="text-xl font-black text-slate-900 uppercase tracking-widest">{{ category.label }}</h2>
                </div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {{ getToolsByCategory(category.id).length }} Tools
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a *ngFor="let tool of getToolsByCategory(category.id)" 
                   [routerLink]="tool.route"
                   class="group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                  
                  <div class="flex justify-between items-start mb-6">
                    <div [ngClass]="{
                      'bg-primary-50 text-primary-600 group-hover:bg-primary-600': tool.color === 'primary',
                      'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600': tool.color === 'emerald',
                      'bg-blue-50 text-blue-600 group-hover:bg-blue-600': tool.color === 'blue',
                      'bg-rose-50 text-rose-600 group-hover:bg-rose-600': tool.color === 'rose',
                      'bg-amber-50 text-amber-600 group-hover:bg-amber-600': tool.color === 'amber',
                      'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600': tool.color === 'indigo'
                    }" class="p-3 rounded-2xl group-hover:text-white transition-all duration-300 shadow-sm">
                      <i [class]="tool.icon + ' text-2xl'"></i>
                    </div>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">{{ tool.name }}</h3>
                  <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">{{ tool.description }}</p>
                  <div class="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest border-t border-slate-50 pt-6 group-hover:gap-3 transition-all">
                    Launch Utility <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
                  </div>
                </a>
              </div>
            </section>
          </ng-container>

          <!-- Empty State -->
          <div *ngIf="filteredTools().length === 0" class="py-20 text-center animate-in zoom-in-95 duration-300">
             <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 text-3xl">
                <i class="fas fa-search"></i>
             </div>
             <h3 class="text-2xl font-black text-slate-900 mb-2">No tools match your search</h3>
             <p class="text-slate-500 font-medium mb-8">Try using different keywords or browse by category.</p>
             <button (click)="clearSearch()" class="px-8 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
               Clear Filter
             </button>
          </div>
        </div>

        <!-- Ad Slot -->
        <div class="mt-20">
          <app-ad-slot slotId="tools_hub_bottom" minHeight="250px"></app-ad-slot>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToolsHubComponent implements OnInit {
  private seo = inject(SeoService);

  searchQuery = signal('');
  activeCategory = signal('all');

  categories = [
    { id: 'docs', label: 'Document Utilities' },
    { id: 'media', label: 'Media & Image' },
    { id: 'link', label: 'Links & Web' },
    { id: 'dev', label: 'Developer Utilities' }
  ];

  tools: UtilityTool[] = [
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      description: 'Extract pages from your PDF documents and convert them to high-quality images privately.',
      icon: 'fas fa-file-pdf',
      route: '/tools/pdf-to-image',
      category: 'docs',
      color: 'rose'
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      description: 'Combine multiple images into a single professional PDF document instantly.',
      icon: 'fas fa-images',
      route: '/tools/image-to-pdf',
      category: 'docs',
      color: 'rose'
    },
    {
      id: 'link-shortener',
      name: 'URL Shortener',
      description: 'Create clean, high-performance short URLs with advanced tracking and analytics.',
      icon: 'fas fa-link',
      route: '/tools/link-shortener',
      category: 'link',
      color: 'primary'
    },
    {
      id: 'qr-generator',
      name: 'QR Code Generator',
      description: 'Create high-resolution, customizable QR codes for any URL or text instantly.',
      icon: 'fas fa-qrcode',
      route: '/tools/qr-generator',
      category: 'link',
      color: 'emerald'
    },
    {
      id: 'qr-studio',
      name: 'Branded QR Studio',
      description: 'Design professional QR codes with custom colors, gradients, and your company logo.',
      icon: 'fas fa-palette',
      route: '/tools/qr-studio',
      category: 'link',
      color: 'emerald'
    },
    {
      id: 'image-compressor',
      name: 'Image Compressor',
      description: 'Reduce file size of JPG, PNG, and WebP images without losing quality. 100% client-side.',
      icon: 'fas fa-compress-arrows-alt',
      route: '/tools/image-compressor',
      category: 'media',
      color: 'blue'
    },
    {
      id: 'image-resizer',
      name: 'Image Resizer & Cropper',
      description: 'Scale, crop, and set specific dimensions for your images instantly in your browser.',
      icon: 'fas fa-expand',
      route: '/tools/image-resizer',
      category: 'media',
      color: 'blue'
    },
    {
      id: 'svg-to-png',
      name: 'SVG to PNG',
      description: 'Convert SVG vectors to high-quality PNG images with custom scaling. Fast and secure.',
      icon: 'fas fa-image',
      route: '/tools/svg-to-png',
      category: 'media',
      color: 'indigo'
    },
    {
      id: 'png-to-jpeg',
      name: 'PNG to JPEG',
      description: 'Convert PNG images to high-quality JPEG format instantly. Fast and secure browser-side processing.',
      icon: 'fas fa-file-export',
      route: '/tools/png-to-jpeg',
      category: 'media',
      color: 'rose'
    },
    {
      id: 'utm-builder',
      name: 'UTM Link Builder',
      description: 'Generate tracking URLs with Google Analytics UTM parameters for your marketing campaigns.',
      icon: 'fas fa-link',
      route: '/tools/utm-builder',
      category: 'link',
      color: 'primary'
    },
    {
      id: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Clean, validate, and format your JSON data for better readability.',
      icon: 'fas fa-code',
      route: '/tools/json-formatter',
      category: 'dev',
      color: 'amber'
    },
    {
      id: 'jwt-decoder',
      name: 'Secure JWT Decoder',
      description: 'Decode and inspect JSON Web Tokens locally. No data ever leaves your browser.',
      icon: 'fas fa-shield-alt',
      route: '/tools/jwt-decoder',
      category: 'dev',
      color: 'indigo'
    },
    {
      id: 'data-converter',
      name: 'CSV <> JSON Converter',
      description: 'Transform spreadsheets into code instantly. Support for bidirectional conversion and auto-detection.',
      icon: 'fas fa-table',
      route: '/tools/csv-json-converter',
      category: 'dev',
      color: 'primary'
    },
    {
      id: 'base64-encoder',
      name: 'Base64 Encoder & Decoder',
      description: 'Securely encode and decode strings into Base64 format locally in your browser.',
      icon: 'fas fa-code-branch',
      route: '/tools/base64-encoder',
      category: 'dev',
      color: 'primary'
    }
  ];

  filteredTools = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();

    return this.tools.filter(t => {
      const matchesSearch = !query || 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);
      
      const matchesCategory = cat === 'all' || t.category === cat;

      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit() {
    const schema = [{
      '@type': 'CollectionPage',
      '@id': 'https://innkie.com/tools#collection',
      'name': 'iNNkie Free Web Utilities & Tools',
      'description': 'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more.',
      'url': 'https://innkie.com/tools',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': this.tools.map((t, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'url': `https://innkie.com${t.route}`,
          'name': t.name
        }))
      }
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' }
    ])];

    this.seo.updateSeo(
      'Free Online Utilities & Productive Web Tools',
      'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more. All tools run in your browser for maximum privacy.',
      '/tools',
      'assets/preview.png',
      schema
    );
  }

  getToolsByCategory(categoryId: string) {
    return this.filteredTools().filter(t => t.category === categoryId);
  }

  shouldShowCategory(categoryId: string) {
    return this.getToolsByCategory(categoryId).length > 0;
  }

  onSearchChanged(query: string) {
    this.searchQuery.set(query);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.activeCategory.set('all');
  }
}
