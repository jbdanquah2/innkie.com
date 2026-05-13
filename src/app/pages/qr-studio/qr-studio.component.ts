import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { QrStudioService } from '../../shared/services/qr-studio.service';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { SeoService } from '../../shared/services/seo.service';
import { QrConfig, QrTemplate, ShortUrl, AppUser, QrGradient } from '@innkie/shared-models';
import QRCodeStyling, { 
  Options, 
  DrawType, 
  TypeNumber, 
  Mode, 
  ErrorCorrectionLevel, 
  DotType, 
  CornerSquareType, 
  CornerDotType 
} from 'qr-code-styling';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { RelatedToolsComponent } from '../../shared/components/related-tools/related-tools.component';
import { isLinkInWorkspace } from '@innkie/shared-models';
import { handleFaviconError as safeHandleFaviconError } from '../../shared/utils/utils.urls';
import { ToastService } from '../../shared/services/toast.service';
import { TOOL_REGISTRY, UtilityTool } from '../../shared/config/tool-registry';

type Direction = 'diagonal' | 'horizontal' | 'vertical' | 'radial';
type FrameOption = 'None' | 'Basic' | 'Rounded' | 'Bold' | 'Minimal';

@Component({
  selector: 'app-qr-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, RouterLink, RelatedToolsComponent],
  template: `
    <div class="max-w-7xl mx-auto space-y-10 animate-fadeIn pb-20 pt-10 px-4 sm:px-6 lg:px-8">
      <!-- Navigation -->
      <nav class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <ng-container *ngIf="isLoggedIn()">
            <a routerLink="/dashboard" class="hover:text-primary-600 transition-colors">Dashboard</a>
            <span class="opacity-30">/</span>
          </ng-container>
          <a routerLink="/tools" class="hover:text-primary-600 transition-colors">Tools</a>
          <span class="opacity-30">/</span>
          <a routerLink="/tools/qr-generator" class="hover:text-primary-600 transition-colors">Generator</a>
          <span class="opacity-30">/</span>
          <span class="text-slate-900">Studio</span>
        </div>
        
        <a [routerLink]="isLoggedIn() ? '/dashboard' : '/tools/qr-generator'" 
           class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary-600 transition-all group">
          <i class="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
          {{ isLoggedIn() ? 'Back to Dashboard' : 'Back to Generator' }}
        </a>
      </nav>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">QR Studio</h1>
          <p class="text-slate-500 font-medium mt-1">Design your brand's unique QR style.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- Left: Live Preview (Sticky) -->
        <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
           <div class="card p-10 bg-white border border-slate-100 shadow-sm rounded-3xl flex flex-col items-center gap-6 relative overflow-hidden group">
              <div class="relative">
                <div #qrCanvas class="rounded-3xl shadow-md border border-slate-50 transition-transform duration-500 hover:scale-105 bg-white overflow-hidden flex items-center justify-center" style="width: 300px; height: 300px;"></div>
              </div>

              <div class="text-center space-y-1">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Brand Preview</p>
                <p class="text-sm font-bold text-slate-600">Apply this style to any link</p>
              </div>

              <!-- Export Actions -->
              <div class="w-full grid grid-cols-2 gap-3 mt-4 pt-6 border-t border-slate-50">
                 <button (click)="downloadPNG()" class="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-colors group/dl">
                    <i class="fas fa-file-image text-slate-300 group-hover/dl:text-primary-500 transition-colors mb-2"></i>
                    <span class="text-[10px] font-black uppercase text-slate-500">Download PNG</span>
                 </button>
                 <button (click)="downloadSVG()" class="flex flex-col items-center justify-center p-4 bg-primary-50 hover:bg-primary-100 rounded-3xl transition-colors group/dl">
                    <i class="fas fa-file-code text-primary-300 group-hover/dl:text-primary-600 transition-colors mb-2"></i>
                    <span class="text-[10px] font-black uppercase text-primary-600">Download SVG</span>
                 </button>
              </div>
           </div>

           <!-- Saved Styles Quick Access -->
           <div *ngIf="isLoggedIn()" class="bg-primary-600 p-8 rounded-3xl text-white shadow-md border border-primary-500">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="font-black text-lg flex items-center gap-2">
                    <i class="fas fa-bookmark text-primary-300"></i>
                    Library
                  </h3>
                  <p class="text-[10px] text-primary-200 font-bold uppercase tracking-widest mt-1">Workspace Designs</p>
                </div>
                <button (click)="resetEditor()"
                        class="px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95">
                  New Design
                </button>
              </div>

              @if (templates.length === 0) {
                <div class="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <i class="fas fa-magic text-primary-300/20 text-4xl mb-3"></i>
                  <p class="text-primary-200 text-xs font-bold italic">No saved styles yet.</p>
                </div>
              }

              <div class="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                @for (t of templates; track t.id) {
                  <div class="group relative aspect-[4/3] bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center p-4 text-center cursor-pointer"
                          (click)="applyTemplate(t)"
                          [class.ring-2]="editingTemplateId === t.id"
                          [class.ring-white]="editingTemplateId === t.id">

                     <i class="fas fa-qrcode text-2xl mb-2 opacity-40 group-hover:scale-110 transition-transform"></i>
                     <p class="text-[10px] font-black uppercase tracking-tighter truncate w-full">{{ t.name }}</p>

                     <!-- Action Overlays -->
                     <button (click)="deleteTemplate(t.id, $event)"
                             aria-label="Delete template"
                             class="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-sm">
                        <i class="fas fa-trash-alt text-[8px]"></i>
                     </button>
                  </div>
                }
              </div>
           </div>

           <!-- Guest Library Call to Action -->
           <div *ngIf="!isLoggedIn()" class="bg-slate-900 p-8 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden group">
              <div class="relative z-10">
                <h3 class="font-black text-lg mb-2 flex items-center gap-2">
                  <i class="fas fa-unlock text-primary-400"></i>
                  Save Your Designs
                </h3>
                <p class="text-slate-400 text-xs font-medium leading-relaxed mb-6">Create a free account to save your custom QR templates and apply them to any link with one click.</p>
                <a routerLink="/login" class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-500/20">
                  Sign Up Free <i class="fas fa-arrow-right"></i>
                </a>
              </div>
              <i class="fas fa-magic absolute -bottom-4 -right-4 text-white/5 text-8xl -rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0"></i>
           </div>
        </div>

        <!-- Right: Builder Controls -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Mode Indicator -->
          @if (editingTemplateId) {
            <div class="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fadeIn mb-2">
               <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm">
                     <i class="fas fa-edit"></i>
                  </div>
                  <div>
                     <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Editing Template</p>
                     <p class="text-sm font-black text-emerald-900 mt-1">{{ templateName }}</p>
                  </div>
               </div>
               <button (click)="resetEditor()" class="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Discard Changes</button>
            </div>
          }

          <div class="card bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <!-- Tabs -->
            <div class="flex border-b border-slate-50 p-2 gap-1 bg-slate-50/30">
               @for (tab of tabs; track tab) {
                 <button (click)="activeTab = tab"
                         [class.bg-white]="activeTab === tab"
                         [class.text-primary-600]="activeTab === tab"
                         [class.shadow-sm]="activeTab === tab"
                         class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/60">
                   {{ tab }}
                 </button>
               }
            </div>

            <div class="p-8">
              <!-- Shapes Tab -->
              @if (activeTab === 'Shapes') {
                <div class="space-y-8 animate-fadeIn">
                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dot Style</label>
                     <div class="grid grid-cols-3 gap-3">
                        @for (type of dotTypes; track type) {
                          <button (click)="dotsType = type; render()"
                                  [class.bg-primary-600]="dotsType === type"
                                  [class.text-white]="dotsType === type"
                                  [class.border-primary-600]="dotsType === type"
                                  class="py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all">
                            {{ type }}
                          </button>
                        }
                     </div>
                   </div>

                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Corner Shape</label>
                     <div class="grid grid-cols-3 gap-3">
                        @for (type of cornerSquareTypes; track type) {
                          <button (click)="cornersSquareType = type; render()"
                                  [class.bg-primary-600]="cornersSquareType === type"
                                  [class.text-white]="cornersSquareType === type"
                                  [class.border-primary-600]="cornersSquareType === type"
                                  class="py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all">
                            {{ type }}
                          </button>
                        }
                     </div>
                   </div>

                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Corner Eye</label>
                     <div class="grid grid-cols-2 gap-3">
                        @for (type of cornerDotTypes; track type) {
                          <button (click)="cornersDotType = type; render()"
                                  [class.bg-primary-600]="cornersDotType === type"
                                  [class.text-white]="cornersDotType === type"
                                  [class.border-primary-600]="cornersDotType === type"
                                  class="py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all">
                            {{ type }}
                          </button>
                        }
                     </div>
                   </div>
                </div>
              }

              <!-- Colors Tab -->
              @if (activeTab === 'Colors') {
                <div class="space-y-8 animate-fadeIn">
                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Color Mode</label>
                     <div class="flex p-1 bg-slate-50 rounded-2xl gap-1">
                        <button (click)="colorMode = 'single'; render()"
                                [class.bg-white]="colorMode === 'single'"
                                [class.shadow-sm]="colorMode === 'single'"
                                class="flex-1 py-3 rounded-xl text-sm font-bold transition-all">Single</button>
                        <button (click)="colorMode = 'gradient'; render()"
                                [class.bg-white]="colorMode === 'gradient'"
                                [class.shadow-sm]="colorMode === 'gradient'"
                                class="flex-1 py-3 rounded-xl text-sm font-bold transition-all">Gradient</button>
                     </div>
                   </div>

                   @if (colorMode === 'single') {
                     <div class="space-y-4">
                        <label class="block text-sm font-bold text-slate-700">Brand Color</label>
                        <div class="flex items-center gap-4">
                          <input type="color" [(ngModel)]="selectedColor" (change)="render()"
                                 aria-label="Pick custom color"
                                 class="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" />
                          <div class="flex flex-wrap gap-2">
                            @for (p of colorPresets; track p) {
                              <button (click)="selectedColor = p; render()"
                                      [style.background]="p"
                                      [attr.aria-label]="'Select color ' + p"
                                      class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 active:scale-90 transition-transform"></button>
                            }
                          </div>
                        </div>
                     </div>
                   }

                   @if (colorMode === 'gradient') {
                     <div class="space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                          <div class="space-y-2">
                            <label class="block text-xs font-bold text-slate-500">Start</label>
                            <input type="color" [(ngModel)]="startColor" (change)="render()" aria-label="Gradient start color" class="w-full h-12 rounded-xl border-none cursor-pointer" />
                          </div>
                          <div class="space-y-2">
                            <label class="block text-xs font-bold text-slate-500">End</label>
                            <input type="color" [(ngModel)]="endColor" (change)="render()" aria-label="Gradient end color" class="w-full h-12 rounded-xl border-none cursor-pointer" />
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-bold text-slate-500 mb-3">Direction</label>
                          <div class="grid grid-cols-4 gap-2">
                            @for (d of directions; track d) {
                              <button (click)="gradientDirection = d; render()"
                                      [class.bg-primary-50]="gradientDirection === d"
                                      [class.text-primary-600]="gradientDirection === d"
                                      [class.border-primary-200]="gradientDirection === d"
                                      [attr.aria-selected]="gradientDirection === d"
                                      class="py-2 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all">
                                {{ d }}
                              </button>
                            }
                          </div>
                        </div>
                     </div>
                   }
                </div>
              }

              <!-- Logo Tab -->
              @if (activeTab === 'Logo') {
                <div class="space-y-8 animate-fadeIn">
                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Custom Logo</label>
                     <div class="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl group hover:border-primary-300 transition-colors relative overflow-hidden">
                        <input type="file" (change)="onLogoUpload($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div class="text-center">
                          <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-primary-500 transition-colors">
                            <i class="fas fa-cloud-upload-alt text-xl"></i>
                          </div>
                          <p class="text-xs font-black text-slate-600 uppercase tracking-widest">Upload Image</p>
                          <p class="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG up to 500KB</p>
                        </div>
                     </div>
                   </div>

                   <div>
                     <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Presets</label>
                     <div class="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        @for (logo of logoOptions; track logo.name) {
                          <button (click)="selectedLogo = logo; render()"
                                  [class.ring-2]="selectedLogo.name === logo.name"
                                  [class.ring-primary-500]="selectedLogo.name === logo.name"
                                  class="aspect-square rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2 border border-slate-100 group">
                             @if (logo.src) {
                               <img [src]="logo.src" alt="" class="w-6 h-6 object-contain grayscale group-hover:grayscale-0 transition-all" />
                             } @else {
                               <span class="font-black text-[8px] uppercase text-slate-400">{{ logo.name }}</span>
                             }
                          </button>
                        }
                     </div>
                   </div>

                   <div class="pt-4 border-t border-slate-50 grid grid-cols-2 gap-6">
                      <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Size</label>
                        <input type="range" [(ngModel)]="logoSize" (input)="render()" min="0.1" max="0.5" step="0.05" class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                      </div>
                      <div class="space-y-3">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Margin</label>
                        <input type="range" [(ngModel)]="logoMargin" (input)="render()" min="0" max="20" step="1" class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                      </div>
                   </div>
                </div>
              }

              <!-- Background Tab -->
              @if (activeTab === 'Background') {
                <div class="space-y-8 animate-fadeIn">
                   <div class="space-y-4">
                      <label class="block text-sm font-bold text-slate-700">Background Color</label>
                      <div class="flex items-center gap-4">
                        <input type="color" [(ngModel)]="backgroundColor" (change)="render()"
                               class="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" />
                        <div class="flex flex-wrap gap-2">
                           <button (click)="backgroundColor = '#ffffff'; render()" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 bg-white"></button>
                           <button (click)="backgroundColor = '#000000'; render()" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 bg-black"></button>
                           <button (click)="backgroundColor = '#F8FAFC'; render()" class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 bg-slate-50"></button>
                        </div>
                      </div>
                   </div>

                   <div>
                      <label class="flex items-center gap-3 cursor-pointer">
                        <div class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" [(ngModel)]="hideBackgroundDots" (change)="render()" class="sr-only peer">
                          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">Hide dots behind logo</span>
                      </label>
                   </div>
                </div>
              }

              <!-- Stamper Tab -->
              @if (activeTab === 'Stamper') {
                <div class="space-y-6 animate-fadeIn">
                   <div *ngIf="!isLoggedIn()" class="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <i class="fas fa-link text-2xl"></i>
                      </div>
                      <h4 class="text-slate-900 font-black text-sm mb-2">Connect Your Links</h4>
                      <p class="text-slate-500 text-xs font-medium max-w-[240px] mx-auto mb-6">Login to see your shortened URLs and apply this design to them instantly.</p>
                      <a routerLink="/login" class="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">Sign in to continue</a>
                   </div>

                   <div *ngIf="isLoggedIn()" class="space-y-6">
                      <div class="relative">
                         <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                         <input type="text" [(ngModel)]="linkSearchQuery"
                                placeholder="Search links to brand..."
                                aria-label="Search links"
                                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium" />
                      </div>

                      <div class="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                         @if (filteredLinks.length === 0) {
                           <div class="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm">
                              No matching links found.
                           </div>
                         }
                         @for (link of filteredLinks; track link.id) {
                           <div class="group p-4 bg-white border border-slate-100 hover:border-primary-200 rounded-2xl transition-all flex items-center justify-between shadow-sm hover:shadow-primary-100/50">
                              <div class="min-w-0 pr-4">
                                 <p class="text-xs font-black text-slate-900 truncate">{{ link.title || link.shortCode }}</p>
                                 <p class="text-[10px] font-bold text-slate-400 truncate mt-0.5">innkie.com/{{ link.shortCode }}</p>
                              </div>
                              <button (click)="stampDesign(link)"
                                      class="shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-primary-100 transition-all active:scale-95">
                                 Stamp
                              </button>
                           </div>
                         }
                      </div>
                   </div>
                </div>
              }

              <!-- Save Template Section -->
              <div *ngIf="isLoggedIn()" class="mt-12 pt-8 border-t border-slate-50 space-y-4">
                 <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                      <i class="fas" [class.fa-save]="!editingTemplateId" [class.fa-sync-alt]="editingTemplateId"></i>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900">{{ editingTemplateId ? 'Update Template' : 'Finalize Template' }}</h3>
                 </div>
                 <div class="flex flex-col sm:flex-row gap-3">
                   <input type="text" [(ngModel)]="templateName"
                          placeholder="e.g. Summer Promo 2026"
                          aria-label="Template name"
                          class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" />
                   <button (click)="saveTemplate()"
                           [disabled]="!templateName"
                           class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-100 transition-all active:scale-95">
                     {{ editingTemplateId ? 'Update Design' : 'Save to Library' }}
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Global Confirmation Dialog -->
    <app-confirm-dialog
      *ngIf="showConfirmDialog"
      [title]="confirmTitle"
      [message]="confirmMessage"
      [type]="confirmType"
      [confirmText]="confirmBtnText"
      (confirmed)="onDialogConfirm()"
      (cancelled)="onDialogCancel()"
    ></app-confirm-dialog>

    <!-- SEO Content Section (Public Hub Only) -->
    <div *ngIf="isPublicRoute() && currentTool" class="mt-32 space-y-24">
       <!-- Features/Sections -->
       <section *ngFor="let section of currentTool.sections" class="max-w-4xl mx-auto">
          <div class="text-center mb-12">
             <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">{{ section.title }}</h2>
             <p class="text-slate-500 font-medium leading-relaxed" *ngIf="section.description">
                {{ section.description }}
             </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div *ngFor="let item of section.items" class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                <div class="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center absolute -top-5 left-8 shadow-lg shadow-primary-200">
                  <i [class]="item.icon"></i>
                </div>
                <h4 class="font-black text-slate-900 mb-2 mt-2">{{ item.title }}</h4>
                <p class="text-xs text-slate-400 font-medium leading-relaxed">{{ item.description }}</p>
             </div>
          </div>
       </section>

       <!-- FAQ -->
       <section class="max-w-4xl mx-auto space-y-12 pb-20">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
             <div class="space-y-2" *ngFor="let faq of currentTool.faqs">
                <h4 class="font-black text-slate-800 text-sm">{{ faq.question }}</h4>
                <p class="text-xs text-slate-500 leading-relaxed font-medium">{{ faq.answer }}</p>
             </div>
          </div>
       </section>

       <!-- Related Tools -->
       <app-related-tools 
         [category]="currentTool.category" 
         [excludeId]="currentTool.id">
       </app-related-tools>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  `]
})
export class QrStudioComponent implements OnInit, AfterViewInit {
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLDivElement>;

