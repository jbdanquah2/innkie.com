import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QrStudioService } from '../../shared/services/qr-studio.service';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { QrConfig, QrTemplate, ShortUrl, AppUser } from '@innkie/shared-models';
import * as QRCode from 'qrcode';

type Direction = 'diagonal' | 'horizontal' | 'vertical' | 'radial';
type FrameOption = 'None' | 'Basic' | 'Rounded' | 'Bold' | 'Minimal';

@Component({
  selector: 'app-qr-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">QR Studio</h1>
          <p class="text-slate-500 font-medium mt-1">Design your brand's unique QR style.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Live Preview (Sticky) -->
        <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
           <div class="card p-10 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2.5rem] flex flex-col items-center gap-6 relative overflow-hidden group">
              <!-- Decorative element -->
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="relative">
                <canvas #qrCanvas class="rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105"></canvas>
              </div>

              <div class="text-center space-y-1">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Brand Preview</p>
                <p class="text-sm font-bold text-slate-600">Apply this style to any link</p>
              </div>

              <!-- Export Actions -->
              <div class="w-full grid grid-cols-2 gap-3 mt-4 pt-6 border-t border-slate-50">
                 <button (click)="downloadPNG()" class="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all group/dl">
                    <i class="fas fa-file-image text-slate-300 group-hover/dl:text-indigo-500 transition-colors mb-2"></i>
                    <span class="text-[10px] font-black uppercase text-slate-500">Download PNG</span>
                 </button>
                 <button (click)="downloadSVG()" class="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-3xl transition-all group/dl">
                    <i class="fas fa-file-code text-indigo-300 group-hover/dl:text-indigo-600 transition-colors mb-2"></i>
                    <span class="text-[10px] font-black uppercase text-indigo-600">Download SVG</span>
                 </button>
              </div>
           </div>

           <!-- Saved Styles Quick Access -->
           <div class="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="font-black text-lg flex items-center gap-2">
                    <i class="fas fa-bookmark text-indigo-300"></i>
                    Library
                  </h3>
                  <p class="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">Workspace Designs</p>
                </div>
                <button (click)="resetEditor()" 
                        class="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                  New Design
                </button>
              </div>
              
              <div *ngIf="templates.length === 0" class="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <i class="fas fa-magic text-indigo-300/20 text-4xl mb-3"></i>
                <p class="text-indigo-200 text-xs font-bold italic">No saved styles yet.</p>
              </div>

              <div class="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div *ngFor="let t of templates" 
                        class="group relative aspect-[4/3] bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center p-4 text-center cursor-pointer"
                        (click)="applyTemplate(t)"
                        [class.ring-2]="editingTemplateId === t.id"
                        [class.ring-white]="editingTemplateId === t.id">
                   
                   <i class="fas fa-qrcode text-2xl mb-2 opacity-40 group-hover:scale-110 transition-transform"></i>
                   <p class="text-[10px] font-black uppercase tracking-tighter truncate w-full">{{ t.name }}</p>
                   
                   <!-- Action Overlays -->
                   <button (click)="deleteTemplate(t.id, $event)" 
                           class="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg">
                      <i class="fas fa-trash-alt text-[8px]"></i>
                   </button>
                </div>
              </div>
           </div>
        </div>

        <!-- Right: Builder Controls -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Mode Indicator -->
          <div *ngIf="editingTemplateId" class="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fadeIn mb-2">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-lg shadow-emerald-200">
                   <i class="fas fa-edit"></i>
                </div>
                <div>
                   <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Editing Template</p>
                   <p class="text-sm font-black text-emerald-900 mt-1">{{ templateName }}</p>
                </div>
             </div>
             <button (click)="resetEditor()" class="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Discard Changes</button>
          </div>

          <div class="card bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
            <!-- Tabs -->
            <div class="flex border-b border-slate-50 p-2 gap-1 bg-slate-50/30">
               <button *ngFor="let tab of tabs" 
                       (click)="activeTab = tab"
                       [class.bg-white]="activeTab === tab"
                       [class.text-indigo-600]="activeTab === tab"
                       [class.shadow-sm]="activeTab === tab"
                       class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/60">
                 {{ tab }}
               </button>
            </div>

            <div class="p-8">
              <!-- Colors Tab -->
              <div *ngIf="activeTab === 'Colors'" class="space-y-8 animate-fadeIn">
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

                 <div *ngIf="colorMode === 'single'" class="space-y-4">
                    <label class="block text-sm font-bold text-slate-700">Brand Color</label>
                    <div class="flex items-center gap-4">
                      <input type="color" [(ngModel)]="selectedColor" (change)="render()" 
                             class="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" />
                      <div class="flex flex-wrap gap-2">
                        <button *ngFor="let p of colorPresets" 
                                (click)="selectedColor = p; render()"
                                [style.background]="p"
                                class="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 active:scale-90 transition-transform"></button>
                      </div>
                    </div>
                 </div>

                 <div *ngIf="colorMode === 'gradient'" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                      <div class="space-y-2">
                        <label class="block text-xs font-bold text-slate-500">Start</label>
                        <input type="color" [(ngModel)]="startColor" (change)="render()" class="w-full h-12 rounded-xl border-none cursor-pointer" />
                      </div>
                      <div class="space-y-2">
                        <label class="block text-xs font-bold text-slate-500">End</label>
                        <input type="color" [(ngModel)]="endColor" (change)="render()" class="w-full h-12 rounded-xl border-none cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-500 mb-3">Direction</label>
                      <div class="grid grid-cols-4 gap-2">
                        <button *ngFor="let d of directions" 
                                (click)="gradientDirection = d; render()"
                                [class.bg-indigo-50]="gradientDirection === d"
                                [class.text-indigo-600]="gradientDirection === d"
                                [class.border-indigo-200]="gradientDirection === d"
                                class="py-2 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all">
                          {{ d }}
                        </button>
                      </div>
                    </div>
                 </div>
              </div>

              <!-- Logo Tab -->
              <div *ngIf="activeTab === 'Logo'" class="space-y-8 animate-fadeIn">
                 <div class="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    <button *ngFor="let logo of logoOptions" 
                            (click)="selectedLogo = logo; render()"
                            [class.ring-2]="selectedLogo === logo"
                            [class.ring-indigo-500]="selectedLogo === logo"
                            class="aspect-square rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-2 border border-slate-100 group">
                       <img *ngIf="logo.src" [src]="logo.src" class="w-8 h-8 object-contain grayscale group-hover:grayscale-0 transition-all" />
                       <span *ngIf="!logo.src" class="font-black text-[10px] uppercase text-slate-400">{{ logo.name }}</span>
                       <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">{{ logo.name }}</span>
                    </button>
                 </div>
              </div>

              <!-- Frame Tab -->
              <div *ngIf="activeTab === 'Frame'" class="space-y-8 animate-fadeIn">
                 <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <button *ngFor="let f of frames" 
                            (click)="selectedFrame = f; render()"
                            [class.bg-indigo-600]="selectedFrame === f"
                            [class.text-white]="selectedFrame === f"
                            class="py-4 border border-slate-100 rounded-2xl text-xs font-bold transition-all shadow-sm">
                      {{ f }}
                    </button>
                 </div>
              </div>

              <!-- Stamper Tab -->
              <div *ngIf="activeTab === 'Stamper'" class="space-y-6 animate-fadeIn">
                 <div class="relative">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" [(ngModel)]="linkSearchQuery" 
                           placeholder="Search links to brand..."
                           class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                 </div>

                 <div class="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <div *ngIf="filteredLinks.length === 0" class="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm">
                       No matching links found.
                    </div>
                    <div *ngFor="let link of filteredLinks" 
                         class="group p-4 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl transition-all flex items-center justify-between shadow-sm hover:shadow-indigo-100/50">
                       <div class="min-w-0 pr-4">
                          <p class="text-xs font-black text-slate-900 truncate">{{ link.title || link.shortCode }}</p>
                          <p class="text-[10px] font-bold text-slate-400 truncate mt-0.5">innk.ie/{{ link.shortCode }}</p>
                       </div>
                       <button (click)="stampDesign(link)" 
                               class="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
                          Stamp
                       </button>
                    </div>
                 </div>
              </div>

              <!-- Save Template Section -->
              <div class="mt-12 pt-8 border-t border-slate-50 space-y-4">
                 <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                      <i class="fas" [class.fa-save]="!editingTemplateId" [class.fa-sync-alt]="editingTemplateId"></i>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900">{{ editingTemplateId ? 'Update Template' : 'Finalize Template' }}</h3>
                 </div>
                 <div class="flex flex-col sm:flex-row gap-3">
                   <input type="text" [(ngModel)]="templateName"
                          placeholder="e.g. Summer Promo 2026"
                          class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" />
                   <button (click)="saveTemplate()" 
                           [disabled]="!templateName"
                           class="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95">
                     {{ editingTemplateId ? 'Update Design' : 'Save to Library' }}
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  `]
})
export class QrStudioComponent implements OnInit, AfterViewInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private qrStudioService = inject(QrStudioService);
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);

  tabs = ['Colors', 'Logo', 'Frame', 'Stamper'];
  activeTab = 'Colors';

  // Config State
  colorMode: 'single' | 'gradient' = 'single';
  selectedColor = '#4F46E5';
  startColor = '#4F46E5';
  endColor = '#EC4899';
  gradientDirection: Direction = 'diagonal';
  selectedFrame: FrameOption = 'None';
  selectedLogo: any = { name: 'None', src: null };
  templateName = '';
  editingTemplateId: string | null = null;

  templates: QrTemplate[] = [];
  workspaceLinks: ShortUrl[] = [];
  linkSearchQuery = '';

  colorPresets = ['#000000', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
  logoOptions = [
    { name: 'None', src: null },
    { name: 'X', src: 'assets/logos/x.png' },
    { name: 'YT', src: 'assets/logos/youtube.png' },
    { name: 'IG', src: 'assets/logos/instagram.png' },
    { name: 'FB', src: 'assets/logos/facebook.png' },
    { name: 'GH', src: 'assets/logos/github.png' }
  ];
  frames: FrameOption[] = ['None', 'Basic', 'Rounded', 'Bold', 'Minimal'];
  directions: Direction[] = ['diagonal', 'horizontal', 'vertical', 'radial'];

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(() => {
      this.loadTemplates();
      this.loadLinks();
    });
  }

  async loadLinks() {
    const user = this.authService.currentUser as AppUser | null;
    if (!user) return;
    const all = await this.shortUrlService.getUserShortUrls(user.uid);
    const activeWs = this.workspaceService.activeWorkspace;
    this.workspaceLinks = all.filter((l: ShortUrl) => {
       if (activeWs) return l.workspaceId === activeWs.id;
       return !l.workspaceId || l.workspaceId === 'personal';
    });
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
    if (!confirm(`Apply this design to "${link.title || link.shortCode}"?`)) return;
    
    const config: QrConfig = {
      colorMode: this.colorMode,
      selectedColor: this.selectedColor,
      startColor: this.startColor,
      endColor: this.endColor,
      gradientDirection: this.gradientDirection,
      logoName: this.selectedLogo.name,
      logoSrc: this.selectedLogo.src,
      frameName: this.selectedFrame
    };

    try {
      await this.shortUrlService.updateShortUrl(link.shortCode, {
        ...link,
        qrConfig: config
      });
      alert('Design applied to link!');
    } catch (e) {
      alert('Failed to apply design');
    }
  }

  async ngAfterViewInit() {
    await this.render();
  }

  async loadTemplates() {
    this.templates = await this.qrStudioService.getTemplates();
  }

  downloadPNG() {
    const canvas = this.qrCanvas.nativeElement;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `branded-qr-${this.templateName || 'design'}.png`;
    link.click();
  }

  async downloadSVG() {
    try {
      const content = "https://innkie.com/branded-qr";
      
      // 1. Generate base QR SVG string
      const qrSvg = await QRCode.toString(content, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });

      const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `branded-qr-${this.templateName || 'design'}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('SVG export failed', e);
    }
  }

  applyTemplate(t: QrTemplate) {
    this.editingTemplateId = t.id;
    this.templateName = t.name;
    const c = t.config;
    this.colorMode = c.colorMode;
    this.selectedColor = c.selectedColor || '#4F46E5';
    this.startColor = c.startColor || '#4F46E5';
    this.endColor = c.endColor || '#EC4899';
    this.gradientDirection = c.gradientDirection || 'diagonal';
    this.selectedFrame = (c.frameName as FrameOption) || 'None';
    this.selectedLogo = this.logoOptions.find(l => l.name === c.logoName) || this.logoOptions[0];
    this.render();
  }

  async deleteTemplate(id: string, event: Event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await this.qrStudioService.deleteTemplate(id);
      if (this.editingTemplateId === id) {
        this.resetEditor();
      }
      await this.loadTemplates();
    } catch (e) {
      alert('Failed to delete template');
    }
  }

  resetEditor() {
    this.editingTemplateId = null;
    this.templateName = '';
    this.colorMode = 'single';
    this.selectedColor = '#4F46E5';
    this.selectedFrame = 'None';
    this.selectedLogo = this.logoOptions[0];
    this.render();
  }

  async saveTemplate() {
    const config: QrConfig = {
      colorMode: this.colorMode,
      selectedColor: this.selectedColor,
      startColor: this.startColor,
      endColor: this.endColor,
      gradientDirection: this.gradientDirection,
      logoName: this.selectedLogo.name,
      logoSrc: this.selectedLogo.src,
      frameName: this.selectedFrame
    };

    try {
      if (this.editingTemplateId) {
        await this.qrStudioService.updateTemplate(this.editingTemplateId, this.templateName, config);
        alert('Template updated!');
      } else {
        await this.qrStudioService.saveTemplate(this.templateName, config);
        alert('Template saved!');
      }
      this.resetEditor();
      await this.loadTemplates();
    } catch (e) {
      alert('Failed to save template');
    }
  }

  async render() {
    if (!this.qrCanvas) return;
    const canvas = this.qrCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    try {
      // Use a placeholder for the studio
      const content = "https://innkie.com/branded-qr";
      
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, content, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: size,
        color: { dark: '#000000', light: '#0000' }
      });

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(tempCanvas, 0, 0, size, size);

      // Color/Gradient
      ctx.globalCompositeOperation = 'source-in';
      let fillStyle: any;
      if (this.colorMode === 'single') {
        fillStyle = this.selectedColor;
      } else {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, this.startColor);
        gradient.addColorStop(1, this.endColor);
        fillStyle = gradient;
      }
      ctx.fillStyle = fillStyle;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over';

      // Frame
      ctx.lineWidth = 4;
      ctx.strokeStyle = fillStyle;
      if (this.selectedFrame === 'Basic') ctx.strokeRect(8, 8, size-16, size-16);
      if (this.selectedFrame === 'Rounded') {
        ctx.beginPath();
        ctx.roundRect(8, 8, size-16, size-16, 20);
        ctx.stroke();
      }
      if (this.selectedFrame === 'Bold') {
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, size-20, size-20);
      }
      if (this.selectedFrame === 'Minimal') {
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(8, 8, size-16, size-16);
        ctx.setLineDash([]);
      }

      // Logo Placeholder
      if (this.selectedLogo && this.selectedLogo.src) {
        const logoSize = size * 0.22;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect((size - logoSize)/2 - 5, (size - logoSize)/2 - 5, logoSize + 10, logoSize + 10, 10);
        ctx.fill();
        
        const img = new Image();
        img.src = this.selectedLogo.src;
        img.onload = () => {
           ctx.drawImage(img, (size - logoSize)/2, (size - logoSize)/2, logoSize, logoSize);
        };
      }

    } catch (e) { console.error(e); }
  }
}
