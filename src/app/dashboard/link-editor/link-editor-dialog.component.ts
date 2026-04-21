import {Component, EventEmitter, Input, OnInit, Output, inject} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder, ValidatorFn, AbstractControl
} from '@angular/forms';
import { ShortUrl, Expiration } from '@innkie/shared-models';
import { NgIf, NgForOf } from '@angular/common';
import {Timestamp} from '@angular/fire/firestore';
import {ShortUrlService} from '../../shared/services/short-url.service';
import {APP_PATHS} from '../../shared/utils/utils.urls';

@Component({
  selector: 'app-link-editor-dialog',
  standalone: true,
  templateUrl: './link-editor-dialog.component.html',
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./link-editor-dialog.component.scss']
})
export class LinkEditorDialogComponent implements OnInit {
  @Input() data: ShortUrl | null = null;
  @Output() closed = new EventEmitter<{action: string, payload?: any, id?: string} | null>();

  private fb = inject(NonNullableFormBuilder);
  private shortUrlService = inject(ShortUrlService);

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
    tags: FormControl<string>;
  }>;

  aliasMap: Map<string, string> = new Map();
  existingCustomAlias: string = '';
  hide: boolean = true;

  constructor() {}

  ngOnInit(): void {

    const data = this.data ?? ({} as Partial<ShortUrl>);
    this.existingCustomAlias = data.customAlias ?? '';

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
      customAlias: [data.customAlias ?? '',
        [Validators.minLength(6),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_-]{6,20}$/),
        this.reservedAliasValidator()]
      ],
      shortCode: [data.shortCode ?? '', [Validators.pattern('^[a-zA-Z0-9_-]{4,20}$'), Validators.maxLength(20)]],
      expiration: [expirationMode],
      expirationValue: [{ value: expirationValue, disabled: expirationMode === 'never' }, [Validators.min(1)]],
      passwordProtected: [!!data.passwordProtected],
      password: [''],
      isActive: [data.isActive ?? true],
      description: [data.description ?? ''],
      tags: [(data.tags || []).join(', ')]
    });

    this.form.get('passwordProtected')!.valueChanges.subscribe((value) => {
      this.togglePasswordValidators(value)
    });

    this.form.get('expiration')!.valueChanges.subscribe((value) => {
      this.updateExpirationValueControl(value)
    });

    this.togglePasswordValidators(!!data.passwordProtected);
  }

  private updateExpirationValueControl(exp: string) {
    const ctrl = this.form.get('expirationValue')!;
    if (exp === 'never') {
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
      ctrl.setValidators([Validators.required, Validators.min(1)]);
    }
  }

  togglePasswordValidators(enabled: boolean) {
    const ctrl = this.form.get('password')!;
    if (enabled && !this.data?.password) {
      ctrl.setValidators([Validators.required, Validators.minLength(3)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  reservedAliasValidator(): ValidatorFn {
    return (control: AbstractControl): { reserved: boolean } | null => {
      if (!control.value) {
        return  null
      }
      const alias = control.value.toLowerCase().trim();
      return this.checkForReservedAlias(alias)
      ? {reserved: true}:
        null
    }
  }

  async saveEditLink() {
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

    const tagsStr = this.form.value.tags || '';
    const tagsArray = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

    delete this.form.value.expirationValue; // not part of the model
    delete this.form.value.tags;

    const payload: ShortUrl = {
      id,
      ...(this.data ?? {}),
      ...this.form.value,
      expiration,
      shortCode: this.form.value.shortCode!,
      originalUrl: this.form.value.originalUrl! || '',
      customAlias: this.form.value.customAlias!.toLowerCase().trim() || '',
      description: this.form.value.description! || '',
      isActive: this.form.value?.isActive!,
      passwordProtected: this.form.value.passwordProtected! || false,
      password: this.form.value.passwordProtected ? this.form.value.password! : '',
      createdAt,
      clickCount,
      tags: tagsArray
    };

    if (payload.passwordProtected && payload.password && payload.password.length > 0) {
      const {password, passwordSalt } = await this.shortUrlService.hashPassword(payload.password!, payload.shortCode!);
      payload.passwordSalt = passwordSalt;
      payload.password = password;
    } else {
      payload.password = this.data?.password || '';
    }

    if (this.existingCustomAlias !== payload.customAlias) {
      const control = this.form.get('customAlias')!;
      const check = await this.checkAliasExists(payload.customAlias);

      if (check) {
        control.setErrors({aliasTaken: true})
        alert('Custom alias already exists');
        return;
      }

      if (control.hasError('aliasTaken')) {
        const errors = { ...control.errors };
        delete errors['aliasTaken'];
        const hasOtherErrors = Object.keys(errors).length > 0;
        control.setErrors(hasOtherErrors ? errors : null);
      }
    }

    if (this.checkForReservedAlias(payload.customAlias)) {
      alert(`This custom alias "${payload.customAlias}" is reserved`);
      return;
    }

    this.closed.emit({action: "edit", payload: payload});
  }

  deleteShortLink() {
    this.closed.emit({action: "delete", id: this.data?.id});
  }

  async checkAliasExists(customAlias: string | undefined) {
    if (!customAlias) {
      return false;
    }

    if (this.aliasMap.has(customAlias)) {
      return true
    }

    this.aliasMap.set(customAlias, customAlias);
    return await this.shortUrlService.checkAliasExists(customAlias)
  }

  cancel() {
    this.closed.emit(null);
  }

  checkForReservedAlias(customAlias: string | undefined | null): boolean {

    if (!customAlias) {
      return false;
    }

    const reservedAliases = new Set(APP_PATHS);

    return reservedAliases.has(customAlias.toLowerCase());

  }
}
