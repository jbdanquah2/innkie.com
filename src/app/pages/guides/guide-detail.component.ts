import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { GUIDE_REGISTRY, Guide, getGuideBySlug } from '../../shared/config/guide-registry';

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article *ngIf="guide as g" class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
          <a routerLink="/" class="hover:text-primary-600 transition-colors">Home</a>
          <i class="fas fa-chevron-right text-[8px]"></i>
          <a routerLink="/guides" class="hover:text-primary-600 transition-colors">Guides</a>
          <i class="fas fa-chevron-right text-[8px]"></i>
          <span class="text-slate-600 normal-case tracking-normal truncate">{{ g.category }}</span>
        </nav>

        <!-- Header -->
        <header class="mb-12">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-[10px] font-black text-primary-600 uppercase tracking-widest px-3 py-1 bg-primary-50 rounded-full">
              {{ g.category }}
            </span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ g.readingTime }}</span>
          </div>
          <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            {{ g.h1 }}
          </h1>
          <p class="text-lg text-slate-600 font-medium leading-relaxed">{{ g.intro }}</p>
        </header>

        <!-- Body sections -->
        <div class="space-y-12">
          <section *ngFor="let section of g.sections">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-5">{{ section.heading }}</h2>
            <p *ngFor="let para of section.paragraphs"
               class="text-slate-600 font-medium leading-relaxed mb-4">
              {{ para }}
            </p>
            <ul *ngIf="section.bullets?.length" class="space-y-3 mt-5">
              <li *ngFor="let bullet of section.bullets" class="flex gap-3 text-slate-600 font-medium leading-relaxed">
                <i class="fas fa-circle-check text-primary-500 mt-1.5 text-sm flex-shrink-0"></i>
                <span>{{ bullet }}</span>
              </li>
            </ul>
          </section>
        </div>

        <!-- Related tool CTA -->
        <div *ngIf="g.relatedToolRoute" class="mt-16 bg-slate-900 rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 w-72 h-72 bg-primary-600/20 blur-[100px]"></div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p class="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-2">Put it into practice</p>
              <h3 class="text-2xl font-black tracking-tight">Try the {{ g.relatedToolName }}</h3>
            </div>
            <a [routerLink]="g.relatedToolRoute"
               class="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap">
              Open Tool <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>

        <!-- FAQ -->
        <section *ngIf="g.faqs?.length" class="mt-16">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-8">Frequently Asked Questions</h2>
          <div class="space-y-6">
            <div *ngFor="let faq of g.faqs" class="bg-white p-6 rounded-2xl border border-slate-100">
              <h3 class="font-black text-slate-800 text-sm mb-2">{{ faq.question }}</h3>
              <p class="text-sm text-slate-500 font-medium leading-relaxed">{{ faq.answer }}</p>
            </div>
          </div>
        </section>

        <!-- Other guides -->
        <section class="mt-20 pt-12 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">More Guides</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a *ngFor="let other of otherGuides"
               [routerLink]="['/guides', other.slug]"
               class="flex flex-col gap-2 p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary-500 hover:shadow-lg transition-all group">
              <span class="text-[10px] font-black text-primary-600 uppercase tracking-widest">{{ other.category }}</span>
              <h3 class="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{{ other.title }}</h3>
            </a>
          </div>
        </section>

      </div>
    </article>
  `
})
export class GuideDetailComponent implements OnInit {
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  guide: Guide | undefined;
  otherGuides: Guide[] = [];

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.guide = getGuideBySlug(slug);

    if (!this.guide) {
      this.router.navigate(['/404']);
      return;
    }

    this.otherGuides = GUIDE_REGISTRY.filter(g => g.slug !== this.guide!.slug).slice(0, 4);

    const g = this.guide;
    const path = `/guides/${g.slug}`;
    const url = `https://innkie.com${path}`;

    const article = {
      '@type': 'Article',
      '@id': `${url}#article`,
      'headline': g.title,
      'description': g.description,
      'url': url,
      'datePublished': g.datePublished,
      'dateModified': g.datePublished,
      'articleSection': g.category,
      'inLanguage': 'en-US',
      'author': { '@type': 'Organization', 'name': 'iNNkie', '@id': 'https://innkie.com/#organization' },
      'publisher': { '@id': 'https://innkie.com/#organization' },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': url }
    };

    const breadcrumb = this.seo.getBreadcrumbSchema(
      [
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/guides' },
        { name: g.title, url: path }
      ],
      path
    );

    const schema: any[] = [article, breadcrumb];

    if (g.faqs?.length) {
      schema.push({
        '@type': 'FAQPage',
        'mainEntity': g.faqs.map(f => ({
          '@type': 'Question',
          'name': f.question,
          'acceptedAnswer': { '@type': 'Answer', 'text': f.answer }
        }))
      });
    }

    this.seo.updateSeo({
      title: g.title,
      description: g.description,
      path,
      schema
    });
  }
}
