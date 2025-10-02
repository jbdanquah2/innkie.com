import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
  MatDialogTitle, MatDialogClose
} from '@angular/material/dialog';
import { ShortUrl, Expiration } from '../../shared/models/short-url.model';
import { MatFormField, MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import {MatButton, MatIconButton} from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import {Timestamp} from '@angular/fire/firestore';

@Component({
  selector: 'app-link-editor-dialog',
  standalone: true,
  templateUrl: './link-editor-dialog.component.html',
  imports: [
    MatDialogContent,
    MatFormField,
    ReactiveFormsModule,
    MatInput,
    MatButtonToggleGroup,
    MatRadioGroup,
    MatRadioButton,
    MatDialogActions,
    MatButton,
    MatDialogTitle,
    MatButtonToggle,
    MatFormFieldModule,
    NgIf,
    MatDialogClose,
    MatTooltip,
    MatExpansionPanel,
    MatSlideToggle,
    MatIcon,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatIconButton
  ],
  styleUrls: ['./link-editor-dialog.component.scss']
})
export class LinkEditorDialogComponent implements OnInit {
  form!: FormGroup<{
    title: FormControl<string>;
    originalUrl: FormControl<string>;
    customAlias: FormControl<string>;
    shortCode: FormControl<string>;
    expiration: FormControl<string>;
    expirationValue: FormControl<number | null>;
    passwordProtected: FormControl<boolean>;
    password: FormControl<string>;
    isActive: FormControl<boolean>;
    description: FormControl<string>;
  }>;

  constructor(
    private fb: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<LinkEditorDialogComponent, ShortUrl | null>,
    @Inject(MAT_DIALOG_DATA) public data: ShortUrl | null
  ) {}

  ngOnInit(): void {
    const data = this.data ?? ({} as Partial<ShortUrl>);

    // Determine expiration mode and value
    let expirationMode = 'never';
    let expirationValue: number | null = null;

    if (data.expiration) {

      if (data.expiration.mode === 'oneTime') {
        expirationMode = 'afterClicks';
        expirationValue = data.expiration.maxClicks ?? 1;

      } else if (data.expiration.mode === 'duration') {

        if (data.expiration.durationUnit === 'hours') {
          expirationMode = 'hours';
          expirationValue = data.expiration.durationValue ?? 1;

        } else if (data.expiration.durationUnit === 'days') {
          expirationMode = 'days';
          expirationValue = data.expiration.durationValue ?? 1;

        }
      }
    }

    this.form = this.fb.group({
      title: [data.title ?? '', [Validators.required, Validators.maxLength(200)]],
      originalUrl: [data.originalUrl ?? '', [Validators.required, Validators.pattern('https?://.+')]],
      customAlias: [data.customAlias ?? '', [Validators.maxLength(20)]],
      shortCode: [data.shortCode ?? '', [Validators.required, Validators.pattern('^[a-zA-Z0-9_-]{4,20}$'), Validators.maxLength(20)]],
      expiration: [expirationMode],
      expirationValue: [{ value: expirationValue, disabled: expirationMode === 'never' }, [Validators.min(1)]],
      passwordProtected: [!!data.passwordProtected],
      password: [data.password ?? ''],
      isActive: [data.isActive ?? true],
      description: [data.description ?? '']
    });

    this.form.get('passwordProtected')!.valueChanges.subscribe(
      (value) => this.togglePasswordValidators(value)
    );

    this.form.get('expiration')!.valueChanges.subscribe(
      (value) => this.updateExpirationValueControl(value)
    );

    this.togglePasswordValidators(!!data.passwordProtected);
  }

  private updateExpirationValueControl(exp: string) {
    const ctrl = this.form.get('expirationValue')!;
    if (exp === 'never') {
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }

  togglePasswordValidators(enabled: boolean) {
    const ctrl = this.form.get('password')!;
    if (enabled) {
      ctrl.setValidators([Validators.required, Validators.minLength(3)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  saveEditLink() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Map expiration fields to Expiration object
    let expiration: Expiration | undefined;
    const expirationMode = this.form.value.expiration;
    const expirationValue = this.form.get('expirationValue')!.value;

    if (expirationMode === 'never') {

      expiration = { mode: 'never' };

    } else if (expirationMode === 'afterClicks') {

      expiration = { mode: 'oneTime', maxClicks: expirationValue ?? 1 };

    } else if (expirationMode === 'hours' || expirationMode === 'days') {

      expiration = {
        mode: 'duration',
        durationValue: expirationValue ?? 1,
        durationUnit: expirationMode === 'hours' ? 'hours' : 'days'
      };

    }

    const createdAt = this.data?.createdAt || Timestamp.now();
    const clickCount = this.data?.clickCount || 0;
    const id = this.data?.shortCode! ?? ''

    delete this.form.value.expirationValue;

    console.log("###saveEditLink", this.form.value);

    const payload: ShortUrl = {
      id,
      ...(this.data ?? {}),
      ...this.form.value,
      expiration,
      shortCode: this.form.value.shortCode!,
      originalUrl: this.form.value.originalUrl! || '',
      customAlias: this.form.value.customAlias! || '',
      description: this.form.value.description! || '',
      isActive: this.form.value?.isActive!,
      passwordProtected: this.form.value.passwordProtected! || false,
      password: this.form.value.passwordProtected ? this.form.value.password! : '',
      createdAt,
      clickCount
    };

    this.dialogRef.close(payload);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
