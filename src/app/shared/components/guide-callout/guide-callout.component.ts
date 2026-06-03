import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Guide, getGuideByToolRoute } from '../../config/guide-registry';

/**
 * Renders a link to the guide associated with a given tool route.
 * Renders nothing if no matching guide exists, so it is safe to drop into any tool page.
 */
@Component({
  selector: 'app-guide-callout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a *ngIf="guide as g"
       [routerLink]="['/guides', g.slug]"
       class="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-primary-500 hover:shadow-lg transition-all max-w-3xl mx-auto">
      <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
        <i class="fas fa-book-open text-lg"></i>
      </div>
      <div class="min-w-0">
        <p class="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Related Guide · {{ g.readingTime }}</p>
        <h3 class="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{{ g.title }}</h3>
      </div>
      <div class="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors pl-2">
        <i class="fas fa-chevron-right text-xs"></i>
      </div>
    </a>
  `
})
export class GuideCalloutComponent implements OnChanges {
  /** The tool route this page represents, e.g. '/tools/jwt-decoder'. */
  @Input() toolRoute = '';

  guide: Guide | undefined;

  ngOnChanges() {
    this.guide = this.toolRoute ? getGuideByToolRoute(this.toolRoute) : undefined;
  }
}
