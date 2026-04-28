import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {APP_PATHS, callRedirect} from '../shared/utils/utils.urls';
import {ShortUrlService} from '../shared/services/short-url.service';
import {LoadingService} from '../shared/services/loading.service';
import {HttpClient} from '@angular/common/http';
import {ShortUrl} from '@innkie/shared-models';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-redirect',
  imports: [NgIf, RouterLink, FormsModule],
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      <!-- 1. Not Found State -->
      <div *ngIf="urlNonExists" class="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div class="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
          <span class="material-icons text-rose-600 text-4xl">link_off</span>
        </div>
        <h2 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">URL Not Found</h2>
        <p class="text-slate-500 mb-8 leading-relaxed">
          The link you're looking for doesn't exist or has been removed from our system.
        </p>
        <button routerLink="/" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all active:scale-[0.98]">
          Back to Homepage
        </button>
      </div>

      <!-- 2. Disabled / Expired State -->
      <div *ngIf="isDisabled" class="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div class="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <span class="material-icons text-amber-600 text-4xl">history</span>
        </div>
        <h2 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Link Expired</h2>
        <p class="text-slate-500 mb-8 leading-relaxed">
          This link has reached its click limit or expiration date and is no longer active.
        </p>
        <button routerLink="/" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-2xl transition-all active:scale-[0.98]">
          Back to Homepage
        </button>
      </div>

      <!-- 3. Password Required State -->
      <div *ngIf="showPasswordForm" class="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 animate-in fade-in zoom-in-95 duration-500">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span class="material-icons text-primary-600 text-4xl">lock</span>
          </div>
          <h2 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">Secure Link</h2>
          <p class="text-slate-500 tracking-tight">This destination is password protected.</p>
        </div>

        <div class="space-y-4">
          <div class="relative group">
            <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600 text-slate-400">
              <span class="material-icons text-xl">key</span>
            </span>
            <input 
              [type]="hide ? 'password' : 'text'"
              [(ngModel)]="password"
              (keyup.enter)="onConfirmPassword()"
              (input)="errorMessage = ''"
              placeholder="Enter password"
              class="block w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
            <button 
              type="button"
              (click)="hide = !hide"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <span class="material-icons text-xl">
                {{ hide ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          
          <div class="h-6">
            <p class="text-xs font-bold text-rose-500 animate-in fade-in slide-in-from-top-1" *ngIf="errorMessage">
              {{ errorMessage }}
            </p>
          </div>

          <button
            (click)="onConfirmPassword()"
            [disabled]="isLoading || !password"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary-200"
          >
            <span class="material-icons text-xl" *ngIf="!isLoading">bolt</span>
            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" *ngIf="isLoading"></span>
            {{ isLoading ? 'VERIFYING...' : 'UNLOCK DESTINATION' }}
          </button>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <a routerLink="/" class="text-sm font-bold text-slate-400 hover:text-primary-600 flex items-center gap-2 transition-colors">
            <span class="material-icons text-base">arrow_back</span>
            Return to innkie
          </a>
        </div>
      </div>

      <!-- 4. Redirecting State (shown when everything is valid but redirect hasn't happened yet) -->
      <div *ngIf="!urlNonExists && !isDisabled && !showPasswordForm" class="text-center animate-in fade-in duration-700">
        <div class="mb-8 relative">
           <div class="w-24 h-24 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
           <div class="absolute inset-0 flex items-center justify-center">
             <span class="material-icons text-primary-600 animate-pulse text-3xl">rocket_launch</span>
           </div>
        </div>
        <h2 class="text-xl font-black text-slate-900 mb-2 tracking-tight">Taking you there...</h2>
        <p class="text-slate-400 font-medium tracking-wide text-sm uppercase">Preparing your destination</p>
      </div>

    </div>
  `
})
export class RedirectComponent implements OnInit {

  router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  shortUrlService: ShortUrlService = inject(ShortUrlService);
  loadingService: LoadingService = inject(LoadingService);
  http: HttpClient = inject(HttpClient);
  
  isDisabled: boolean = false;
  shortCode: string = '';
  urlNonExists: boolean = false;
  showPasswordForm: boolean = false;
  password: string = '';
  errorMessage: string = '';
  hide: boolean = true;
  isLoading: boolean = false;

  async ngOnInit() {
    this.shortCode = this.route.snapshot.paramMap.get('shortcode')!;
    const isPasswordForced = this.route.snapshot.queryParamMap.get('pw') === 'true';

    if (isPasswordForced) {
      this.showPasswordForm = true;
      return;
    }

    try {
      if (!APP_PATHS.includes(this.shortCode)) {
        let shortURlData: any;

        if (this.shortCode.length === 6) {
          shortURlData = await this.shortUrlService.getShortUrlByCode(this.shortCode);
        } else {
          shortURlData = await this.shortUrlService.getShortUrlByAlias(this.shortCode);
        }

        if (!shortURlData) {
          this.urlNonExists = true;
          return;
        }

        if (!this.checkUrlStatus(shortURlData)) {
          this.isDisabled = true;
          return;
        }

        if (shortURlData.passwordProtected) {
          this.showPasswordForm = true;
        } else {
          await this.performRedirect();
        }
      } else {
          // If it IS an APP_PATH but somehow reached here, go home
          this.router.navigate(['/']);
      }
    } catch (err) {
      console.error("Error in redirect::", err);
      this.urlNonExists = true;
    }
  }

  async performRedirect(password: string = '') {
    try {
      const res: any = await callRedirect(this.shortCode, this.http, password);
      
      if (res.redirect && res.originalUrl) {
        window.location.href = res.originalUrl;
      } else if (res.message === 'Password is required' || res.message === 'Password is invalid') {
        this.showPasswordForm = true;
        this.errorMessage = res.message === 'Password is invalid' ? 'Invalid password! Try again' : '';
        this.isLoading = false;
      } else {
        this.urlNonExists = true;
      }
    } catch (err) {
      console.error("Redirect call failed:", err);
      this.errorMessage = 'An error occurred while redirecting.';
      this.isLoading = false;
    }
  }

  async onConfirmPassword() {
    if (!this.password.trim()) {
      this.errorMessage = 'Password is required';
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
      if (expiration.maxClicks !== undefined && (shortUrlData.clickCount as any || 0) >= expiration.maxClicks) {
        return false;
      }
    } else if (expiration.mode === 'duration') {
      const now = new Date();
      const createdAt = (shortUrlData.createdAt as any)?.toDate ? (shortUrlData.createdAt as any).toDate() : new Date(shortUrlData.createdAt as any);
      
      if (!createdAt) return true;

      const diffMs = now.getTime() - createdAt.getTime();
      const diffValue = expiration.durationValue || 0;

      if (expiration.durationUnit === 'hours') {
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= diffValue) return false;
      } else if (expiration.durationUnit === 'days') {
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= diffValue) return false;
      }
    }

    return true;
  }
}
