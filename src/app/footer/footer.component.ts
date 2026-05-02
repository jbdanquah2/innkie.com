import {Component, inject, NgZone, OnInit, PLATFORM_ID, EnvironmentInjector, runInInjectionContext} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import { Firestore, doc, onSnapshot, getDoc } from '@angular/fire/firestore';
import {LoadingService} from '../shared/services/loading.service';
import {LogoComponent} from '../logo/logo.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  private firestore = inject(Firestore);
  private shortUrlService: ShortUrlService = inject(ShortUrlService);
  private loadingService = inject(LoadingService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private injector = inject(EnvironmentInjector);

  currentYear = new Date().getFullYear();
  totalUrlsShortened: number = 0;

  ngOnInit() {
    this.totalUrlsShortened = this.shortUrlService.getAll.length;
    const statsRef = doc(this.firestore, 'stats/global');

    if (isPlatformBrowser(this.platformId)) {
      runInInjectionContext(this.injector, () => {
        onSnapshot(statsRef, (snap) => {
          this.loadingService.hide();
          this.ngZone.run(() => {
            if (snap.exists()) {
              this.totalUrlsShortened = snap.data()['totalUrlsShortened'] || 0;
            }
          });
        });
      });
    } else {
      // On server, we run outside the zone to avoid blocking SSR stability
      this.ngZone.runOutsideAngular(() => {
        runInInjectionContext(this.injector, () => {
          getDoc(statsRef).then(snap => {
            if (snap.exists()) {
              this.ngZone.run(() => {
                this.totalUrlsShortened = snap.data()['totalUrlsShortened'] || 0;
              });
            }
          });
        });
      });
    }
  }
}
