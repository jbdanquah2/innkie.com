import {Component, EventEmitter, Input, OnInit, Output, inject} from '@angular/core';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder, ValidatorFn, AbstractControl
} from '@angular/forms';
import { ShortUrl, Expiration } from '@innkie/shared-models';
import { NgIf, NgForOf, NgClass } from '@angular/common';
import {Timestamp} from '@angular/fire/firestore';
import {ShortUrlService} from '../../shared/services/short-url.service';
import {APP_PATHS} from '../../shared/utils/utils.urls';
import {ToastService} from '../../shared/services/toast.service';

@Component({
  selector: 'app-link-editor-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgForOf,
    NgClass
  ],
  template: `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span class="material-icons text-2xl">edit</span>
          </div>
          <div>
            <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Edit Link</h2>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{{data?.shortCode}}</span>
              <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">{{data?.clickCount || 0}} clicks</span>
            </div>
          </div>
        </div>
        <button (click)="cancel()" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
          <span class="material-icons text-xl">close</span>
        </button>
      </div>

      <!-- Form Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <form [formGroup]="form" (ngSubmit)="saveEditLink()" class="p-8 space-y-10 pb-12">
          
          <!-- 1. Core Configuration -->
          <section>
            <div class="flex items-center gap-2 mb-6">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">01. Core Configuration</span>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>
            
            <div class="grid grid-cols-1 gap-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Title</label>
                <input 
                  type="text" 
                  formControlName="title"
                  class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                  placeholder="My Campaign Landing Page"
                />
                <div class="flex justify-between items-center px-1">
                  <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1" *ngIf="form.get('title')?.touched && form.get('title')?.errors?.['required']">Title is required</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">{{ form.get('title')?.value?.length || 0 }}/200</p>
                </div>
              </div>

              <div class="space-y-1.5 opacity-60">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Original URL (Read-only)</label>
                <div class="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-slate-500 font-medium text-sm truncate flex items-center gap-2">
                   <span class="material-icons text-sm">lock</span>
                   {{ form.get('originalUrl')?.value }}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5 text-left">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Alias</label>
                  <div class="relative group">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors group-focus-within:text-primary-600 font-bold text-sm">innkie.com/</span>
                    <input 
                      type="text" 
                      formControlName="customAlias"
                      class="w-full pl-[92px] pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                      placeholder="vanity-url"
                    />
                  </div>
                  <div class="px-1">
                    <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 space-y-1" *ngIf="form.get('customAlias')?.touched && form.get('customAlias')?.invalid">
                      <span *ngIf="form.get('customAlias')?.hasError('aliasTaken')">This alias is already taken</span>
                      <span *ngIf="form.get('customAlias')?.hasError('minlength')">Min 6 characters</span>
                      <span *ngIf="form.get('customAlias')?.hasError('pattern')">Letters, numbers, underscores, dashes only</span>
                      <span *ngIf="form.get('customAlias')?.hasError('reserved')">This alias is reserved</span>
                    </p>
                    <p class="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest" *ngIf="!form.get('customAlias')?.invalid">Optional vanity path</p>
                  </div>
                </div>

                <div class="space-y-1.5 text-left">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tags</label>
                  <input 
                    type="text" 
                    formControlName="tags"
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                    placeholder="e.g. promo, social, 2024"
                  />
                  <p class="text-[10px] font-medium text-slate-400 px-1 uppercase tracking-widest mt-1">Comma separated</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. Campaign Tracking -->
          <section>
            <div class="flex items-center gap-2 mb-6">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">02. Campaign Tracking (UTM)</span>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-3 space-y-1.5 text-left">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Campaign Name</label>
                <input
                  type="text"
                  formControlName="utmCampaign"
                  class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                  placeholder="e.g. summer_sale_2024"
                />
              </div>
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source</label>
                <input
                  type="text"
                  formControlName="utmSource"
                  class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                  placeholder="e.g. twitter, email"
                />
              </div>
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medium</label>
                <input
                  type="text"
                  formControlName="utmMedium"
                  class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                  placeholder="social, ads"
                />
              </div>
            </div>
            <div class="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
               <span class="material-icons text-slate-400 text-lg">auto_fix_high</span>
               <p class="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest">
                 iNNkie will automatically append these parameters to your destination URL during redirection for advanced tracking.
               </p>
            </div>
          </section>

          <!-- 3. Security & Expiration -->
          <section>
            <div class="flex items-center gap-2 mb-6">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">03. Security & Expiration</span>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
               <!-- Expiration -->
               <div class="space-y-4 text-left">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Expiration</label>
                  <div class="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button 
                      type="button"
                      *ngFor="let opt of ['never', 'afterClicks', 'hours', 'days']"
                      (click)="form.get('expiration')?.setValue(opt)"
                      [class]="form.get('expiration')?.value === opt ? 'bg-white shadow-md text-primary-600' : 'text-slate-500 hover:text-slate-800'"
                      class="flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all capitalize"
                    >
                      {{ opt === 'afterClicks' ? 'Clicks' : opt }}
                    </button>
                  </div>

                  <div class="animate-in fade-in slide-in-from-top-2 duration-300" *ngIf="form.get('expiration')?.value !== 'never'">
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Value</label>
                       <input 
                         type="number" 
                         formControlName="expirationValue"
                         min="1"
                         class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold text-sm shadow-sm"
                       />
                    </div>
                  </div>
               </div>

               <!-- Password -->
               <div class="space-y-4 text-left">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password Protection</label>
                  
                  <div class="flex items-center gap-6 px-1">
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" [value]="false" formControlName="passwordProtected" class="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500">
                      <span class="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest transition-colors">None</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" [value]="true" formControlName="passwordProtected" class="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500">
                      <span class="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest transition-colors">Protected</span>
                    </label>
                  </div>

                  <div *ngIf="form.get('passwordProtected')?.value" class="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5">
                    <div class="relative group">
                      <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                        <span class="material-icons text-lg">lock</span>
                      </span>
                      <input 
                        [type]="hide ? 'password' : 'text'"
                        formControlName="password"
                        placeholder="Set new password"
                        class="w-full pl-11 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm"
                      />
                      <button 
                        type="button"
                        (click)="hide = !hide"
                        class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <span class="material-icons text-lg">
                          {{ hide ? 'visibility_off' : 'visibility' }}
                        </span>
                      </button>
                    </div>
                    <div class="flex justify-between items-center px-1">
                       <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-in fade-in" *ngIf="form.get('password')?.touched && form.get('password')?.invalid">Min 3 characters</p>
                       <p class="text-[9px] font-medium text-slate-400 uppercase tracking-tighter ml-auto leading-tight text-right">Existing passwords remain encrypted and hidden.</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          <!-- 4. Final Settings -->
          <section>
             <div class="flex items-center gap-2 mb-6">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">04. Additional Controls</span>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>

            <div class="space-y-6">
               <div class="space-y-1.5 text-left">
                  <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Description</label>
                  <textarea 
                    formControlName="description"
                    rows="3"
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-medium text-sm shadow-sm resize-none"
                    placeholder="Describe this link for your team..."
                  ></textarea>
               </div>

               <div class="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div class="flex items-center gap-4">
                     <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                        <span class="material-icons">visibility</span>
                     </div>
                     <div>
                        <p class="text-sm font-black text-slate-900 leading-none mb-1">Status</p>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500">{{ form.get('isActive')?.value ? 'Link is public & active' : 'Link is disabled' }}</p>
                     </div>
                  </div>

                  <label class="relative inline-flex items-center cursor-pointer group">
                    <input type="checkbox" formControlName="isActive" class="sr-only peer">
                    <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
                  </label>
               </div>
            </div>
          </section>
        </form>
      </div>

      <!-- Footer Actions -->
      <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button 
          type="button" 
          (click)="deleteShortLink()"
          class="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest active:scale-95"
        >
          <span class="material-icons text-base">delete_outline</span>
          Delete Link
        </button>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            (click)="cancel()"
            class="flex-1 sm:flex-none px-6 py-3.5 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            (click)="saveEditLink()"
            [disabled]="form.invalid"
            class="flex-1 sm:flex-none px-10 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span class="material-icons text-sm">check_circle</span>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  `
})
export class LinkEditorDialogComponent implements OnInit {
  @Input() data: ShortUrl | null = null;
  @Output() closed = new EventEmitter<{action: string, payload?: any, id?: string} | null>();

  private fb = inject(NonNullableFormBuilder);
  private shortUrlService = inject(ShortUrlService);
  private toast = inject(ToastService);

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
    utmSource: FormControl<string>;
    utmMedium: FormControl<string>;
    utmCampaign: FormControl<string>;
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
      tags: [(data.tags || []).join(', ')],
      utmSource: [data.campaign?.utmSource ?? ''],
      utmMedium: [data.campaign?.utmMedium ?? ''],
      utmCampaign: [data.campaign?.utmCampaign ?? '']
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

    const campaign = {
      utmSource: this.form.value.utmSource || null,
      utmMedium: this.form.value.utmMedium || null,
      utmCampaign: this.form.value.utmCampaign || null
    };

    delete (this.form.value as any).expirationValue; 
    delete (this.form.value as any).tags;
    delete (this.form.value as any).utmSource;
    delete (this.form.value as any).utmMedium;
    delete (this.form.value as any).utmCampaign;

    const payload: ShortUrl = {
      id,
      ...(this.data ?? {}),
      ...(this.form.value as any),
      expiration,
      campaign,
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
        this.toast.error('Custom alias already exists');
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
      this.toast.warn(`This custom alias "${payload.customAlias}" is reserved`);
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
