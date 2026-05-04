import { Component, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../shared/services/auth.service';
import { WorkspaceService } from '../shared/services/workspace.service';
import { LogoComponent } from '../logo/logo.component';
import { Workspace } from '@innkie/shared-models';

@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent implements OnInit {
  private auth = inject(Auth);
  router = inject(Router);
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private platformId = inject(PLATFORM_ID);

  isMenuOpen = false;
  isLoggedIn = false;
  userReady$ = this.authService.userReady$;
  activeWorkspace$ = this.workspaceService.activeWorkspace$;
  workspaces$ = this.workspaceService.workspaces$;
  isBrowser = isPlatformBrowser(this.platformId);
  unsubscribeFn: (() => void) | null = null;

  userProfilePicUrl: string = 'assets/default-avatar.png';
  isProfileDropdownOpen = false;
  isToolsDropdownOpen = false;
  isWorkspaceDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = event.target as HTMLElement;
    
    if (!target.closest('.profile-dropdown')) {
      this.isProfileDropdownOpen = false;
    }
    
    if (!target.closest('.tools-dropdown')) {
      this.isToolsDropdownOpen = false;
    }

    if (!target.closest('.workspace-dropdown')) {
      this.isWorkspaceDropdownOpen = false;
    }
  }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userProfilePicUrl = user?.photoURL || 'assets/default-avatar.png';
      if (isPlatformBrowser(this.platformId)) {
        console.log('Auth state changed, logged in:', this.isLoggedIn);
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleWorkspaceDropdown() {
    this.isWorkspaceDropdownOpen = !this.isWorkspaceDropdownOpen;
  }

  switchWorkspace(workspace: Workspace) {
    this.workspaceService.setActiveWorkspace(workspace);
    this.isWorkspaceDropdownOpen = false;
    this.isMenuOpen = false; // close mobile menu if open
    
    // Check if on a dashboard route, if not navigate there
    if (!this.router.url.includes('dashboard') && !this.router.url.includes('settings')) {
       this.router.navigate(['/dashboard']);
    }
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

  toggleToolsDropdown() {
    this.isToolsDropdownOpen = !this.isToolsDropdownOpen;
  }
}
