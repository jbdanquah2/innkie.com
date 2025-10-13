import {Component, inject, NgZone, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {ShortUrlService} from '../shared/services/short-url.service';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  private firestore = inject(Firestore);
  private shortUrlService: ShortUrlService = inject(ShortUrlService);

  currentYear = new Date().getFullYear();
  totalUrlsShortened: number = 0;

  constructor(private ngZone: NgZone) {
  }


  ngOnInit() {

    this.totalUrlsShortened = this.shortUrlService.getAll.length

    const statsRef = doc(this.firestore, 'stats/global');

    onSnapshot(statsRef, (snap) => {
      this.ngZone.run(() => {
        if (snap.exists()) {
          this.totalUrlsShortened = snap.data()['totalUrlsShortened'] || 0;
        }
      });

    });

  }


}
