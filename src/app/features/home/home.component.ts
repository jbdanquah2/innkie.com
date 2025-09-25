import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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

  shortenUrl() {
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Mock API call - this will be replaced with actual API integration
    setTimeout(() => {
      this.isLoading = false;
      this.shortenedUrl = `https://shorty.io/${this.generateRandomString(6)}`;
    }, 1000);
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
