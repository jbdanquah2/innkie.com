import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../shared/services/seo.service';
import { ThemeService } from '../shared/services/theme.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  template: `
    <main class="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
      <section class="w-full max-w-lg text-center">
        <div class="mb-10 flex justify-center">
          <app-logo size="64px" [showText]="true"></app-logo>
        </div>

        <div class="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/60 px-8 py-10">
          <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <i class="fas fa-triangle-exclamation text-2xl"></i>
          </div>

          <h1 class="mb-3 text-3xl font-black tracking-tight text-slate-900">Page Not Found</h1>
          <p class="mx-auto mb-8 max-w-sm text-sm font-medium leading-6 text-slate-500">
            The page you requested does not exist or may have moved.
          </p>

          <a
            routerLink="/"
            class="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-primary-200 transition-all hover:bg-primary-700 active:scale-95">
            <i class="fas fa-arrow-left"></i>
            Return Home
          </a>
        </div>
      </section>
    </main>
  `
})
export class NotFoundComponent implements OnInit {
  private seo = inject(SeoService);
  private theme = inject(ThemeService);

  ngOnInit() {
    this.theme.resetTheme();
    this.seo.updateSeo({
      title: 'Page Not Found',
      description: 'This iNNkie page does not exist.',
      path: '/404',
      noindex: true
    });
  }
}
