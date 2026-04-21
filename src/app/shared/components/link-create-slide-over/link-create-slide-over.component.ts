import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlideOverService } from '../../services/slide-over.service';
import { ShortUrlService } from '../../services/short-url.service';
import { WorkspaceService } from '../../services/workspace.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-link-create-slide-over',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Overlay Backdrop -->
    <div *ngIf="isOpen$ | async" 
         (click)="close()"
         class="fixed inset-0 bg-slate-900/40 z-[60] transition-opacity duration-300">
    </div>

    <!-- Slide-over Panel -->
    <div class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-100"
         [class.translate-x-0]="isOpen$ | async"
         [class.translate-x-full]="!(isOpen$ | async)">
      
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="px-6 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Create New Link</h2>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Workspace: {{ activeWorkspaceName }}</p>
          </div>
          <button (click)="close()" class="p-2 hover:bg-slate-200 rounded-full transition-all group">
            <i class="fas fa-times text-slate-400 group-hover:text-slate-600"></i>
          </button>
        </div>

        <!-- Form Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
            
            <!-- Destination -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Destination URL</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <i class="fas fa-link text-xs"></i>
                </div>
                <input type="text" formControlName="originalUrl"
                       placeholder="https://example.com/very-long-page-url"
                       class="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" />
              </div>
              <p *ngIf="form.get('originalUrl')?.touched && form.get('originalUrl')?.invalid" class="mt-2 text-xs font-bold text-rose-500">Please enter a valid URL (including http/https)</p>
            </div>

            <!-- Custom Alias & Tags -->
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Custom Alias (Optional)</label>
                <div class="flex">
                  <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold">
                    innk.ie/
                  </span>
                  <input type="text" formControlName="customAlias"
                         placeholder="summer-sale"
                         class="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                <input type="text" formControlName="tags"
                       placeholder="promo, social, summer-2026"
                       class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" />
                <p class="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Separate tags with commas</p>
              </div>
            </div>

            <!-- UTM Builder Accordion -->
            <div class="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <button type="button" (click)="showUtm = !showUtm"
                      class="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <i class="fas fa-bullseye text-xs"></i>
                  </div>
                  <span class="text-sm font-bold text-slate-800">UTM Builder</span>
                </div>
                <i class="fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300" [class.rotate-180]="showUtm"></i>
              </button>
              
              <div *ngIf="showUtm" class="p-6 bg-white space-y-4 border-t border-slate-50 animate-fadeIn">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source</label>
                  <input type="text" formControlName="utmSource" placeholder="twitter, newsletter, etc."
                         class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medium</label>
                  <input type="text" formControlName="utmMedium" placeholder="cpc, social, email, etc."
                         class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Campaign Name</label>
                  <input type="text" formControlName="utmCampaign" placeholder="summer_launch"
                         class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm transition-all" />
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="pt-6 border-t border-slate-50 flex items-center gap-3">
              <button type="button" (click)="close()"
                      class="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button type="submit" [disabled]="form.invalid"
                      class="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                <i class="fas fa-magic"></i>
                Shorten Link
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `]
})
export class LinkCreateSlideOverComponent implements OnInit {
  private slideOverService = inject(SlideOverService);
  private shortUrlService = inject(ShortUrlService);
  private workspaceService = inject(WorkspaceService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);

  isOpen$ = this.slideOverService.isOpen$;
  showUtm = false;
  activeWorkspaceName = 'Personal';

  form: FormGroup = this.fb.group({
    originalUrl: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
    customAlias: [''],
    tags: [''],
    utmSource: [''],
    utmMedium: [''],
    utmCampaign: ['']
  });

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(ws => {
      this.activeWorkspaceName = ws?.name || 'Personal';
    });
  }

  close() {
    this.slideOverService.close();
    this.form.reset();
    this.showUtm = false;
  }

  async submit() {
    if (this.form.invalid) return;

    this.loadingService.show();
    try {
      const val = this.form.value;
      let finalUrl = val.originalUrl;

      // Append UTMs if present
      const utms = [];
      if (val.utmSource) utms.push(`utm_source=${encodeURIComponent(val.utmSource)}`);
      if (val.utmMedium) utms.push(`utm_medium=${encodeURIComponent(val.utmMedium)}`);
      if (val.utmCampaign) utms.push(`utm_campaign=${encodeURIComponent(val.utmCampaign)}`);

      if (utms.length > 0) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += separator + utms.join('&');
      }

      const tags = val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];
      const workspaceId = this.workspaceService.activeWorkspace?.id || null;

      await this.shortUrlService.createShortUrl(finalUrl, workspaceId!, val.customAlias, tags);
      
      alert('Link created successfully!');
      this.close();
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create link. Please check if the alias is already taken.');
    } finally {
      this.loadingService.hide();
    }
  }
}
