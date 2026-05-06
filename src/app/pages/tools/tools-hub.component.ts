import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface UtilityTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'media' | 'link' | 'dev';
  isNew?: boolean;
}

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, AdSlotComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h1 class="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Free <span class="text-primary-600">Utilities</span> for Modern Web
          </h1>
          <p class="text-lg text-slate-600 font-medium leading-relaxed">
            Boost your productivity with our suite of free, high-performance tools. 
            All tools run 100% in your browser—no file uploads to our servers.
          </p>
        </div>

        <!-- Tool Categories -->
        <div class="space-y-16">
          <section *ngFor="let category of categories">
            <div class="flex items-center gap-3 mb-8">
              <div class="h-8 w-1 bg-primary-600 rounded-full"></div>
              <h2 class="text-xl font-black text-slate-900 uppercase tracking-widest">{{ category.label }}</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a *ngFor="let tool of getToolsByCategory(category.id)" 
                 [routerLink]="tool.route"
                 class="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div class="flex justify-between items-start mb-6">
                  <div class="p-3 bg-primary-50 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                    <i [class]="tool.icon + ' text-2xl'"></i>
                  </div>
                  <span *ngIf="tool.isNew" class="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">New</span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">{{ tool.name }}</h3>
                <p class="text-slate-500 text-sm font-medium leading-relaxed mb-6">{{ tool.description }}</p>
                <div class="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest">
                  Open Tool <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </div>
              </a>
            </div>
          </section>
        </div>

        <!-- Ad Slot -->
        <app-ad-slot slotId="tools_hub_bottom" minHeight="250px"></app-ad-slot>

      </div>
    </div>
  `
})
export class ToolsHubComponent implements OnInit {
  private seo = inject(SeoService);

  categories = [
    { id: 'media', label: 'Media & Image' },
    { id: 'link', label: 'Links & Web' },
    { id: 'dev', label: 'Developer Utilities' }
  ];

  tools: UtilityTool[] = [
    {
      id: 'link-shortener',
      name: 'URL Shortener',
      description: 'Create clean, high-performance short URLs with advanced tracking and analytics.',
      icon: 'fas fa-link',
      route: '/tools/link-shortener',
      category: 'link',
      isNew: true
    },
    {
      id: 'qr-generator',
      name: 'QR Code Generator',
      description: 'Create high-resolution, customizable QR codes for any URL or text instantly.',
      icon: 'fas fa-qrcode',
      route: '/tools/qr-generator',
      category: 'link',
      isNew: true
    },
    {
      id: 'qr-studio',
      name: 'Branded QR Studio',
      description: 'Design professional QR codes with custom colors, gradients, and your company logo.',
      icon: 'fas fa-palette',
      route: '/tools/qr-studio',
      category: 'link',
      isNew: true
    },
    {
      id: 'image-compressor',
      name: 'Image Compressor',
      description: 'Reduce file size of JPG, PNG, and WebP images without losing quality. 100% client-side.',
      icon: 'fas fa-file-image',
      route: '/tools/image-compressor',
      category: 'media',
      isNew: true
    },
    {
      id: 'utm-builder',
      name: 'UTM Link Builder',
      description: 'Generate tracking URLs with Google Analytics UTM parameters for your marketing campaigns.',
      icon: 'fas fa-link',
      route: '/tools/utm-builder',
      category: 'link'
    },
    {
      id: 'png-to-jpeg',
      name: 'PNG to JPEG',
      description: 'Convert PNG images to high-quality JPEG format instantly. Fast and secure browser-side processing.',
      icon: 'fas fa-file-export',
      route: '/tools/png-to-jpeg',
      category: 'media',
      isNew: true
    },
    {
      id: 'json-formatter',
      name: 'JSON Formatter',
      description: 'Clean, validate, and format your JSON data for better readability.',
      icon: 'fas fa-code',
      route: '/tools/json-formatter',
      category: 'dev'
    }
  ];

  ngOnInit() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
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
    };

    this.seo.updateSeo(
      'Free Web Utilities & Tools',
      'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more. All tools run in your browser for maximum privacy.',
      '/tools',
      'assets/preview.png',
      schema
    );
  }

  getToolsByCategory(categoryId: string) {
    return this.tools.filter(t => t.category === categoryId);
  }
}
