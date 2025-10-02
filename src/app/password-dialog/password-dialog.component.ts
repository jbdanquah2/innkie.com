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
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {callRedirect} from '../shared/utils/utils.urls';

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
  http = inject(HttpClient);
  router = inject(Router);

  password: string = '';
  errorMessage: string = '';
  hide: boolean = true;
  notice: string = '';
  shortCode: string = '';
  passwordProtected: boolean = false;

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

    this.loadingService.show()

    const res: {shortCode: string, originalUrl: string} = await callRedirect(this.shortCode, this.http);
    console.log("From password dailog::",res);

    window.location.href = res.originalUrl;

    this.loadingService.hide()

    this.dialogRef.close({
      ...res
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  unlock() {

    this.loadingService.show()

    console.log("password::", this.password);

    this.loadingService.hide();

  }

}
