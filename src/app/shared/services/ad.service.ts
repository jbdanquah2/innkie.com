import { Injectable, inject, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, map, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private rendererFactory = inject(RendererFactory2);
  private auth = inject(AuthService);

  // Define if ads should be shown based on environment
  // Updated: Showing ads to all users (logged in or not) for initial launch
  showAds$ = new BehaviorSubject<boolean>(
    environment.production || (environment as any).showAdsInDev
  ).asObservable();

  private scriptInjected = false;

  injectAdScript() {
    if (!isPlatformBrowser(this.platformId) || this.scriptInjected) return;

    const clientId = (environment as any).googleAdSenseClientId;
    if (!clientId) return;

    const renderer = this.rendererFactory.createRenderer(null, null);
    const script = renderer.createElement('script');
    renderer.setAttribute(script, 'async', '');
    renderer.setAttribute(script, 'src', `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`);
    renderer.setAttribute(script, 'crossorigin', 'anonymous');
    
    renderer.appendChild(this.document.head, script);
    this.scriptInjected = true;
    console.log('Ads: Script injected successfully');
  }
}
