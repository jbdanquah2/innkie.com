import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LogoComponent } from '../logo/logo.component';
import { ThemeService } from '../shared/services/theme.service';
import { SeoService } from '../shared/services/seo.service';
import { AppUser } from '@innkie/shared-models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LogoComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  isLoggedIn: boolean = false;
  currentUser: AppUser | null = null;
  
  upgradeHooks = [
    'Unlock deeper analytics and see what truly drives your clicks.',
    'Increase your link limits and track performance in real time.',
    'Add your own custom aliases and brand every short link. (coming soon)',
    'Get faster redirects and priority support with Pro.',
    'Access audience insights to optimize your campaigns.'
  ];
  currentHook: string = '';
  hookIndex: number = 0;
  private intervalId: any | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (user) => {
        this.isLoggedIn = !!user;
      });
    }

    // 1. Theme Isolation: Ensure homepage always uses the default iNNkie theme
    this.themeService.resetTheme();

    // 2. SEO: Set home page meta tags
    this.seo.resetSeo();

    this.currentUser = this.authService.currentUser as AppUser;

    this.rotateHook();
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => this.rotateHook(), 4000);
    }
  }

  private rotateHook() {
    this.currentHook = this.upgradeHooks[this.hookIndex];
    this.hookIndex = (this.hookIndex + 1) % this.upgradeHooks.length;
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
