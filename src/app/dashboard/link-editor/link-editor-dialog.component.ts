// link-editor-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
  MatDialogTitle, MatDialogClose
} from '@angular/material/dialog';
import { ShortUrl } from '../../shared/models/short-url.model';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {MatButton} from '@angular/material/button';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {NgIf} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';

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
    MatDialogClose
  ],
  styleUrls: ['./link-editor-dialog.component.scss']
})
export class LinkEditorDialogComponent implements OnInit {
  form!: FormGroup;
  // available expiration kinds
  expirationKinds = ['never', 'afterClicks', 'minutes', 'hours', 'days'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LinkEditorDialogComponent, ShortUrl | null>,
    @Inject(MAT_DIALOG_DATA) public data: ShortUrl | null
  ) {}

  ngOnInit(): void {
    // initialize form with either incoming data or defaults
    const d = this.data ?? ({} as Partial<ShortUrl>);
    this.form = this.fb.group({
      title: [d.title ?? '', [Validators.required, Validators.maxLength(200)]],
      shortCode: [d.shortCode ?? '', Validators.required],
      originalUrl: [d.originalUrl ?? '', [Validators.required, Validators.pattern('https?://.+')]],
      expiration: [(d as any).expiration ?? 'never'],
      expirationValue: [d.expirationValue ?? 1],
      passwordProtected: [!!d.passwordProtected],
      password: [d.password ?? '']
    });

    // toggle password validators when changed
    this.form.get('passwordProtected')!.valueChanges.subscribe((v) => this.togglePasswordValidators(v));
    // initial validator state
    this.togglePasswordValidators(!!d.passwordProtected);
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

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Combine original id fields if any (depends on ShortUrl shape)
    const payload: ShortUrl = {
      ...(this.data ?? {}),
      ...(this.form.value as Partial<ShortUrl>)
    } as ShortUrl;

    this.dialogRef.close(payload);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
