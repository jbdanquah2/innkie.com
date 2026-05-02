import {Component, inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgIf, isPlatformBrowser} from '@angular/common';
import {AuthService} from '../shared/services/auth.service';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';

@Component({
  selector: 'marketing',
  standalone: true,
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './marketing.component.html',
  styleUrl: './marketing.component.scss'
})
export class MarketingComponent implements OnInit, OnDestroy {

  upgradeHooks = [
    'Unlock deeper analytics and see what truly drives your clicks.',
    'Increase your link limits and track performance in real time.',
    'Add your own custom domain and brand every short link. (coming soon)',
    'Get faster redirects and priority support with Pro.',
    'Access audience insights to optimize your campaigns.'
  ];

  auth = inject(Auth);
  platformId = inject(PLATFORM_ID);

  isLoggedIn: boolean = false;
  currentHook: string = '';
  hookIndex: number = 0;
  intervalId: any | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(this.auth, (user) => {
        this.isLoggedIn = !!user;
      });

      this.intervalId = setInterval(() => this.rotateHook(), 4000);
    }
    this.rotateHook();
  }

  private rotateHook() {
    this.currentHook = this.upgradeHooks[this.hookIndex];
    this.hookIndex = (this.hookIndex + 1) % this.upgradeHooks.length;
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
