import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
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

  isLoggedIn: boolean = false;
  currentHook: string = '';
  hookIndex: number = 0;
  intervalId: number | null = null;

  constructor() {

    onAuthStateChanged(this.auth, (user) => {
      this.isLoggedIn = !!user;
    });
  }


  ngOnInit() {

    this.rotateHook();
    this.intervalId = window.setInterval(() => this.rotateHook(), 4000);

  }

  private rotateHook() {
    this.currentHook = this.upgradeHooks[this.hookIndex];
    this.hookIndex = (this.hookIndex + 1) % this.upgradeHooks.length;
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }


}
