import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-white">
      <!-- Top Navigation -->
      <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg">
              <i class="fas fa-book text-sm"></i>
            </div>
            <span class="text-lg font-black italic">iNNkie <span class="text-slate-400 not-italic font-medium text-sm ml-2">Developer Docs</span></span>
          </div>
          <a routerLink="/dashboard" class="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors">
            Back to Dashboard
          </a>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <!-- Sidebar Nav -->
          <aside class="hidden lg:block lg:col-span-3 space-y-8 sticky top-28 h-fit">
            <div *ngFor="let section of menu" class="space-y-3">
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ section.title }}</h3>
              <ul class="space-y-1">
                <li *ngFor="let item of section.items">
                  <button (click)="scrollTo(item.id)" 
                          class="w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all"
                          [class.text-primary-600]="activeSection === item.id"
                          [class.bg-primary-50]="activeSection === item.id"
                          [class.text-slate-500]="activeSection !== item.id"
                          [class.hover:text-slate-900]="activeSection !== item.id"
                          [class.hover:bg-slate-50]="activeSection !== item.id">
                    {{ item.label }}
                  </button>
                </li>
              </ul>
            </div>
          </aside>

          <!-- Main Content -->
          <main class="lg:col-span-9 space-y-20 pb-32">
            
            <!-- Introduction -->
            <section id="intro" class="scroll-mt-32">
              <h1 class="text-5xl font-black text-slate-900 tracking-tight mb-6">API Reference</h1>
              <p class="text-xl text-slate-500 leading-relaxed max-w-3xl">
                The iNNkie API is organized around REST. Our API has predictable resource-oriented URLs, 
                accepts JSON-encoded request bodies, and returns JSON-encoded responses.
              </p>
            </section>

            <!-- Authentication -->
            <section id="auth" class="scroll-mt-32 space-y-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <i class="fas fa-key"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Authentication</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                Authenticate your requests by including your secret API key in the <code class="bg-slate-100 px-2 py-0.5 rounded text-rose-500">x-api-key</code> header. 
                You can manage your keys in the <a routerLink="/developer-api" class="text-primary-600 font-bold hover:underline">Developer Studio</a>.
              </p>
              <div class="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                <pre class="text-primary-300 font-mono text-sm overflow-x-auto">curl https://api.innkie.com/api/v1/links \\
  -H "x-api-key: YOUR_WORKSPACE_KEY"</pre>
              </div>
            </section>

            <!-- Links Endpoint -->
            <section id="links" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <i class="fas fa-link"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Links</h2>
              </div>

              <div class="space-y-12">
                <!-- Create Link -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">Create a Short Link</h3>
                    <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100">POST /links</span>
                  </div>
                  <p class="text-slate-600">Creates a new shortened URL within the workspace associated with your API key.</p>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-4">
                      <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Parameters</h4>
                      <div class="divide-y divide-slate-100">
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">url</span>
                          <span class="text-xs text-slate-400 italic">string / required</span>
                        </div>
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">customAlias</span>
                          <span class="text-xs text-slate-400 italic">string / optional</span>
                        </div>
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">tags</span>
                          <span class="text-xs text-slate-400 italic">array / optional</span>
                        </div>
                      </div>
                    </div>
                    <div class="p-6 bg-slate-900 rounded-3xl border border-slate-800">
                      <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Request Example</h4>
                      <pre class="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{{ '{' }}
  "url": "https://google.com",
  "customAlias": "my-search",
  "tags": ["marketing", "summer-24"]
{{ '}' }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Webhooks -->
            <section id="webhooks" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <i class="fas fa-bolt"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Webhooks</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                iNNkie can notify your application when certain events happen in your workspace. 
                Webhooks are sent as <code class="bg-slate-100 px-2 py-0.5 rounded text-rose-500">POST</code> requests with a JSON payload.
              </p>
              
              <div class="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                <i class="fas fa-shield-alt text-amber-400 text-xl pt-1"></i>
                <div>
                   <h4 class="font-bold text-amber-900 text-sm mb-1">Verify Payloads</h4>
                   <p class="text-xs text-amber-700 font-medium leading-relaxed">
                     Every webhook includes an <code class="font-bold">x-innkie-signature</code> header. 
                     Always verify this signature using your secret to ensure the request originated from iNNkie.
                   </p>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .scroll-mt-32 { scroll-margin-top: 8rem; }
  `]
})
export class DocsComponent implements OnInit {
  activeSection = 'intro';

  menu = [
    {
      title: 'Getting Started',
      items: [
        { id: 'intro', label: 'Introduction' },
        { id: 'auth', label: 'Authentication' },
      ]
    },
    {
      title: 'Endpoints',
      items: [
        { id: 'links', label: 'Links' },
        { id: 'workspaces', label: 'Workspaces' },
        { id: 'analytics', label: 'Analytics' },
      ]
    },
    {
      title: 'Webhooks',
      items: [
        { id: 'webhooks', label: 'Overview' },
        { id: 'signature', label: 'Signature Verification' },
      ]
    }
  ];

  ngOnInit() {}

  scrollTo(id: string) {
    this.activeSection = id;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
