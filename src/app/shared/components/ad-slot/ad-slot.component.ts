import { Component, Input, OnInit, inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AdService } from '../../services/ad.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="adService.showAds$ | async" class="ad-container my-8 w-full flex flex-col items-center">
      <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Advertisement</p>
      
      <!-- Actual Ad Tag -->
      <ins class="adsbygoogle"
           [style.display]="'block'"
           [attr.data-ad-client]="clientId"
           [attr.data-ad-slot]="slotId"
           [attr.data-ad-format]="format"
           [attr.data-full-width-responsive]="fullWidthResponsive"></ins>
      
      <!-- Mock Ad for Local Development if enabled -->
      <div *ngIf="isDev && !clientId" class="w-full bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 h-48 flex items-center justify-center">
        <div class="text-center">
          <p class="text-slate-400 font-bold">Mock Ad Slot</p>
          <p class="text-[10px] text-slate-300">Slot ID: {{ slotId }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ad-container { min-height: 50px; }
  `]
})
export class AdSlotComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  adService = inject(AdService);

  @Input() slotId: string = '';
  @Input() format: string = 'auto';
  @Input() fullWidthResponsive: string = 'true';

  clientId = (environment as any).googleAdSenseClientId;
  isDev = !environment.production;

  ngOnInit() {
    this.adService.injectAdScript();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.clientId) {
      // Delay slightly to ensure DOM is stable and avoid synchronous conflict with AdSense auto-init
      setTimeout(() => {
        try {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        } catch (e) {
          // This error is common in SPAs and usually harmless if the ad still loads, 
          // but we catch it to prevent app-level crashes.
          console.warn('Ads: AdSense push handled', e);
        }
      }, 100);
    }
  }
}
