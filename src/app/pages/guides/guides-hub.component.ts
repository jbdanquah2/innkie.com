import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { GUIDE_REGISTRY, Guide } from '../../shared/config/guide-registry';

@Component({
  selector: 'app-guides-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Hero -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 mb-8">
            <span class="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
            <span class="text-[10px] font-black text-white uppercase tracking-[0.2em]">iNNkie Guides</span>
          </div>
          <h1 class="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Guides & <span class="text-primary-600">How-Tos</span>
          </h1>
          <p class="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Practical, no-fluff explainers on links, tracking, developer tooling, and media — written to help you
            use the right tool the right way.
          </p>
        </div>

        <!-- Guide Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <a *ngFor="let guide of guides"
             [routerLink]="['/guides', guide.slug]"
             class="group flex flex-col bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-300">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-[10px] font-black text-primary-600 uppercase tracking-widest px-3 py-1 bg-primary-50 rounded-full">
                {{ guide.category }}
              </span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ guide.readingTime }}</span>
            </div>
            <h2 class="text-xl font-black text-slate-900 mb-4 tracking-tight leading-snug group-hover:text-primary-600 transition-colors">
              {{ guide.title }}
            </h2>
            <p class="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">
              {{ guide.description }}
            </p>
            <div class="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest">
              Read Guide <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </a>
        </div>

      </div>
    </div>
  `
})
export class GuidesHubComponent implements OnInit {
  private seo = inject(SeoService);

  guides: Guide[] = GUIDE_REGISTRY;

  ngOnInit() {
    const breadcrumb = this.seo.getBreadcrumbSchema(
      [
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/guides' }
      ],
      '/guides'
    );

    const collection = {
      '@type': 'CollectionPage',
      '@id': 'https://innkie.com/guides#collection',
      'name': 'iNNkie Guides',
      'url': 'https://innkie.com/guides',
      'description': 'Practical guides on links, tracking, developer tooling, and media.',
      'hasPart': this.guides.map(g => ({
        '@type': 'Article',
        'headline': g.title,
        'url': `https://innkie.com/guides/${g.slug}`
      }))
    };

    this.seo.updateSeo({
      title: 'Guides & How-Tos',
      description:
        'Practical, no-fluff guides on links, redirects, UTM tracking, JWTs, and image formats — from the iNNkie utility platform.',
      path: '/guides',
      schema: [collection, breadcrumb],
      keywords: ['guides', 'how to', 'url redirects', 'utm parameters', 'jwt', 'image formats', 'iNNkie']
    });
  }
}
