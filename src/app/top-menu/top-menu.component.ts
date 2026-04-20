import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {AuthService} from '../shared/services/auth.service';
import {LogoComponent} from '../logo/logo.component';
import { WorkspaceService } from '../shared/services/workspace.service';
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

  isMenuOpen = false;
  isLoggedIn = false;
  unsubscribeFn: (() => void) | null = null;

  userProfilePicUrl: string = 'assets/default-avatar.png';
  isProfileDropdownOpen = false;
  
  workspaces: Workspace[] = [];
  activeWorkspace: Workspace | null = null;
  isWorkspaceDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.isProfileDropdownOpen = false;
    }
    if (!target.closest('.workspace-dropdown')) {
      this.isWorkspaceDropdownOpen = false;
    }
  }

  ngOnInit() {

    this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userProfilePicUrl = user?.photoURL || 'assets/default-avatar.png';
      console.log('Auth state changed, logged in:', this.isLoggedIn);
    });

    this.workspaceService.workspaces$.subscribe(workspaces => {
      this.workspaces = workspaces;
    });

    this.workspaceService.activeWorkspace$.subscribe(workspace => {
      this.activeWorkspace = workspace;
    });

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

  toggleWorkspaceDropdown() {
    this.isWorkspaceDropdownOpen = !this.isWorkspaceDropdownOpen;
  }

  selectWorkspace(workspace: Workspace) {
    this.workspaceService.setActiveWorkspace(workspace);
    this.isWorkspaceDropdownOpen = false;
  }
}
