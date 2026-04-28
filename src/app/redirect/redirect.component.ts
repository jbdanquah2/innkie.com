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
    <div class="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      
      <!-- Decorative Background Blobs -->
      <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <!-- Main Card -->
      <div class="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 relative z-10 border border-white">
        
        <!-- 1. Not Found State -->
        <div *ngIf="urlNonExists" class="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div class="relative w-24 h-24 mx-auto mb-8">
            <div class="absolute inset-0 bg-rose-100 rounded-[2rem] transform rotate-6 scale-105 transition-transform duration-300"></div>
            <div class="absolute inset-0 bg-white rounded-[2rem] shadow-sm flex items-center justify-center border border-rose-50">
              <span class="material-icons text-rose-500 text-5xl">link_off</span>
            </div>
          </div>
          <h2 class="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-none">URL Not Found</h2>
          <p class="text-slate-500 mb-10 font-medium leading-relaxed">
            The link you're looking for doesn't exist or has been removed from our system.
          </p>
          <button routerLink="/" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl transition-all hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]">
            <span class="material-icons text-lg">home</span>
            Return to Homepage
          </button>
        </div>

        <!-- 2. Disabled / Expired State -->
        <div *ngIf="isDisabled" class="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div class="relative w-24 h-24 mx-auto mb-8">
            <div class="absolute inset-0 bg-amber-100 rounded-[2rem] transform -rotate-6 scale-105 transition-transform duration-300"></div>
            <div class="absolute inset-0 bg-white rounded-[2rem] shadow-sm flex items-center justify-center border border-amber-50">
              <span class="material-icons text-amber-500 text-5xl">hourglass_empty</span>
            </div>
          </div>
          <h2 class="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-none">Link Expired</h2>
          <p class="text-slate-500 mb-10 font-medium leading-relaxed">
            This link has reached its click limit or expiration date and is no longer active.
          </p>
          <button routerLink="/" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl transition-all hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]">
            <span class="material-icons text-lg">home</span>
            Return to Homepage
          </button>
        </div>

        <!-- 3. Password Required State -->
        <div *ngIf="showPasswordForm" class="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-6 shadow-inner border border-primary-100">
              <span class="material-icons text-primary-600 text-3xl">lock</span>
            </div>
            <h2 class="text-3xl font-black text-slate-900 mb-2 tracking-tight leading-none">Secure Link</h2>
            <p class="text-slate-500 font-medium leading-relaxed">Access to this destination is password protected.</p>
          </div>

          <div class="space-y-6">
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600 text-slate-400">
                <span class="material-icons text-xl">key</span>
              </div>
              <input 
                [type]="hide ? 'password' : 'text'"
                [(ngModel)]="password"
                (keyup.enter)="onConfirmPassword()"
                (input)="errorMessage = ''"
                placeholder="Enter password"
                class="block w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-black placeholder:text-slate-400 placeholder:font-medium text-lg shadow-sm"
              />
              <button 
                type="button"
                (click)="hide = !hide"
                class="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <span class="material-icons text-xl">
                  {{ hide ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            
            <!-- Error Message Container (Fixed Height to prevent layout shift) -->
            <div class="h-6 flex items-center justify-center">
              <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5" *ngIf="errorMessage">
                <span class="material-icons text-[10px]">error_outline</span>
                {{ errorMessage }}
              </p>
            </div>

            <button
              (click)="onConfirmPassword()"
              [disabled]="isLoading || !password"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-xl hover:shadow-primary-600/20 active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
            >
              <ng-container *ngIf="!isLoading">
                <span>Unlock Destination</span>
                <span class="material-icons text-xl">bolt</span>
              </ng-container>
              <ng-container *ngIf="isLoading">
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Verifying...</span>
              </ng-container>
            </button>
          </div>

          <div class="mt-10 text-center">
            <a routerLink="/" class="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors">
              <span class="material-icons text-base">arrow_back</span>
              Powered by iNNkie
            </a>
          </div>
        </div>

        <!-- 4. Redirecting State -->
        <div *ngIf="!urlNonExists && !isDisabled && !showPasswordForm" class="text-center animate-in fade-in duration-1000 py-8">
          <div class="relative w-32 h-32 mx-auto mb-10">
             <!-- Outer pulsing rings -->
             <div class="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
             <div class="absolute inset-2 bg-primary-50 rounded-full animate-pulse"></div>
             
             <!-- Inner spinner container -->
             <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-16 h-16 text-primary-600 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="15 15" class="opacity-20"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
             </div>
             
             <!-- Center icon -->
             <div class="absolute inset-0 flex items-center justify-center">
               <span class="material-icons text-primary-600 text-2xl drop-shadow-sm">rocket_launch</span>
             </div>
          </div>
          
          <h2 class="text-2xl font-black text-slate-900 mb-2 tracking-tight leading-none">Taking you there</h2>
          <p class="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Preparing your destination</p>
        </div>

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
