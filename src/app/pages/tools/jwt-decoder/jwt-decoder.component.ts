import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PlatformMetricsService } from '../../../shared/services/platform-metrics.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { GuideCalloutComponent } from '../../../shared/components/guide-callout/guide-callout.component';

@Component({
  selector: 'app-jwt-decoder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdSlotComponent, GuideCalloutComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Tool Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Secure <span class="text-primary-600">JWT</span> Decoder
          </h1>
          <p class="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Inspect and debug JSON Web Tokens instantly. 100% browser-side decoding—your sensitive security tokens never leave your device.
          </p>
        </div>

        <!-- Input Section -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-12">
           <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Paste your JWT Token here</label>
           <textarea 
             [ngModel]="token()"
             (ngModelChange)="token.set($event)"
             placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
             class="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-mono text-sm text-slate-700 break-all"
           ></textarea>
           
           <div class="flex items-center justify-between mt-6">
              <div class="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <i class="fas fa-shield-alt"></i> Local Processing Only
              </div>
              <button (click)="token.set('')" class="text-xs font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors">
                <i class="fas fa-trash-alt mr-1"></i> Clear
              </button>
           </div>
        </div>

        <!-- Ad Slot -->
        <app-ad-slot slotId="jwt_decoder_top" minHeight="90px" class="mb-12 block"></app-ad-slot>

        <!-- Result Section -->
        @if (decodedData()) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            
            <!-- Header -->
            <div class="space-y-4">
               <div class="flex items-center gap-2 ml-4">
                  <i class="fas fa-heading text-primary-500"></i>
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Header</h3>
               </div>
               <div class="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                  <pre class="text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar"><code>{{ decodedData()?.header | json }}</code></pre>
                  <div class="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest pointer-events-none">ALGORITHM & TYPE</div>
               </div>
            </div>

            <!-- Payload -->
            <div class="space-y-4">
               <div class="flex items-center gap-2 ml-4">
                  <i class="fas fa-database text-emerald-500"></i>
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Payload</h3>
               </div>
               <div class="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                  <pre class="text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar"><code>{{ decodedData()?.payload | json }}</code></pre>
                  <div class="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest pointer-events-none">DATA CLAIMS</div>
               </div>
               
               <!-- Time Claims Helper -->
               @if (timeClaims().length > 0) {
                 <div class="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Human-Readable Timestamps</h4>
                    <div class="space-y-3">
                       @for (claim of timeClaims(); track claim.label) {
                         <div class="flex items-center justify-between text-xs">
                            <span class="font-black text-slate-500 uppercase tracking-tighter">{{ claim.label }}</span>
                            <span class="font-mono text-slate-700 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{{ claim.value }}</span>
                         </div>
                       }
                    </div>
                 </div>
               }
            </div>

          </div>

          <!-- Signature (Structural only) -->
          <div class="mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
             <div class="flex items-center gap-2 ml-4 mb-4">
                <i class="fas fa-fingerprint text-rose-500"></i>
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Signature</h3>
             </div>
             <div class="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-[2rem] text-center">
                <p class="text-xs font-mono text-slate-400 break-all leading-relaxed">{{ decodedData()?.signature }}</p>
                <p class="mt-6 text-[10px] font-bold text-slate-500 italic">Note: iNNkie decodes the structure locally. Signature verification requires your private key and is not performed here for your security.</p>
             </div>
          </div>
        } @else if (token().trim().length > 0) {
           <div class="text-center py-20 bg-rose-50 rounded-[3rem] border border-rose-100 border-dashed animate-pulse">
              <i class="fas fa-exclamation-triangle text-rose-400 text-4xl mb-4"></i>
              <h3 class="text-lg font-black text-rose-900 tracking-tight">Invalid JWT Format</h3>
              <p class="text-rose-600/70 font-medium">Please check your token structure (header.payload.signature)</p>
           </div>
        }

        <!-- Related Guide -->
        <app-guide-callout toolRoute="/tools/jwt-decoder" class="mt-16 block"></app-guide-callout>

        <!-- Related Tools -->
        <div class="mt-32 pt-16 border-t border-slate-200">
          <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center underline decoration-primary-500 underline-offset-8">Developer Workspace</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a routerLink="/tools/json-formatter" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-code"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">JSON Formatter</h3>
                <p class="text-xs text-slate-500">Beautify and validate JSON data</p>
              </div>
            </a>
            <a routerLink="/tools/utm-builder" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-bullhorn"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">UTM Builder</h3>
                <p class="text-xs text-slate-500">Campaign tracking made easy</p>
              </div>
            </a>
            <a routerLink="/tools/link-shortener" class="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-lg transition-all group">
              <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                <i class="fas fa-link"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Short Links</h3>
                <p class="text-xs text-slate-500">Premium redirection analytics</p>
              </div>
            </a>
          </div>
        </div>

        <!-- SEO Content Section -->
        <div class="mt-32 space-y-24">
           <section class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                 <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-4">What is a JWT?</h2>
                 <p class="text-slate-500 font-medium leading-relaxed">
                    JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information 
                    between parties as a JSON object. This information can be verified and trusted because it is digitally signed.
                 </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                 <div>
                    <h3 class="text-lg font-black text-slate-900 mb-2">Header</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Contains the type of token (JWT) and the signing algorithm used, such as HMAC SHA256 or RSA.</p>
                 </div>
                 <div>
                    <h3 class="text-lg font-black text-slate-900 mb-2">Payload</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">The claims (data) you want to transmit, such as user ID, role, and expiration timestamps.</p>
                 </div>
                 <div>
                    <h3 class="text-lg font-black text-slate-900 mb-2">Signature</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">Ensures that the token was not tampered with during transit. Only the issuer knows the secret key.</p>
                 </div>
              </div>
           </section>

           <!-- Usage Guide -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">How to Decode a JWT</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div class="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-200">
                    <h3 class="text-xl font-black mb-4">Security Notice</h3>
                    <p class="text-indigo-100 text-sm leading-relaxed mb-6">
                       Unlike other JWT tools, iNNkie's decoder is <strong>entirely client-side</strong>. Your tokens are processed only in your browser's memory and are never transmitted over the network. This makes it safe for production security auditing.
                    </p>
                    <div class="h-1 w-12 bg-white/20 rounded-full"></div>
                 </div>
                 <div class="space-y-6">
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                       <p class="text-slate-600 font-medium">Copy the raw encoded JWT string from your application or terminal.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                       <p class="text-slate-600 font-medium">Paste the string into the text area above. The tool will detect it automatically.</p>
                    </div>
                    <div class="flex gap-4">
                       <div class="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                       <p class="text-slate-600 font-medium">Inspect the <strong>Header</strong> and <strong>Payload</strong> JSON blocks. Use the timestamp helper to check expiration.</p>
                    </div>
                 </div>
              </div>
           </section>

           <!-- Common Claims -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center underline decoration-primary-500 underline-offset-8">Understanding Standard JWT Claims</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p class="text-xs font-black text-indigo-600 mb-1">iss</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Issuer</p>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Identifies the principal that issued the JWT (e.g., Auth0, Firebase, or your own API).</p>
                 </div>
                 <div class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p class="text-xs font-black text-indigo-600 mb-1">sub</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Subject</p>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The unique identifier for the user or entity the token belongs to.</p>
                 </div>
                 <div class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p class="text-xs font-black text-indigo-600 mb-1">aud</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Audience</p>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">Identifies the recipients that the JWT is intended for (e.g., your frontend URL).</p>
                 </div>
                 <div class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p class="text-xs font-black text-indigo-600 mb-1">iat</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Issued At</p>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">The time at which the JWT was created, measured in Unix seconds.</p>
                 </div>
              </div>
           </section>

           <!-- Security Section -->
           <section class="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
              <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px]"></div>
              <h2 class="text-2xl font-black mb-8 tracking-tight">Why Security Matters</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div class="space-y-4">
                    <h4 class="text-sm font-black text-indigo-400 uppercase tracking-widest">Client-Side Isolation</h4>
                    <p class="text-sm text-slate-300 leading-relaxed">
                       When you paste a token into a server-side decoder, you are trusting that company with your session credentials. 
                       iNNkie removes that risk. The code that decodes your token runs entirely in your browser's memory and is destroyed when you close the tab.
                    </p>
                 </div>
                 <div class="space-y-4">
                    <h4 class="text-sm font-black text-indigo-400 uppercase tracking-widest">No Logs, No Storage</h4>
                    <p class="text-sm text-slate-300 leading-relaxed">
                       Our platform does not log or store the tokens you decode. There is no database record of your security credentials, 
                       ensuring that even in the event of a platform breach, your private tokens remain private.
                    </p>
                 </div>
              </div>
           </section>

           <!-- Use Cases -->
           <section class="max-w-4xl mx-auto">
              <h2 class="text-2xl font-black text-slate-900 mb-12 text-center">Secure Debugging Workflows</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-user-shield text-2xl text-indigo-500"></i>
                       <h4 class="font-black text-slate-800">Auth Implementation</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Verify that your authentication server is issuing tokens with the correct scopes, roles, and user identifiers. Inspect custom claims to ensure your frontend logic has the data it needs.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-clock text-2xl text-emerald-500"></i>
                       <h4 class="font-black text-slate-800">Expiration Debugging</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Troubleshoot 'Session Expired' bugs by inspecting the 'exp' and 'iat' claims. Our tool converts Unix timestamps to local time so you can see exactly when a token will become invalid.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-server text-2xl text-blue-500"></i>
                       <h4 class="font-black text-slate-800">API Integration</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Ensure your backend is receiving the expected 'aud' (Audience) and 'iss' (Issuer) values. Perfect for debugging multi-tenant applications and third-party integrations like Auth0 or Firebase.
                    </p>
                 </div>
                 <div class="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                    <div class="flex items-center gap-4 mb-4">
                       <i class="fas fa-terminal text-2xl text-slate-700"></i>
                       <h4 class="font-black text-slate-800">DevOps & CI/CD</h4>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                       Quickly inspect tokens generated by service accounts or CLI tools during deployment. The 100% client-side nature makes it safe to use even with sensitive production credentials.
                    </p>
                 </div>
              </div>
           </section>

           <section class="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <h2 class="text-2xl font-black text-slate-900 mb-8 text-center">JWT Security FAQ</h2>
              <div class="space-y-8">
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Is it safe to paste JWTs online?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">iNNkie decodes your JWT entirely in your browser. Unlike other tools, we NEVER send your token to a server, making it the safest way to inspect security credentials.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Can I modify a JWT here?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">iNNkie is currently a read-only inspector. This preserves the original signature structure and prevents accidental tampering while debugging.</p>
                 </div>
                 <div>
                    <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">What does 'exp' mean?</h4>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">The 'exp' claim is the expiration time on or after which the JWT must not be accepted for processing. Our tool automatically converts this to a local date for you.</p>
                 </div>
              </div>
           </section>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
  `]
})
export class JwtDecoderComponent implements OnInit {
  private seo = inject(SeoService);
  private metrics = inject(PlatformMetricsService);
  private toast = inject(ToastService);

  token = signal<string>('');

  decodedData = computed(() => {
    const raw = this.token().trim();
    if (!raw) return null;

    const parts = raw.split('.');
    if (parts.length !== 3) return null;

    try {
      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const signature = parts[2];

      this.metrics.logToolUsage('jwt_decoder', 'decode');
      return { header, payload, signature };
    } catch (e) {
      return null;
    }
  });

  timeClaims = computed(() => {
    const data = this.decodedData();
    if (!data || !data.payload) return [];

    const claims: { label: string, value: string }[] = [];
    const payload = data.payload;

    if (payload.iat) claims.push({ label: 'Issued At (iat)', value: this.formatDate(payload.iat) });
    if (payload.exp) claims.push({ label: 'Expires (exp)', value: this.formatDate(payload.exp) });
    if (payload.nbf) claims.push({ label: 'Not Before (nbf)', value: this.formatDate(payload.nbf) });

    return claims;
  });

  ngOnInit() {
    const schema = [{
      '@type': 'SoftwareApplication',
      '@id': 'https://innkie.com/tools/jwt-decoder#app',
      'name': 'iNNkie Secure JWT Decoder',
      'url': 'https://innkie.com/tools/jwt-decoder',
      'operatingSystem': 'Any',
      'applicationCategory': 'DeveloperApplication',
      'description': 'Securely decode JSON Web Tokens (JWT) locally in your browser. Inspect headers, payloads, and timestamps without exposing sensitive data.',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'JWT Decoder', url: '/tools/jwt-decoder' }
    ])];

    this.seo.updateSeo(
      'JWT Decoder',
      'Inspect and debug JSON Web Tokens securely in your browser. 100% client-side decoding ensures your security tokens are never sent to a server.',
      '/tools/jwt-decoder',
      'assets/preview.png',
      schema
    );
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
}