  private qrStudioService = inject(QrStudioService);
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private seo = inject(SeoService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);

  private qrCode?: QRCodeStyling;

  isLoggedIn = signal(false);
  isPublicRoute = signal(false);
  currentTool: UtilityTool | undefined;
  tabs = ['Shapes', 'Colors', 'Logo', 'Background', 'Stamper'];
  activeTab = 'Shapes';

  // Content State
  qrData = 'https://innkie.com/branded-qr';

  // Config State (Premium)
  dotsType: DotType = 'rounded';
  cornersSquareType: CornerSquareType = 'extra-rounded';
  cornersDotType: CornerDotType = 'dot';
  
  // Legacy/Common properties
  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#4F46E5';
  startColor = '#4F46E5';
  endColor = '#EC4899';
  gradientDirection: Direction = 'diagonal';
  
  backgroundColor = '#ffffff';
  backgroundGradient: QrGradient | null = null;
  
  selectedLogo: any = { name: 'None', src: null };
  logoSize = 0.4;
  logoMargin = 5;
  hideBackgroundDots = true;

  templateName = '';
  editingTemplateId: string | null = null;

  updateSeo() {
    this.isPublicRoute.set(this.router.url.includes('/tools/'));
    const isPublic = this.isPublicRoute();
    
    // Fetch tool from registry for schema mapping
    this.currentTool = TOOL_REGISTRY.find(t => t.id === 'qr-studio');

    const softwareSchema = {
      '@type': 'SoftwareApplication',
      '@id': 'https://innkie.com/tools/qr-studio#app',
      'name': 'iNNkie Branded QR Studio',
      'url': 'https://innkie.com/tools/qr-studio',
      'operatingSystem': 'Any',
      'applicationCategory': 'BusinessApplication',
      'description': 'Design high-resolution, branded QR codes with custom colors, gradients, and logos for professional campaigns.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    };

    const faqSchema = isPublic && this.currentTool ? {
      '@type': 'FAQPage',
      'mainEntity': this.currentTool.faqs.map(f => ({
        '@type': 'Question',
        'name': f.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.answer
        }
      }))
    } : null;

    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'QR Studio', url: '/tools/qr-studio' }
    ]);

    const schema: any[] = [breadcrumbs];
    if (isPublic) schema.push(softwareSchema);
    if (faqSchema) schema.push(faqSchema);

    this.seo.updateSeo(
      'Branded QR Studio',
      'Design high-resolution, branded QR codes for your business. Customize colors, shapes, and add your logo with our professional QR Studio.',
      isPublic ? '/tools/qr-studio' : '/qr-studio',
      'assets/preview.png',
      isPublic ? schema : null,
      !isPublic // noindex if it's the dashboard version
    );
  }

  templates: QrTemplate[] = [];
  workspaceLinks: ShortUrl[] = [];
  linkSearchQuery = '';

  // Confirmation Dialog State
  showConfirmDialog = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'info' | 'warning' = 'info';
  confirmBtnText = 'Confirm';
  onConfirmCallback: (() => void) | null = null;

  // Options for UI
  dotTypes: DotType[] = ['rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'];
  cornerSquareTypes: CornerSquareType[] = ['dot', 'square', 'extra-rounded'];
  cornerDotTypes: CornerDotType[] = ['dot', 'square'];

  colorPresets = ['#000000', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
  logoOptions = [
    { name: 'None', src: null },
    { name: 'X', src: 'assets/logos/x.png' },
    { name: 'YT', src: 'assets/logos/youtube.png' },
    { name: 'IG', src: 'assets/logos/instagram.png' },
    { name: 'FB', src: 'assets/logos/facebook.png' },
    { name: 'GH', src: 'assets/logos/github.png' }
  ];
  directions: Direction[] = ['diagonal', 'horizontal', 'vertical', 'radial'];

  ngOnInit() {
    this.updateSeo();
    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        this.qrData = params['data'];
        this.render();
      }
    });

    this.authService.user$.subscribe(user => {
      this.isLoggedIn.set(!!user);
      if (user) {
        this.loadTemplates();
        this.loadLinks();
      } else {
        this.templates = [];
        this.workspaceLinks = [];
      }
    });
  }

  openConfirm(title: string, message: string, type: 'danger' | 'info' | 'warning', btnText: string, callback: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmType = type;
    this.confirmBtnText = btnText;
    this.onConfirmCallback = callback;
    this.showConfirmDialog = true;
  }

  onDialogConfirm() {
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    }
    this.showConfirmDialog = false;
  }

  onDialogCancel() {
    this.showConfirmDialog = false;
    this.onConfirmCallback = null;
  }

  async loadLinks() {
    const user = this.authService.currentUser as AppUser | null;
    if (!user) return;
    const activeWs = this.workspaceService.activeWorkspace;
    this.workspaceLinks = await this.shortUrlService.getUserShortUrls(user.uid, activeWs?.id);
  }

  get filteredLinks() {
    if (!this.linkSearchQuery) return this.workspaceLinks;
    const q = this.linkSearchQuery.toLowerCase();
    return this.workspaceLinks.filter(l =>
      l.shortCode.toLowerCase().includes(q) ||
      (l.title && l.title.toLowerCase().includes(q)) ||
      l.originalUrl.toLowerCase().includes(q)
    );
  }

  async stampDesign(link: ShortUrl) {
    this.openConfirm(
      'Apply Design',
      `Apply this custom QR design to "${link.title || link.shortCode}"?`,
      'info',
      'Apply Style',
      async () => {
        const config: QrConfig = this.getCurrentConfig();

        try {
          await this.shortUrlService.updateShortUrl(link.shortCode, {
            ...link,
            qrConfig: config
          });
          this.toast.success('Design applied to link!');
        } catch (e) {
          this.toast.error('Failed to apply design');
        }
      }
    );
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.qrCode = new QRCodeStyling(this.getQrOptions());
      this.qrCode.append(this.qrCanvas.nativeElement);
      await this.render();
    }
  }

  async loadTemplates() {
    this.templates = await this.qrStudioService.getTemplates();
  }

  downloadPNG() {
    if (!this.qrCode) return;
    this.qrCode.download({ name: `branded-qr-${this.templateName || 'design'}`, extension: 'png' });
  }

  downloadSVG() {
    if (!this.qrCode) return;
    this.qrCode.download({ name: `branded-qr-${this.templateName || 'design'}`, extension: 'svg' });
  }

  applyTemplate(t: QrTemplate) {
    this.editingTemplateId = t.id;
    this.templateName = t.name;
    const c = t.config;
    
    // Premium props
    this.dotsType = c.dotsOptions?.type || 'rounded';
    this.cornersSquareType = c.cornersSquareOptions?.type || 'extra-rounded';
    this.cornersDotType = c.cornersDotOptions?.type || 'dot';
    
    // Colors
    if (c.dotsOptions?.gradient) {
      this.colorMode = 'gradient';
      this.startColor = c.dotsOptions.gradient.colorStops[0].color;
      this.endColor = c.dotsOptions.gradient.colorStops[1].color;
    } else {
      this.colorMode = 'single';
      this.selectedColor = c.dotsOptions?.color || c.selectedColor || '#4F46E5';
    }

    this.backgroundColor = c.backgroundOptions?.color || '#ffffff';
    
    // Logo
    this.selectedLogo = { 
      name: c.logoName || 'Custom', 
      src: c.logoSrc || (this.logoOptions.find(l => l.name === c.logoName)?.src) 
    };
    this.logoSize = c.imageOptions?.imageSize || 0.4;
    this.logoMargin = c.imageOptions?.margin || 5;
    this.hideBackgroundDots = c.imageOptions?.hideBackgroundDots ?? true;

    this.render();
  }

  async deleteTemplate(id: string, event: Event) {
    event.stopPropagation();

    this.openConfirm(
      'Delete Template',
      'Are you sure you want to delete this QR design template? This cannot be undone.',
      'danger',
      'Delete Template',
      async () => {
        try {
          await this.qrStudioService.deleteTemplate(id);
          if (this.editingTemplateId === id) {
            this.resetEditor();
          }
          await this.loadTemplates();
        } catch (e) {
          this.toast.error('Failed to delete template');
        }
      }
    );
  }

  resetEditor() {
    this.editingTemplateId = null;
    this.templateName = '';
    this.dotsType = 'rounded';
    this.cornersSquareType = 'extra-rounded';
    this.cornersDotType = 'dot';
    this.colorMode = 'single';
    this.selectedColor = '#4F46E5';
    this.backgroundColor = '#ffffff';
    this.selectedLogo = this.logoOptions[0];
    this.render();
  }

  private getCurrentConfig(): QrConfig {
    const dotsGradient: QrGradient | undefined = this.colorMode === 'gradient' ? {
      type: 'linear',
      rotation: this.gradientDirection === 'vertical' ? 1.57 : (this.gradientDirection === 'horizontal' ? 0 : 0.78),
      colorStops: [{ offset: 0, color: this.startColor }, { offset: 1, color: this.endColor }]
    } : undefined;

    return {
      dotsOptions: {
        type: this.dotsType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      cornersSquareOptions: {
        type: this.cornersSquareType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      cornersDotOptions: {
        type: this.cornersDotType,
        color: this.colorMode === 'single' ? this.selectedColor : undefined,
        gradient: dotsGradient
      },
      backgroundOptions: {
        color: this.backgroundColor
      },
      imageOptions: {
        hideBackgroundDots: this.hideBackgroundDots,
        imageSize: this.logoSize,
        margin: this.logoMargin,
        crossOrigin: 'anonymous'
      },
      logoName: this.selectedLogo.name,
      logoSrc: this.selectedLogo.src,
      // Keep legacy for fallback
      colorMode: this.colorMode,
      selectedColor: this.selectedColor,
      startColor: this.startColor,
      endColor: this.endColor,
      gradientDirection: this.gradientDirection
    };
  }

  async saveTemplate() {
    if (!this.templateName.trim()) {
      this.toast.error('Please enter a template name');
      return;
    }

    const config = this.getCurrentConfig();
    const isEditing = !!this.editingTemplateId;
    const oldTemplates = [...this.templates];
    
    // Create optimistic template
    const optimisticTemplate: QrTemplate = {
      id: this.editingTemplateId || `temp_${Date.now()}`,
      name: this.templateName,
      config,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any
    };

    if (isEditing) {
      this.templates = this.templates.map(t => t.id === this.editingTemplateId ? optimisticTemplate : t);
    } else {
      this.templates = [optimisticTemplate, ...this.templates];
    }

    const name = this.templateName;
    const editId = this.editingTemplateId;
    this.resetEditor();

    try {
      if (isEditing) {
        await this.qrStudioService.updateTemplate(editId!, name, config);
        this.toast.success('Template updated!');
      } else {
        await this.qrStudioService.saveTemplate(name, config);
        this.toast.success('Template saved!');
      }
      await this.loadTemplates();
    } catch (e) {
      this.templates = oldTemplates;
      this.toast.error('Failed to save template');
    }
  }

  private getQrOptions(): Options {
    const config = this.getCurrentConfig();
    return {
      width: 300,
      height: 300,
      type: 'svg',
      data: this.qrData,
      image: config.logoSrc || undefined,
      dotsOptions: config.dotsOptions,
      cornersSquareOptions: config.cornersSquareOptions,
      cornersDotOptions: config.cornersDotOptions,
      backgroundOptions: config.backgroundOptions,
      imageOptions: config.imageOptions,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H'
      }
    };
  }

  async render() {
    if (!this.qrCode || !isPlatformBrowser(this.platformId)) return;
    this.qrCode.update(this.getQrOptions());
  }

  async onLogoUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      this.toast.error('Logo must be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedLogo = {
        name: 'Custom Upload',
        src: e.target.result
      };
      this.render();
    };
    reader.readAsDataURL(file);
  }

  handleFaviconError(event: any) {
    safeHandleFaviconError(event);
  }
}
