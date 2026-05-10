import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';

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
            <section id="links" class="scroll-mt-32 space-y-12">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <i class="fas fa-link"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Links</h2>
              </div>

              <div class="space-y-16">
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
                      <div class="divide-y divide-slate-100 border-t border-slate-100">
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">url</span>
                          <span class="text-xs text-slate-400 italic font-medium">string / required</span>
                        </div>
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">customAlias</span>
                          <span class="text-xs text-slate-400 italic font-medium">string / optional</span>
                        </div>
                        <div class="py-3 flex justify-between">
                          <span class="font-mono text-sm font-bold text-primary-600">tags</span>
                          <span class="text-xs text-slate-400 italic font-medium">string[] / optional</span>
                        </div>
                      </div>
                    </div>
                    <div class="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                      <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Request Body</h4>
                      <pre class="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">{{ '{' }}
  "url": "https://google.com",
  "customAlias": "marketing-campaign",
  "tags": ["growth", "summer24"]
{{ '}' }}</pre>
                    </div>
                  </div>
                </div>

                <!-- List Links -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">List Workspace Links</h3>
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">GET /links/workspace/:id</span>
                  </div>
                  <p class="text-slate-600">Retrieve all short links belonging to a specific workspace.</p>
                </div>

                <!-- Update Link -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">Update a Link</h3>
                    <span class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100">PUT /links/:shortCode</span>
                  </div>
                  <p class="text-slate-600">Update the destination URL or metadata of an existing short link.</p>
                </div>
              </div>
            </section>

            <!-- Workspaces Endpoint -->
            <section id="workspaces" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <i class="fas fa-layer-group"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Workspaces</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                Workspaces are the top-level containers for all iNNkie resources. They manage branding, API keys, and team members.
              </p>

              <div class="space-y-12">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">List My Workspaces</h3>
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">GET /workspaces</span>
                  </div>
                  <p class="text-slate-600">Returns a list of all workspaces you have access to, including your personal workspace.</p>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">Create Workspace</h3>
                    <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100">POST /workspaces</span>
                  </div>
                  <p class="text-slate-600">Creates a new professional/team workspace.</p>
                </div>
              </div>
            </section>

            <!-- Analytics Endpoint -->
            <section id="analytics" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <i class="fas fa-chart-bar"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Analytics</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                Access real-time click tracking and visitor data for your shortened links and entire workspaces.
              </p>

              <div class="space-y-12">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">Link Clicks</h3>
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">GET /analytics/:code/clicks</span>
                  </div>
                  <p class="text-slate-600">Returns time-series click data for a specific short link. Query parameter <code class="font-bold">?days=30</code> supported.</p>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-slate-800">Workspace Overview</h3>
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">GET /analytics/workspace/:id</span>
                  </div>
                  <p class="text-slate-600">Retrieve aggregated performance metrics for all links within a workspace.</p>
                </div>
              </div>
            </section>

            <!-- Webhooks -->
            <section id="webhooks" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <i class="fas fa-bolt"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Webhooks Overview</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                iNNkie can notify your application when certain events happen in your workspace. 
                Webhooks are sent as <code class="bg-slate-100 px-2 py-0.5 rounded text-rose-500">POST</code> requests with a JSON payload.
              </p>
              
              <div class="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                <i class="fas fa-info-circle text-amber-400 text-xl pt-1"></i>
                <div>
                   <h4 class="font-bold text-amber-900 text-sm mb-1">Supported Events</h4>
                   <ul class="text-xs text-amber-700 font-medium list-disc ml-4 space-y-1">
                     <li><code class="font-bold">link.created</code> - Fired when a new short link is generated.</li>
                     <li><code class="font-bold">link.clicked</code> - Fired every time a short link is visited.</li>
                   </ul>
                </div>
              </div>
            </section>

            <!-- Signature Verification -->
            <section id="signature" class="scroll-mt-32 space-y-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <i class="fas fa-lock"></i>
                </div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">Signature Verification</h2>
              </div>
              <p class="text-slate-600 leading-relaxed">
                To ensure that a webhook request was actually sent by iNNkie, we include an <code class="bg-slate-100 px-2 py-0.5 rounded text-rose-500">X-Innkie-Signature</code> header in every request.
              </p>
              <div class="space-y-6">
                <h3 class="text-xl font-bold text-slate-800">Verification Steps</h3>
                <div class="space-y-4">
                  <p class="text-sm text-slate-500">1. Capture the raw JSON request body.</p>
                  <p class="text-sm text-slate-500">2. Generate an HMAC SHA256 hash using your webhook secret as the key and the raw body as the message.</p>
                  <p class="text-sm text-slate-500">3. Compare the resulting hex digest with the value in the header.</p>
                </div>
                
                <div class="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                  <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Node.js Example</h4>
                  <pre class="text-xs text-primary-300 font-mono overflow-x-auto">const crypto = require('crypto');

function verify(rawBody, secret, signature) {{ '{' }}
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
    
  return hash === signature;
{{ '}' }}</pre>
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
  private seo = inject(SeoService);
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

  ngOnInit() {
    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Developer Docs', url: '/docs' }
    ]);
    this.seo.updateSeo(
      'Developer Documentation',
      'Learn how to integrate iNNkie into your workflow with our robust REST API, SDKs, and webhook system.',
      '/docs',
      'assets/preview.png',
      breadcrumbs
    );
  }

  scrollTo(id: string) {
    this.activeSection = id;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
