import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import {MatTooltip} from '@angular/material/tooltip';
import {AuthService} from '../shared/services/auth.service';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltip, MatIcon],
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent implements OnInit {
  private auth = inject(Auth);
  router = inject(Router);
  private authService = inject(AuthService)

  isMenuOpen = false;
  isLoggedIn = false;
  unsubscribeFn: (() => void) | null = null;

  userProfilePicUrl: string = 'assets/default-avatar.png';
  isProfileDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.isProfileDropdownOpen = false;
    }
  }

  ngOnInit() {

    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userProfilePicUrl = user?.photoURL || 'assets/default-avatar.png';
      console.log('Auth state changed, logged in:', this.isLoggedIn);
    })

  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async logout() {
    try {

      this.isMenuOpen = false;

      await this.authService.logout();
      await this.router.navigate(['/']);

    } catch (error) {

      console.error('Error during logout:', error);
    }
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }
}
