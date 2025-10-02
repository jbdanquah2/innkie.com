import {Component, Inject, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Auth } from '@angular/fire/auth';
import { environment} from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {AuthService} from '../shared/services/auth.service';
import {AppUser} from '../shared/models/user.model';
import {APP_PATHS} from '../shared/utils/utils.urls';
import {PasswordDialogComponent} from '../password-dialog/password-dialog.component';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ShortUrl} from '../shared/models/short-url.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  urlForm: FormGroup;
  isLoading = false;
  shortenedUrl: string | undefined;
  shortCode: string | undefined;
  error: string | null = null;
  qrCodeUrl: string | null = null;
  imagePreview: any;

  currentUser: AppUser = this.authService.currentUser as AppUser;
  currentPath: string = '/'

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,


  ) {
    this.urlForm = this.fb.group({
      originalUrl: ['', [Validators.required, Validators.pattern('https?://.*')]]
    });
  }

  async ngOnInit() {
    window.scrollTo(0, 0);
  }

  async redirectShortUrl() {

    console.log('Shortening URL', this.urlForm.value?.originalUrl);

    const res = await firstValueFrom(this.http.post(environment.redirectURL, {
      shortCode: this.shortCode,
      passwordProtected: false
    }
    ));

    console.log("###shortenUrl", res);
    return res
  }


  async getPreview() {

    this.error = null;

    console.log("<<>>###getPreview", this.urlForm.value?.originalUrl);
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    const res = await firstValueFrom(this.http.get(environment.previewLongURL + '?longUrl=' + encodeURIComponent(this.urlForm.value?.originalUrl)));

    console.log("###getPreview", res);

    this.imagePreview = res;
  }

  downloadQrCode() {
    if (!this.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = `qr-code-${this.shortCode}.png`;
    link.click();
  }


  async shortenUrl() {
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('Form Value:', this.urlForm.value);

    const originalUrl = this.urlForm.value?.originalUrl;
    const userId = this.auth.currentUser?.uid ?? null;


    try {

      console.log("Generating shortened URL for:", originalUrl, "User ID:", userId);

      const result: any =  await firstValueFrom(this.http.post(environment.shortenUrl, {
        originalUrl: originalUrl,
        userId: userId
      }))

      console.log("###Result:", result);

      if (result.error) {
        this.error = result.error;
        this.isLoading = false;
        return;
      }

      console.log('update user totalUrls', result.totalUrls);
      const totalUrls = this.currentUser.totalUrls || 0;
      this.authService.patchUser({totalUrls: totalUrls + 1})



      this.shortCode = result.shortCode;
      this.shortenedUrl = result.shortenedUrl;
      this.qrCodeUrl = result.qrCodeUrl;

      this.snackBar.open('URL shortened successfully!', 'Close', { duration: 3000 });
    } catch (err) {
      console.error('Error saving shortened URL:', err);
      this.error = 'Failed to save URL. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  copyToClipboard() {
    if (this.shortenedUrl) {
      navigator.clipboard.writeText(this.shortenedUrl)
        .then(() => {
          this.snackBar.open('URL copied to clipboard!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          this.snackBar.open('Failed to copy URL', 'Close', {
            duration: 3000
          });
        });
    }
  }

  openUrl() {
    if (this.shortenedUrl) {
      window.open(this.shortenedUrl, '_blank');
    }
  }

  resetForm() {
    this.urlForm.reset();
    this.shortenedUrl = undefined;
    this.error = null;
  }

  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  shareUrl() {
    if (navigator.share) {
      navigator.share({
        title: 'Check out my shortened link',
        text: 'Here’s a link I shortened:',
        url: this.shortenedUrl,
      })
        .catch(err => console.error('Share failed:', err));
    } else {
      // fallback if not supported
      alert('Sharing not supported on this browser.');
    }
  }

}
