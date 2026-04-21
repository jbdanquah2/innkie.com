import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { WebhookService } from '../../shared/services/webhook.service';
import { Workspace, Webhook, WebhookEvent } from '@innkie/shared-models';

@Component({
  selector: 'app-developer-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-12 animate-fadeIn pb-20">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight text-center sm:text-left">Developer Studio</h1>
        <p class="text-slate-500 font-medium mt-1 text-center sm:text-left">Build and scale with the iNNkie infrastructure.</p>
      </div>

      <!-- Active Workspace Warning -->
      <div *ngIf="!activeWorkspace" class="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 text-amber-800 shadow-sm">
        <i class="fas fa-exclamation-triangle text-2xl"></i>
        <div>
          <p class="font-bold tracking-tight">No active workspace selected</p>
          <p class="text-sm font-medium opacity-80">Please select a workspace from the sidebar to manage API keys and webhooks.</p>
        </div>
      </div>

      <div *ngIf="activeWorkspace" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Main Content -->
        <div class="lg:col-span-8 space-y-10">
          
          <!-- API Key Section -->
          <section class="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div class="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                  <i class="fas fa-key"></i>
                </div>
                <h2 class="text-xl font-bold tracking-tight">Authentication</h2>
              </div>
              <span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {{ activeWorkspace.name }}
              </span>
            </div>

            <div class="p-8 space-y-6">
              <p class="text-sm text-slate-500 font-medium leading-relaxed">
                Use this secret key to authenticate your server-side requests. Keep it hidden to prevent unauthorized usage.
              </p>

              <div class="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative group overflow-hidden shadow-inner">
                <div class="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex items-center justify-between gap-4 relative z-10">
                  <div class="flex-1">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-indigo-300/50">Production API Token</label>
                    <div class="font-mono text-sm text-indigo-400 break-all select-all leading-none">
                      {{ showApiKey ? (activeWorkspace.apiKey || 'No API key generated yet') : '••••••••••••••••••••••••••••••••••••••••' }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="showApiKey = !showApiKey" 
                            class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                            [title]="showApiKey ? 'Hide' : 'Show'">
                      <i class="fas" [class.fa-eye]="!showApiKey" [class.fa-eye-slash]="showApiKey"></i>
                    </button>
                    <button (click)="copyKey(activeWorkspace.apiKey || '')" 
                            [disabled]="!activeWorkspace.apiKey"
                            class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-20"
                            title="Copy to clipboard">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div class="flex items-center gap-3 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
                  <i class="fas fa-sync-alt animate-spin-slow opacity-50"></i>
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

          <!-- Webhooks Section -->
          <section class="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div class="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                  <i class="fas fa-bolt"></i>
                </div>
                <h2 class="text-xl font-bold tracking-tight">Webhooks</h2>
              </div>
              <button (click)="showNewWebhook = true" 
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95">
                Add Endpoint
              </button>
            </div>

            <div class="p-8">
               <p class="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                 Receive real-time HTTP POST notifications whenever events happen in your workspace.
               </p>

               <!-- New Webhook Form -->
               <div *ngIf="showNewWebhook" class="mb-10 p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6 animate-fadeIn">
                  <div class="flex items-center justify-between mb-2">
                     <h3 class="font-black text-sm text-slate-800 uppercase tracking-widest">New Integration</h3>
                     <button (click)="showNewWebhook = false" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Name</label>
                      <input type="text" [(ngModel)]="newWebhook.name" placeholder="My Slack Bot"
                             class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endpoint URL</label>
                      <input type="text" [(ngModel)]="newWebhook.url" placeholder="https://api.myapp.com/webhooks"
                             class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium transition-all" />
                    </div>
                  </div>

                  <div>
                     <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Events to Send</label>
                     <div class="flex flex-wrap gap-2">
                        <button *ngFor="let ev of availableEvents" 
                                (click)="toggleEvent(ev)"
                                [class.bg-indigo-600]="newWebhook.events.includes(ev)"
                                [class.text-white]="newWebhook.events.includes(ev)"
                                [class.bg-white]="!newWebhook.events.includes(ev)"
                                [class.text-slate-600]="!newWebhook.events.includes(ev)"
                                class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all">
                           {{ ev }}
                        </button>
                     </div>
                  </div>

                  <div class="pt-4 flex justify-end">
                     <button (click)="createWebhook()" 
                             [disabled]="!newWebhook.url || !newWebhook.name || newWebhook.events.length === 0"
                             class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-100 transition-all disabled:opacity-30 active:scale-95">
                        Enable Integration
                     </button>
                  </div>
               </div>

               <!-- Webhook List -->
               <div class="space-y-4">
                  <div *ngIf="webhooks.length === 0" class="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                     <i class="fas fa-plug text-slate-100 text-5xl mb-4"></i>
                     <p class="text-slate-400 text-sm font-bold italic">No active webhooks.</p>
                  </div>

                  <div *ngFor="let wh of webhooks" 
                       class="group p-6 bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                     <div class="min-w-0 flex-1 space-y-2">
                        <div class="flex items-center gap-3">
                           <h4 class="font-black text-slate-900 tracking-tight">{{ wh.name }}</h4>
                           <span *ngIf="wh.isActive" class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        </div>
                        <p class="text-xs font-mono text-slate-400 truncate">{{ wh.url }}</p>
                        <div class="flex flex-wrap gap-1.5 pt-1">
                           <span *ngFor="let ev of wh.events" class="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100">
                             {{ ev }}
                           </span>
                        </div>
                     </div>

                     <div class="flex items-center gap-3 self-end md:self-center">
                        <div class="text-right mr-4 hidden sm:block">
                           <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Triggered</p>
                           <p class="text-[10px] font-bold text-slate-600">{{ wh.lastTriggeredAt ? ($any(wh.lastTriggeredAt) | date:'shortTime') : 'Never' }}</p>
                        </div>
                        <button (click)="toggleWebhook(wh)" 
                                [class.text-emerald-500]="wh.isActive"
                                [class.text-slate-300]="!wh.isActive"
                                class="p-3 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-inner">
                           <i class="fas" [class.fa-toggle-on]="wh.isActive" [class.fa-toggle-off]="!wh.isActive"></i>
                        </button>
                        <button (click)="deleteWebhook(wh.id)" 
                                class="p-3 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-2xl transition-all">
                           <i class="fas fa-trash-alt"></i>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </section>
        </div>

        <!-- Sidebar / Docs -->
        <div class="lg:col-span-4 space-y-6">
           <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <h3 class="text-lg font-black mb-4 tracking-tight">Need Help?</h3>
              <p class="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Learn how to verify signatures and secure your webhook endpoints in our guide.
              </p>
              <div class="space-y-3">
                <a href="#" class="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                   <span class="text-xs font-black uppercase tracking-widest">Webhooks SDK</span>
                   <i class="fas fa-external-link-alt text-[10px] opacity-40 group-hover:opacity-100"></i>
                </a>
                <a href="#" class="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                   <span class="text-xs font-black uppercase tracking-widest">Signing Payloads</span>
                   <i class="fas fa-external-link-alt text-[10px] opacity-40 group-hover:opacity-100"></i>
                </a>
              </div>
           </div>

           <div class="card p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl mb-6 shadow-lg shadow-indigo-200">
                <i class="fas fa-shield-alt"></i>
              </div>
              <h3 class="font-black text-slate-800 mb-2">Secure by Design</h3>
              <p class="text-slate-600 text-xs font-medium leading-relaxed">
                All webhook payloads are signed using **HMAC-SHA256**. Check the \`X-Innkie-Signature\` header to verify requests.
              </p>
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
  private webhookService = inject(WebhookService);

  activeWorkspace: Workspace | null = null;
  showApiKey = false;
  isRotating = false;

  // Webhooks
  webhooks: Webhook[] = [];
  availableEvents: WebhookEvent[] = ['link.created', 'link.clicked', 'link.deleted'];
  showNewWebhook = false;
  newWebhook = {
    name: '',
    url: '',
    events: ['link.clicked'] as WebhookEvent[]
  };

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(ws => {
      this.activeWorkspace = ws;
      if (ws) {
        this.loadWebhooks();
      }
    });
  }

  async loadWebhooks() {
    this.webhooks = await this.webhookService.getWebhooks();
  }

  async createWebhook() {
    try {
      await this.webhookService.createWebhook(this.newWebhook.name, this.newWebhook.url, this.newWebhook.events);
      alert('Webhook integration added!');
      this.showNewWebhook = false;
      this.newWebhook = { name: '', url: '', events: ['link.clicked'] };
      await this.loadWebhooks();
    } catch (e) {
      alert('Failed to add webhook');
    }
  }

  async toggleWebhook(wh: Webhook) {
    try {
      await this.webhookService.toggleWebhook(wh.id, !wh.isActive);
      wh.isActive = !wh.isActive;
    } catch (e) {
      alert('Failed to toggle webhook');
    }
  }

  async deleteWebhook(id: string) {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    try {
      await this.webhookService.deleteWebhook(id);
      await this.loadWebhooks();
    } catch (e) {
      alert('Failed to delete webhook');
    }
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

  copyKey(key: string) {
    if (key) {
      navigator.clipboard.writeText(key);
      alert('Copied to clipboard!');
    }
  }

  toggleEvent(ev: WebhookEvent) {
    const idx = this.newWebhook.events.indexOf(ev);
    if (idx === -1) {
      this.newWebhook.events.push(ev);
    } else {
      this.newWebhook.events.splice(idx, 1);
    }
  }
}
