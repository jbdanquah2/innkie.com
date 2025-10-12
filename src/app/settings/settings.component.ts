import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass, NgIf, TitleCasePipe } from '@angular/common';
import { AuthService } from '../shared/services/auth.service';
import { AppUser } from '../shared/models/user.model';
import { TimeAgoPipe } from '../shared/services/time-ago.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';

import {AngularFireAuth} from '@angular/fire/compat/auth';
import { Auth, updatePassword, EmailAuthProvider } from '@angular/fire/auth';


@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [ReactiveFormsModule, NgIf, NgClass, TimeAgoPipe, TitleCasePipe, FormsModule],
})
export class SettingsComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  snackBar: MatSnackBar = inject(MatSnackBar);
  afAuth = inject(Auth);

  currentUser: AppUser | null = {} as AppUser;

  settingsForm!: FormGroup;
  passwordForm!: FormGroup;

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

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user as AppUser;
      this.providerIds = this.currentUser.providerIds as string[]

      // --- Main settings form ---
      this.settingsForm = this.fb.group({
        userName: [
          this.currentUser?.userName || '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(30),
            Validators.pattern(/^[a-zA-Z0-9._-]+$/),
          ],
        ],
        displayName: [
          this.currentUser?.displayName || '',
          [Validators.required, Validators.minLength(2)],
        ],
      });

      // --- Password form ---
      this.passwordForm = this.fb.group(
        {
          newPassword: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordMatchValidator }
      );
    });
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

        this.snackBar.open('Password added successfully!', 'Close', { duration: 3000 });

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
      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
    } catch (err) {
      console.error('Profile update failed:', err);
      this.snackBar.open('Error updating profile. Try again later.', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async toggleNotifications(event: Event) {
    const input = event.target as HTMLInputElement;
    try {
      await this.authService.patchUser({ notificationDisabled: !input.checked });
      this.snackBar.open('Email notification status updated successfully!', 'Close', {
        duration: 3000,
      });
    } catch (err) {
      this.snackBar.open('Failed to update notification preference.', 'Close', { duration: 3000 });
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
}
