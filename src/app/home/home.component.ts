import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Auth} from '@angular/fire/auth';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {AuthService} from '../shared/services/auth.service';
import {AppUser} from '../shared/models/user.model';
import {MarketingComponent} from '../marketing/marketing.component';
import {generateQrCode} from '../shared/utils/utils.urls';
import {ShortUrlService} from '../shared/services/short-url.service';
import {ShortUrl} from '../shared/models/short-url.model';
import {LoadingService} from '../shared/services/loading.service';
import {TimeAgoPipe} from '../shared/services/time-ago.pipe';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MarketingComponent,
    TimeAgoPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private shortUrlService = inject(ShortUrlService);
  private loading: LoadingService = inject(LoadingService);

  urlForm: FormGroup;
  apiUrl = environment.appUrl;
  isLoading = false;
  shortenedUrl: string | undefined;
  shortCode: string | undefined;
  error: string | null = null;
  qrCodeUrl: string | null = null;
  imagePreview: any;
  currentUser: AppUser = {} as AppUser;
  currentPath: string = '/';
  allShortUrls: ShortUrl[] = [];
  userId: string | null = null;
  previouslyShortened: boolean = false;
  existingUrl: ShortUrl | undefined = undefined;


  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar) {
    this.urlForm = this.fb.group({
      originalUrl: ['', [Validators.required, Validators.pattern('https?://.*')]]
    });

  }

  ngOnInit() {

    this.currentUser = this.authService.currentUser as AppUser;
    this.userId = this.currentUser.uid;

    if (this.userId && this.shortUrlService.getAll.length <= 1) {
      // using .then to allow normal page load without being blocked
      this.shortUrlService.getUserShortUrls(this.userId)
        .then(res => {
          this.allShortUrls = res;
          this.shortUrlService.updateAllShortUrlsArray(this.allShortUrls);
          console.log("done!!")
        })
    }
  }

  async getPreview() {

    this.error = null;

    console.log("getPreview", this.urlForm.value?.originalUrl);
    if (this.urlForm.invalid) {
      this.error = 'Please enter a valid URL starting with http:// or https://';
      return;
    }

    const res: any = await firstValueFrom(this.http.get(environment.previewLongURL + '?longUrl=' + encodeURIComponent(this.urlForm.value?.originalUrl)));

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

    const originalUrl = this.urlForm.value?.originalUrl.trim();
    const userId = this.auth.currentUser?.uid ?? null;

    // check if the originalUrl has been shortened before
    this.existingUrl  = this.shortUrlService.getAll.find(url => url.originalUrl === originalUrl);
    if (this.existingUrl) {

      console.log("shortened before:", this.existingUrl);

      this.shortenedUrl = `${this.apiUrl}/${this.existingUrl.shortCode}`;
      this.qrCodeUrl = await generateQrCode(originalUrl) || '';
      this.shortCode = this.existingUrl.shortCode;
      this.previouslyShortened = true;
      this.isLoading = false;
      return;
    }

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

      this.shortUrlService.incrementUrlCount()
        .then(res => {
          console.log("incrementUrlCount", res);
        })

      const totalUrls = this.currentUser?.totalUrls || 0;

      await this.authService.patchUser({totalUrls: totalUrls + 1})

      console.log("result.originalUrl", result.originalUrl);
      const qrCode = await generateQrCode(result.originalUrl);

      this.shortCode = result.shortCode;
      this.shortenedUrl = `${this.apiUrl}/${this.shortCode}`;
      this.qrCodeUrl = qrCode || ''

      this.shortUrlService.updateShortUrlArray(result);
      console.log("allShortUrls[]", this.shortUrlService.getAll)

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
      window.open(this.urlForm.value.originalUrl, '_blank');
    }
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
