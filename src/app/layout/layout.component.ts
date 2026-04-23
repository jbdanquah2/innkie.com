import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { WorkspaceService } from '../shared/services/workspace.service';
import { Workspace } from '@innkie/shared-models';
import { LinkCreateSlideOverComponent } from '../shared/components/link-create-slide-over/link-create-slide-over.component';
import { SlideOverService } from '../shared/services/slide-over.service';
import { ThemeService } from '../shared/services/theme.service';
import { LogoComponent } from '../logo/logo.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LinkCreateSlideOverComponent, LogoComponent],
  template: `
    <div class="flex h-screen bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden">
      <!-- Unified Sidebar -->
      <aside class="hidden lg:flex w-72 flex-col bg-white shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] z-30 relative">
        <!-- Platform Branding -->
        <div class="p-6">
          <app-logo size="44px" [showText]="true"></app-logo>

          <!-- Workspace Switcher (Sidebar Integrated) -->

          <div class="mt-6 relative group">
            <label class="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Active Workspace</label>
            <button class="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-sm font-bold text-slate-700">
              <div class="flex items-center gap-2 truncate">
                <i class="fas text-primary-500 text-xs shrink-0" 
                   [class.fa-user]="activeWorkspace?.id?.startsWith('personal_')" 
                   [class.fa-building]="!activeWorkspace?.id?.startsWith('personal_')"></i>
                <span class="truncate">
                  {{ activeWorkspace ? activeWorkspace.name : (isInitialLoad ? 'Loading...' : 'No Workspace Selected') }}
                </span>
              </div>
              <i class="fas fa-chevron-down text-[10px] text-slate-400"></i>
            </button>

            <!-- Dropdown -->
            <div class="absolute left-0 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top scale-95 group-hover:scale-100 z-50">
              <div class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">My Workspaces</div>
              <div class="max-h-48 overflow-y-auto custom-scrollbar">
                @for (ws of workspaces; track ws.id) {
                  <button (click)="switchWorkspace(ws)"
                          class="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          [class.bg-primary-50]="ws.id === activeWorkspace?.id"
                          [class.text-primary-700]="ws.id === activeWorkspace?.id">
                    <div class="flex items-center gap-2">
                      <i class="fas opacity-50" 
                         [class.fa-user]="ws.id.startsWith('personal_')" 
                         [class.fa-building]="!ws.id.startsWith('personal_')"></i>
                      <span class="font-bold">{{ ws.name }}</span>
                    </div>
                    @if (ws.id === activeWorkspace?.id) {
                      <i class="fas fa-check text-[10px] text-primary-600"></i>
                    }
                  </button>
                } @empty {
                  <div class="px-4 py-6 text-center">
                    <p class="text-[10px] font-medium text-slate-400 italic">No workspaces available</p>
                  </div>
                }
              </div>
              <div class="border-t border-slate-50 mt-2 pt-2 px-2">
                <button routerLink="/settings" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                  <i class="fas fa-plus-circle"></i>
                  Manage Workspaces
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Action -->
        <div class="px-6 mb-4">
          <button (click)="openCreateLink()"
                  class="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary-200 transition-all active:scale-95 group">
            <i class="fas fa-plus-circle transition-transform group-hover:rotate-90"></i>
            Create New Link
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Analytics</div>
          <a routerLink="/dashboard" routerLinkActive="bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50" [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all group">
            <i class="fas fa-th-large w-5 text-center group-hover:text-primary-600 transition-colors"></i>
            Command Center
          </a>
          <a routerLink="/analytics" routerLinkActive="bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50"
             class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all group">
            <i class="fas fa-chart-pie w-5 text-center group-hover:text-primary-600 transition-colors"></i>
            Traffic Hub
          </a>

          <div class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 mt-4">Management</div>
          <a routerLink="/links" routerLinkActive="bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50"
             class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all group">
            <i class="fas fa-link w-5 text-center group-hover:text-primary-600 transition-colors"></i>
            Links Hub
          </a>
          <a routerLink="/qr-studio" routerLinkActive="bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50"
             class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all group">
            <i class="fas fa-qrcode w-5 text-center group-hover:text-primary-600 transition-colors"></i>
            QR Studio
          </a>

          <div class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 mt-4">Developers</div>
          <a routerLink="/developer-api" routerLinkActive="bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50"
             class="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all group">
            <i class="fas fa-code w-5 text-center group-hover:text-primary-600 transition-colors"></i>
            API & Keys
          </a>
        </nav>

        <!-- User Profile (Bottom) -->
        <div class="p-4 bg-slate-50/50 border-t border-slate-100">
           @if (user$ | async; as user) {
             <div class="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-primary-100 transition-all cursor-pointer relative">
                <img [src]="user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.displayName || 'User') + '&background=6366f1&color=fff'"
                     class="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-black text-slate-900 truncate">{{ user.displayName }}</p>
                  <p class="text-[10px] font-bold text-slate-400 truncate tracking-tight">{{ user.email }}</p>
                </div>

                <!-- Quick Menu Popup -->
                <div class="absolute bottom-full left-0 mb-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-bottom scale-95 group-hover:scale-100 z-50 overflow-hidden">
                  <a routerLink="/settings" class="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all">
                    <i class="fas fa-cog"></i> Account Settings
                  </a>
                  <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all">
                    <i class="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
             </div>
           }
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
        <div class="max-w-7xl mx-auto">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Global Slide-over -->
      <app-link-create-slide-over></app-link-create-slide-over>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private slideOverService = inject(SlideOverService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  user$ = this.authService.user$;
  workspaces: Workspace[] = [];
  activeWorkspace: Workspace | null = null;
  isInitialLoad = true;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      this.workspaceService.workspaces$.subscribe(ws => {
        console.log('Layout: workspaces updated', ws.length);
        this.workspaces = ws;
        if (ws.length > 0) this.isInitialLoad = false;
      })
    );

    this.subscriptions.add(
      this.workspaceService.activeWorkspace$.subscribe(ws => {
        console.log('Layout: active workspace updated', ws?.id);
        this.activeWorkspace = ws;
        if (ws) this.isInitialLoad = false;
        this.themeService.applyTheme(ws?.branding?.brandColor);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.themeService.resetTheme();
  }

  switchWorkspace(ws: Workspace | null) {
    this.workspaceService.setActiveWorkspace(ws);
  }

  openCreateLink() {
    this.slideOverService.open();
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
