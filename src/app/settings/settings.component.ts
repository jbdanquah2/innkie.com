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
import { CommonModule, NgClass, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { AppUser, Workspace, WorkspaceRole } from '@innkie/shared-models';
import { TimeAgoPipe } from '../shared/services/time-ago.pipe';
import { ToastService } from '../shared/services/toast.service';

import { Auth, EmailAuthProvider } from '@angular/fire/auth';
import {Subject, takeUntil} from 'rxjs';
import { WorkspaceService } from '../shared/services/workspace.service';
import { ThemeService } from '../shared/services/theme.service';
import {ConfirmDialogComponent} from '../shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, TimeAgoPipe, FormsModule, ConfirmDialogComponent],
})
export class SettingsComponent implements OnInit, OnDestroy {
  authService: AuthService = inject(AuthService);
  afAuth = inject(Auth);
  workspaceService = inject(WorkspaceService);
  themeService = inject(ThemeService);
  private toast = inject(ToastService);

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
  isSavingBranding = false;

  // Member Management State
  newMemberEmail = '';
  newMemberRole: WorkspaceRole = 'editor';
  isAddingMember = false;
  isUpdatingMemberRole = false;

  get canManageMembers(): boolean {
    if (!this.activeWorkspace || !this.currentUser) return false;
    const member = this.activeWorkspace.members.find(m => m.uid === this.currentUser?.uid);
    return member?.role === 'owner' || member?.role === 'admin';
  }

  // Generic Confirmation Dialog State
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'info' | 'warning' = 'info';
  confirmBtnText = 'Confirm';
  onConfirmCallback: (() => void) | null = null;

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
        
        // Handle Branding Form (source from active workspace)
        const branding = ws?.branding;
        const defaultName = ws?.name || 'iNNkie';
        
        this.brandingForm = this.fb.group({
          brandName: [branding?.brandName || defaultName],
          brandColor: [branding?.brandColor || '#6366f1'],
          logoUrl: [branding?.logoUrl || ''],
          websiteUrl: [(branding as any)?.websiteUrl || '']
        });
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
      try {
        // Implementation here...
        this.hasPassword = true;
        this.toast.success('Password added successfully!');
      } catch (error) {
        this.toast.error('Failed to link password.');
      }
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
      this.toast.success('Profile updated successfully!');
    } catch (err) {
      this.toast.error('Profile update failed. Try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  async toggleNotifications(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      await this.authService.patchUser({ notificationDisabled: !input.checked });
      this.toast.success('Email notification status updated successfully!');
    } catch (err) {
      this.toast.error('Failed to update notification preference.');
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
    // Implementation here if needed
  }

  async createWorkspace() {
    if (!this.newWorkspaceName.trim()) return;
    this.isCreatingWorkspace = true;
    try {
      await this.workspaceService.createWorkspace(this.newWorkspaceName);
      this.newWorkspaceName = '';
      this.toast.success('Your new workspace is ready to use.');
    } catch (err) {
      this.toast.error('Failed to create workspace.');
    } finally {
      this.isCreatingWorkspace = false;
    }
  }

  openConfirm(title: string, message: string, type: 'danger' | 'info' | 'warning', btnText: string, callback: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmType = type;
    this.confirmBtnText = btnText;
    this.onConfirmCallback = callback;
    this.showConfirmDialog = true;
  }

  showAlert(title: string, message: string, type: 'danger' | 'info' | 'warning' = 'info') {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmType = type;
    this.confirmBtnText = 'Close';
    this.onConfirmCallback = null; // No callback for alerts
    this.showConfirmDialog = true;
  }

  onDialogConfirm() {
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    }
    this.showConfirmDialog = false;
  }

  onDialogCancel() {
    this.showConfirmDialog = false;
    this.onConfirmCallback = null;
  }

  async updateWorkspaceName(workspace: Workspace, newName: string) {
    if (!newName.trim() || newName === workspace.name) return;
    try {
      await this.workspaceService.updateWorkspace(workspace.id, { name: newName });
      this.toast.success('Workspace updated successfully!');
    } catch (err) {
      this.toast.error('Failed to update workspace.');
    }
  }

  async deleteWorkspace(workspace: Workspace) {
    if (workspace.plan !== 'free') {
       this.toast.info('Only free workspaces can be deleted through the UI for now. Contact support for others.');
       return;
    }

    this.openConfirm(
      'Delete Workspace',
      `Are you sure you want to delete workspace "${workspace.name}"? This action is permanent and all associated links and analytics will be lost.`,
      'danger',
      'Delete Workspace',
      async () => {
        try {
          await this.workspaceService.deleteWorkspace(workspace.id);
          this.toast.success('Workspace deleted successfully!');
        } catch (err) {
          this.toast.error('Failed to delete workspace.');
        }
      }
    );
  }

  async setDefaultWorkspace(workspaceId: string) {
    try {
      await this.workspaceService.setDefaultWorkspace(workspaceId);
      this.toast.success('Home workspace updated!');
    } catch (err) {
      this.toast.error('Failed to update default workspace.');
    }
  }

  async saveBranding() {
    if (!this.brandingForm || this.brandingForm.invalid || !this.activeWorkspace) return;
    
    this.isSavingBranding = true;
    try {
      const brandingData = this.brandingForm.value;
      await this.workspaceService.updateWorkspace(this.activeWorkspace.id, {
        branding: brandingData
      });
      
      // Update local state and apply theme immediately
      if (this.activeWorkspace.branding) {
        this.activeWorkspace.branding.brandColor = brandingData.brandColor;
      }
      this.themeService.applyTheme(brandingData.brandColor);

      this.toast.success('Branding updated successfully!');
    } catch (err) {
      this.toast.error('Failed to update branding.');
    } finally {
      this.isSavingBranding = false;
    }
  }

  async addMember() {
    if (!this.activeWorkspace || !this.newMemberEmail.trim()) return;
    
    this.isAddingMember = true;
    try {
      await this.workspaceService.addMember(this.activeWorkspace.id, this.newMemberEmail, this.newMemberRole);
      this.newMemberEmail = '';
      this.toast.success('Member added successfully!');
    } catch (err: any) {
      const msg = err.error?.message || 'Failed to add member.';
      this.toast.info(msg);
    } finally {
      this.isAddingMember = false;
    }
  }

  async updateMemberRole(memberUid: string, role: string) {
    if (!this.activeWorkspace) return;
    
    this.isUpdatingMemberRole = true;
    try {
      await this.workspaceService.updateMemberRole(this.activeWorkspace.id, memberUid, role as WorkspaceRole);
      this.toast.success('Member role updated!');
    } catch (err: any) {
      const msg = err.error?.message || 'Failed to update member role.';
      this.toast.error(msg);
    } finally {
      this.isUpdatingMemberRole = false;
    }
  }

  async removeMember(member: any) {
    if (!this.activeWorkspace) return;

    this.openConfirm(
      'Remove Team Member',
      `Are you sure you want to remove ${member.email} from this workspace? They will lose access to all workspace resources.`,
      'danger',
      'Remove Member',
      async () => {
        try {
          await this.workspaceService.removeMember(this.activeWorkspace!.id, member.uid);
          this.toast.success('Member removed successfully!');
        } catch (err: any) {
          const msg = err.error?.message || 'Failed to remove member.';
          this.toast.error(msg);
        }
      }
    );
  }
}
