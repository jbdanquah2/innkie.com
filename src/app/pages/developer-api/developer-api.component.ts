import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { Workspace } from '@innkie/shared-models';

@Component({
  selector: 'app-developer-api',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Developer Studio</h1>
        <p class="text-slate-500 font-medium mt-1">Integrate iNNkie directly into your applications.</p>
      </div>

      <!-- Active Workspace Warning -->
      <div *ngIf="!activeWorkspace" class="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4 text-amber-800">
        <i class="fas fa-exclamation-triangle text-2xl"></i>
        <div>
          <p class="font-bold">No active workspace selected</p>
          <p class="text-sm">Please select a workspace from the sidebar to manage API keys.</p>
        </div>
      </div>

      <div *ngIf="activeWorkspace" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- API Key Management -->
        <div class="lg:col-span-2 space-y-6">
          <section class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div class="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                  <i class="fas fa-key"></i>
                </div>
                <h2 class="text-xl font-bold">Workspace API Key</h2>
              </div>
              <span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {{ activeWorkspace.name }}
              </span>
            </div>

            <div class="p-8 space-y-6">
              <p class="text-sm text-slate-600 font-medium leading-relaxed">
                Use this key to authenticate requests to the iNNkie API. Remember to keep it secure and never expose it in client-side code or public repositories.
              </p>

              <div class="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative group overflow-hidden">
                <div class="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex items-center justify-between gap-4 relative z-10">
                  <div class="flex-1">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-indigo-300/50">Production API Token</label>
                    <div class="font-mono text-sm text-indigo-400 break-all select-all">
                      {{ showApiKey ? (activeWorkspace.apiKey || 'No API key generated yet') : '••••••••••••••••••••••••••••••••••••••••' }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="showApiKey = !showApiKey" 
                            class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                            [title]="showApiKey ? 'Hide' : 'Show'">
                      <i class="fas" [class.fa-eye]="!showApiKey" [class.fa-eye-slash]="showApiKey"></i>
                    </button>
                    <button (click)="copyKey()" 
                            [disabled]="!activeWorkspace.apiKey"
                            class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-20"
                            title="Copy to clipboard">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div class="flex items-center gap-3 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
                  <i class="fas fa-sync-alt animate-spin-slow"></i>
                  <span>Rotating will immediately invalidate the current key.</span>
                </div>
                <button (click)="rotateKey()" 
                        [disabled]="isRotating"
                        class="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-sm shadow-sm active:scale-95">
                  {{ isRotating ? 'Rotating Key...' : 'Rotate Key' }}
                </button>
              </div>
            </div>
          </section>

          <!-- Documentation Preview -->
          <section class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div class="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg">
                <i class="fas fa-terminal"></i>
              </div>
              <h2 class="text-xl font-bold text-slate-800">API Documentation</h2>
            </div>
            <div class="p-8">
               <div class="space-y-6">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase">POST</span>
                      Shorten a Link
                    </h3>
                    <div class="bg-slate-50 p-4 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100">
                      https://api.innkie.com/api/v1/links
                    </div>
                  </div>
                  <button class="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors flex items-center gap-2">
                    View Full API Reference
                    <i class="fas fa-external-link-alt text-xs"></i>
                  </button>
               </div>
            </div>
          </section>
        </div>

        <!-- Sidebar / Info -->
        <div class="space-y-6">
           <div class="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <h3 class="text-lg font-black mb-4 tracking-tight">Need Help?</h3>
              <p class="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
                Our developer portal contains SDKs for Node.js, Python, and Go to help you get started faster.
              </p>
              <div class="space-y-3">
                <a href="#" class="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all group">
                   <span class="text-xs font-bold">Webhooks Guide</span>
                   <i class="fas fa-chevron-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                </a>
                <a href="#" class="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all group">
                   <span class="text-xs font-bold">Rate Limits</span>
                   <i class="fas fa-chevron-right text-[10px] transition-transform group-hover:translate-x-1"></i>
                </a>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin-slow { animation: spin 3s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class DeveloperApiComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);

  activeWorkspace: Workspace | null = null;
  showApiKey = false;
  isRotating = false;

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(ws => {
      this.activeWorkspace = ws;
    });
  }

  async rotateKey() {
    if (!this.activeWorkspace) return;
    if (!confirm('Are you sure you want to rotate the API key? Existing integrations will stop working until updated.')) return;
    
    this.isRotating = true;
    try {
      await this.workspaceService.rotateApiKey(this.activeWorkspace.id);
      alert('API Key rotated successfully.');
    } catch (error) {
      alert('Failed to rotate API Key.');
    } finally {
      this.isRotating = false;
    }
  }

  copyKey() {
    if (this.activeWorkspace?.apiKey) {
      navigator.clipboard.writeText(this.activeWorkspace.apiKey);
      alert('Copied to clipboard!');
    }
  }
}
