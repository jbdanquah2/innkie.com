import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { APP_PATHS, callRedirect, toDateSafe } from '../shared/utils/utils.urls';
import { ShortUrlService } from '../shared/services/short-url.service';
import { HttpClient } from '@angular/common/http';
import { ShortUrl } from '@innkie/shared-models';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogoComponent } from '../logo/logo.component';
import { ThemeService } from '../shared/services/theme.service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  imports: [NgIf, RouterLink, FormsModule, LogoComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-primary-100 selection:text-primary-900">
      <div class="max-w-md w-full">

        <!-- Branding -->
        <div class="flex justify-center mb-10">
          <app-logo size="56px" [showText]="true"></app-logo>
        </div>

        <!-- Main Container -->
        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">

          <!-- Initial Loading / Transition State -->
          <div *ngIf="!urlNonExists && !isDisabled && !showPasswordForm" class="p-12 flex flex-col items-center text-center">
            <div class="relative mb-6">
              <div class="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <i class="fa-solid fa-link text-primary-600 animate-pulse"></i>
              </div>
            </div>
            <h2 class="text-xl font-bold text-slate-800 mb-2">Redirecting you...</h2>
            <p class="text-slate-500 text-sm">One moment while we verify the link and transport you to your destination.</p>
          </div>

          <!-- Password Required State -->
          <div *ngIf="showPasswordForm && !urlNonExists && !isDisabled" class="p-8 md:p-10">
            <div class="bg-primary-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <i class="fa-solid fa-lock text-primary-600 text-2xl"></i>
            </div>

            <div class="text-center mb-8">
              <h2 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">Protected Link</h2>
              <p class="text-slate-500 leading-relaxed">This link is guarded. Enter the password below to reveal the destination.</p>
            </div>

            <form (ngSubmit)="onConfirmPassword()" class="space-y-6">
              <div class="space-y-1">
                <label for="password" class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div class="relative group">
                  <input
                    [type]="hide ? 'password' : 'text'"
                    id="password"
                    [(ngModel)]="password"
                    (ngModelChange)="errorMessage = ''"
                    name="password"
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                  >
                  <button
                    type="button"
                    (click)="hide = !hide"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors px-2"
                  >
                    <i class="fa-solid" [class.fa-eye]="hide" [class.fa-eye-slash]="!hide"></i>
                  </button>
                </div>

                <!-- Error Message Area - Fixed Height to prevent jumping -->
                <div class="h-6 mt-1">
                  <p *ngIf="errorMessage" class="text-red-500 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <i class="fa-solid fa-circle-exclamation text-xs"></i>
                    {{ errorMessage }}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="isLoading"
                class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <i *ngIf="isLoading" class="fa-solid fa-circle-notch animate-spin"></i>
                <span>{{ isLoading ? 'Unlocking...' : 'Unlock Link' }}</span>
              </button>
            </form>
          </div>

          <!-- Error State: Not Found -->
          <div *ngIf="urlNonExists" class="p-10 md:p-12 text-center">
            <div class="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3">
              <i class="fa-solid fa-ghost text-red-500 text-4xl"></i>
            </div>

            <h2 class="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ghost Link!</h2>
            <p class="text-slate-500 leading-relaxed mb-10">We searched everywhere, but this link seems to have vanished into thin air or never existed at all.</p>

            <a routerLink="/" class="inline-flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]">
              <i class="fa-solid fa-arrow-left"></i>
              Return Home
            </a>
          </div>

          <!-- Error State: Disabled/Expired -->
          <div *ngIf="isDisabled" class="p-10 md:p-12 text-center">
            <div class="bg-amber-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto -rotate-3">
              <i class="fa-solid fa-hourglass-end text-amber-500 text-4xl"></i>
            </div>

            <h2 class="text-3xl font-black text-slate-900 mb-4 tracking-tight">Link Expired</h2>
            <p class="text-slate-500 leading-relaxed mb-10">This link has reached its limit or its time has run out. It is no longer accepting visitors.</p>

            <div class="space-y-4">
              <a routerLink="/" class="block w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]">
                Create Your Own Link
              </a>
              <button routerLink="/" class="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">
                Contact support if you think this is a mistake
              </button>
            </div>
          </div>

        </div>

        <!-- Footer Info -->
        <p class="text-center mt-12 text-slate-400 text-sm font-medium">
          Powered by <span class="text-slate-600 font-bold">iNNkie</span> &bull;
          <a routerLink="/legal/terms" class="hover:text-primary-600 transition-colors">Terms</a> &bull;
          <a routerLink="/legal/privacy" class="hover:text-primary-600 transition-colors">Privacy</a>
        </p>

      </div>
    </div>
  `
})
export class RedirectComponent implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  shortUrlService = inject(ShortUrlService);
  http = inject(HttpClient);
  themeService = inject(ThemeService);
  seo = inject(SeoService);

  isDisabled = false;
  shortCode = '';
  urlNonExists = false;
  showPasswordForm = false;
  password = '';
  errorMessage = '';
  hide = true;
  isLoading = false;

  async ngOnInit() {
    this.themeService.resetTheme();
    this.seo.updateSeo('Redirecting...', 'Please wait while we redirect you.', '', 'assets/preview.png', null, true);
    const code = this.route.snapshot.paramMap.get('shortcode');

    if (!code) {
      this.urlNonExists = true;
      return;
    }

    this.shortCode = code;

    const isPasswordForced = this.route.snapshot.queryParamMap.get('pw') === 'true';

    if (isPasswordForced) {
      this.showPasswordForm = true;
      return;
    }

    try {
      if (!APP_PATHS.includes(this.shortCode)) {

        const data: any =
          this.shortCode.length === 6
            ? await this.shortUrlService.getShortUrlByCode(this.shortCode)
            : await this.shortUrlService.getShortUrlByAlias(this.shortCode);

        if (!data) {
          this.urlNonExists = true;
          return;
        }

        if (!this.checkUrlStatus(data)) {
          this.isDisabled = true;
          return;
        }

        if (data.passwordProtected) {
          this.showPasswordForm = true;
        } else {
          await this.performRedirect();
        }

      } else {
        this.router.navigate(['/']);
      }

    } catch (err) {
      console.error('Redirect init error:', err);
      this.urlNonExists = true;
    }
  }

  async performRedirect(password: string = '') {
    try {
      const res: any = await callRedirect(this.shortCode, this.http, password);

      if (res.redirect && res.originalUrl) {
        window.location.href = res.originalUrl;
        return;
      }

      if (res.message === 'Password is required' || res.message === 'Password is invalid') {
        this.showPasswordForm = true;
        this.errorMessage = res.message === 'Password is invalid' ? 'Invalid password' : '';
        this.isLoading = false;
        return;
      }

      this.urlNonExists = true;

    } catch (err) {
      console.error('Redirect failed:', err);
      this.errorMessage = 'Something went wrong';
      this.isLoading = false;
    }
  }

  async onConfirmPassword() {
    if (!this.password.trim()) {
      this.errorMessage = 'Password required';
      return;
    }

    this.isLoading = true;
    await this.performRedirect(this.password);
  }

  checkUrlStatus(shortUrlData: Partial<ShortUrl>): boolean {
    if (!shortUrlData.isActive) return false;

    const expiration = shortUrlData.expiration;
    if (!expiration) return true;

    if (expiration.mode === 'oneTime') {
      if (
        expiration.maxClicks !== undefined &&
        ((shortUrlData.clickCount as any) || 0) >= expiration.maxClicks
      ) {
        return false;
      }
    }

    if (expiration.mode === 'duration') {
      const now = new Date();
      const createdAt = toDateSafe(shortUrlData.createdAt);

      if (!createdAt) return true;

      const diffMs = now.getTime() - createdAt.getTime();
      const diffValue = expiration.durationValue || 0;

      if (expiration.durationUnit === 'hours') {
        if (diffMs / (1000 * 60 * 60) >= diffValue) return false;
      }

      if (expiration.durationUnit === 'days') {
        if (diffMs / (1000 * 60 * 60 * 24) >= diffValue) return false;
      }
    }

    return true;
  }
}
