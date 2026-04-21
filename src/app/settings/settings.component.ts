import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { AppUser, Workspace } from '@innkie/shared-models';
import { TimeAgoPipe } from '../shared/services/time-ago.pipe';

import { Auth, EmailAuthProvider } from '@angular/fire/auth';
import {Subject, takeUntil} from 'rxjs';
import { WorkspaceService } from '../shared/services/workspace.service';


@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [ReactiveFormsModule, NgIf, NgClass, TimeAgoPipe, FormsModule, NgForOf],
})
export class SettingsComponent implements OnInit, OnDestroy {
  authService: AuthService = inject(AuthService);
  afAuth = inject(Auth);
  workspaceService = inject(WorkspaceService);

  currentUser: AppUser | null = {} as AppUser;

  settingsForm!: FormGroup;
  passwordForm!: FormGroup;
  brandingForm!: FormGroup;

  showPasswordForm = false;
  showNew = false;
  showConfirm = false;

  isLoading = false;
  hasPassword = false;

  providerIds: string[] = [];

  connectedAccounts = [
    {
      name: 'google',
      connected: true,
      username: 'john.doe',
    },
  ];

  workspaces: Workspace[] = [];
  activeWorkspace: Workspace | null = null;
  newWorkspaceName = '';
  isCreatingWorkspace = false;
  showApiKey = false;
  isRotatingApiKey = false;
  isSavingBranding = false;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user as AppUser;

        if (Array.isArray(this.currentUser.providerIds) ) {
          this.providerIds = this.currentUser.providerIds;
          this.hasPassword = this.providerIds.includes('password');
        }

        this.settingsForm = this.fb.group({
          userName: [this.currentUser?.userName || '', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9._-]+$/)
          ]],
          displayName: [this.currentUser?.displayName || '', [Validators.required, Validators.minLength(2)]]
        });

        this.passwordForm = this.fb.group({
          newPassword: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
      });

    this.workspaceService.workspaces$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ws => {
        this.workspaces = ws;
      });

    this.workspaceService.activeWorkspace$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ws => {
        this.activeWorkspace = ws;
        if (ws) {
          this.brandingForm = this.fb.group({
            brandName: [ws.branding?.brandName || ws.name],
            brandColor: [ws.branding?.brandColor || '#6366f1'],
            logoUrl: [ws.branding?.logoUrl || ''],
            websiteUrl: [ws.branding?.websiteUrl || '']
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Ensures new and confirm passwords match
   */
  passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value?.trim() ?? '';
    const confirmPassword = group.get('confirmPassword')?.value?.trim() ?? '';

    if (!newPassword || !confirmPassword) return null;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleVisibility(field: 'new' | 'confirm') {
    if (field === 'new') this.showNew = !this.showNew;
    else this.showConfirm = !this.showConfirm;
  }

  /**
   * Save add password
   */
  async addPassword() {
    const user = this.afAuth.currentUser;
    const newPassword = this.passwordForm.value.newPassword;

    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, newPassword);

      try {
        // const result = await user.linkWithCredential(credential);
        // console.log('Password added successfully:', result);

        this.hasPassword = true;

        alert('Password added successfully!');

      } catch (error) {
        console.error('Error linking password:', error);
      }
    } else {
      console.error('No current user or email');
    }
  }

  cancelSetPassword() {
    this.showPasswordForm = false;
    this.passwordForm?.reset();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Save profile updates
   */
  async saveProfile() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const updated = this.settingsForm.value;

    try {
      await this.authService.patchUser(updated);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Error updating profile. Try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  async toggleNotifications(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      await this.authService.patchUser({ notificationDisabled: !input.checked });
      alert('Email notification status updated successfully!');
    } catch (err) {
      alert('Failed to update notification preference.');
    }
  }

  connectAccount(account: any) {
    console.log(`Connecting to ${account.name}...`);
    // TODO: Implement OAuth flow
  }

  disconnectAccount(account: any) {
    console.log(`Disconnecting from ${account.name}...`);
    account.connected = false;
  }

  changeEmail() {
    console.log('Change email clicked');
    // TODO: Open change email dialog
  }

  resetForm() {

  }

  async createWorkspace() {
    if (!this.newWorkspaceName.trim()) return;
    this.isCreatingWorkspace = true;
    try {
      await this.workspaceService.createWorkspace(this.newWorkspaceName);
      this.newWorkspaceName = '';
      alert('Workspace created successfully!');
    } catch (err) {
      alert('Failed to create workspace.');
    } finally {
      this.isCreatingWorkspace = false;
    }
  }

  async rotateApiKey() {
    if (!this.activeWorkspace) return;
    if (!confirm('Are you sure you want to rotate the API key? The old one will stop working immediately.')) return;

    this.isRotatingApiKey = true;
    try {
      await this.workspaceService.rotateApiKey(this.activeWorkspace.id);
      alert('API Key rotated successfully!');
    } catch (err) {
      alert('Failed to rotate API key.');
    } finally {
      this.isRotatingApiKey = false;
    }
  }

  copyApiKey() {
    if (this.activeWorkspace?.apiKey) {
      navigator.clipboard.writeText(this.activeWorkspace.apiKey);
      alert('API Key copied to clipboard!');
    }
  }

  async updateWorkspaceName(workspace: Workspace, newName: string) {
    if (!newName.trim() || newName === workspace.name) return;
    try {
      await this.workspaceService.updateWorkspace(workspace.id, { name: newName });
      alert('Workspace updated successfully!');
    } catch (err) {
      alert('Failed to update workspace.');
    }
  }

  async deleteWorkspace(workspace: Workspace) {
    if (workspace.plan !== 'free') {
       alert('Only free workspaces can be deleted through the UI for now. Contact support for others.');
       return;
    }
    if (!confirm(`Are you sure you want to delete workspace "${workspace.name}"? This action cannot be undone.`)) return;
    
    try {
      await this.workspaceService.deleteWorkspace(workspace.id);
      alert('Workspace deleted successfully!');
    } catch (err) {
      alert('Failed to delete workspace.');
    }
  }

  async saveBranding() {
    if (!this.activeWorkspace || !this.brandingForm || this.brandingForm.invalid) return;
    
    this.isSavingBranding = true;
    try {
      await this.workspaceService.updateWorkspace(this.activeWorkspace.id, {
        branding: this.brandingForm.value
      });
      alert('Workspace branding updated successfully!');
    } catch (err) {
      alert('Failed to update branding.');
    } finally {
      this.isSavingBranding = false;
    }
  }
}
