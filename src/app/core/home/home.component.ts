import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

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
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  urlForm: FormGroup;
  isLoading = false;
  shortenedUrl: string | null = null;
  error: string | null = null;


  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.urlForm = this.fb.group({
      longUrl: ['', [Validators.required, Validators.pattern('https?://.*')]]
    });
  }

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  async shortenUrl() {
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('Form Value:', this.urlForm.value);

    const originalUrl = this.urlForm.value?.longUrl;
    const shortCode = this.generateRandomString(6);
    const userId = this.auth.currentUser?.uid ?? null;

    const shortUrlDoc = {
      id: shortCode,
      userId: userId,
      originalUrl: originalUrl,
      shortCode: shortCode,
      createdAt: serverTimestamp(),
      clickCount: 0
    };

    this.shortenedUrl = `https://lnkurl/${shortCode}`;

    try {
      const urlRef = doc(this.firestore, `shortUrls/${shortCode}`);
      await setDoc(urlRef, shortUrlDoc);

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
    this.shortenedUrl = null;
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
}
