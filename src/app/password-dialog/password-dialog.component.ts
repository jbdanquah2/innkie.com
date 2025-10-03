import {Component, inject, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef,} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {Router, RouterLink} from '@angular/router';
import {LoadingService} from '../shared/services/loading.service';
import {HttpClient} from '@angular/common/http';
import {callRedirect} from '../shared/utils/utils.urls';
import {ShortUrlService} from '../shared/services/short-url.service';
import {MatSnackBar} from '@angular/material/snack-bar';

interface RedirectResponse {
  redirect: boolean;
  shortCode: string;
  originalUrl: string;
  message: string;
}

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss'],
})
export class PasswordDialogComponent implements OnInit {

  loadingService = inject(LoadingService);
  shortUrlService = inject(ShortUrlService);
  http = inject(HttpClient);
  router = inject(Router);
  snackbar: MatSnackBar = inject(MatSnackBar);

  password: string = '';
  errorMessage: string = '';
  hide: boolean = true;
  notice: string = '';
  shortCode: string = '';
  passwordProtected: boolean = false;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<PasswordDialogComponent, any | null>,
    @Inject(MAT_DIALOG_DATA) public data: { message?: string, shortCode?: string, passwordProtected: boolean }
  ) {

    this.notice = this.data?.message!;
    this.shortCode = this.data?.shortCode!
    this.passwordProtected = this.data.passwordProtected

  }

  ngOnInit() {
    console.log("password dialog::", this.data)
  }

  async onConfirm() {

    if (!this.password.trim()) {
      this.errorMessage = 'Password is required';
      return;
    }

    try {

      // this.loadingService.show()
      this.isLoading = true;

      const res: RedirectResponse = await callRedirect(this.shortCode, this.http, this.password, );
      console.log("From password dialog::", res);

      if (!res.redirect) {

        this.isLoading = false;

        console.log("Password is not valid");
        this.snackbar.open('Invalid password! Try again', 'Close', {
          duration: 3000
        })
        this.errorMessage = 'Invalid password! Try again';

        return
      }

      window.location.href = res.originalUrl;

      // this.loadingService.hide()
      this.isLoading = false;

      this.dialogRef.close({
        ...res
      });

    }catch (err) {

      console.log("Error in password dialog::", err);

      // this.loadingService.hide()
      this.isLoading = false;

    }

  }

  onCancel() {
    this.dialogRef.close(null);
  }

  onPasswordChange() {
    this.errorMessage = '';
  }


}
