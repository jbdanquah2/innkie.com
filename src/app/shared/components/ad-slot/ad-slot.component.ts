import { Component, Input, OnInit, inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AdService } from '../../services/ad.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="adService.showAds$ | async"
      class="ad-container my-8 w-full flex flex-col items-center"
      [style.min-height]="'calc(' + minHeight + ' + 1.25rem)'">
      <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Advertisement</p>
      
      <!-- Actual Ad Tag -->
      <ins #adRef class="adsbygoogle"
           [style.display]="'block'"
           [style.min-height]="minHeight"
           [attr.data-ad-client]="clientId"
           [attr.data-ad-slot]="slotId"
           [attr.data-ad-format]="format"
           [attr.data-full-width-responsive]="fullWidthResponsive"></ins>
      
      <!-- Mock Ad for Local Development if enabled -->
      <div *ngIf="isDev && !clientId" 
           [style.min-height]="minHeight"
           class="w-full bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center">
        <div class="text-center">
          <p class="text-slate-400 font-bold">Mock Ad Slot</p>
          <p class="text-[10px] text-slate-300">Slot ID: {{ slotId }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ad-container { overflow: hidden; }
  `]
})
export class AdSlotComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  adService = inject(AdService);
  
  @ViewChild('adRef') adRef?: ElementRef;

  @Input() slotId: string = '';
  @Input() format: string = 'auto';
  @Input() fullWidthResponsive: string = 'true';
  @Input() minHeight: string = '100px';

  clientId = (environment as any).googleAdSenseClientId;
  isDev = !environment.production;

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.clientId) {
      this.pushAd();
    }
  }

  private pushAd(retries = 3) {
    if (retries <= 0) return;

    // Small delay to let Angular finish rendering and AdSense script to be ready
    setTimeout(() => {
      try {
        const insElement = this.adRef?.nativeElement;
        
        // If the element doesn't exist yet, retry
        if (!insElement) {
          this.pushAd(retries - 1);
          return;
        }

        // Check if AdSense has already processed this element
        // AdSense adds 'data-adsbygoogle-status' or fills the element when done
        const isProcessed = insElement.getAttribute('data-adsbygoogle-status') === 'done' || insElement.innerHTML.trim().length > 0;
        
        if (!isProcessed) {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (e) {
        // Log it but don't crash
        console.warn('Ads: AdSense push handled', e);
      }
    }, 200);
  }
}
