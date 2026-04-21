import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';
import {ShortUrl, UniqueVisitor} from '@innkie/shared-models';
import {ShortUrlService} from '../../shared/services/short-url.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-link-card',
  templateUrl: './link-card.component.html',
  imports: [
    NgClass,
    TimeAgoPipe,
    DatePipe,
    NgIf
  ],
  standalone: true,
  styleUrls: ['./link-card.component.scss']
})
export class LinkCardComponent implements OnInit {

  @Input() shortUrl: ShortUrl | undefined
  @Input() apiUrl: string = environment.appUrl;
  @Input() isGuest: boolean = false;
  @Output() copy = new EventEmitter<string>();
  @Output() editLink = new EventEmitter<any>();
  @Output() editQRCodeEvent = new EventEmitter<any>();
  @Output() openLinkDetails = new EventEmitter<any>();
  @Output() deleteLink = new EventEmitter<string>();

  showDetails = false;
  uniqueVisitors: any[] = [];
  isCopyingShortUrl: boolean = false;
  isCopyingOriginalUrl: boolean = false;

  constructor() {}

  async ngOnInit() {

  }

  openDetails(shortUrl: ShortUrl | undefined, visitors: UniqueVisitor[]) {
    if (this.isGuest) return;
    this.openLinkDetails.emit(shortUrl);
  }

  copyToClipboard(url: string, target: 'short' | 'original' = 'short') {
    const baseUrl = this.apiUrl || environment.appUrl;
    const finalUrl = target === 'short' ? `${baseUrl}/${this.shortUrl?.shortCode}` : url;

    if (target === 'short') {
      this.isCopyingShortUrl = true;
    } else {
      this.isCopyingOriginalUrl = true;
    }

    this.copy.emit(finalUrl);

    setTimeout(() => {
      this.isCopyingShortUrl = false;
      this.isCopyingOriginalUrl = false;
    }, 1500);
  }

  share() {
    const url = `${this.apiUrl}/${this.shortUrl?.shortCode}`;
    if (navigator.share) {
      navigator.share({
        title: this.shortUrl?.title || 'Check out this link',
        text: this.shortUrl?.description || 'Shortened with iNNkie',
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      this.copyToClipboard(url, 'short');
    }
  }

  edit(urlData: any) {
    if (this.isGuest) return;
    this.editLink.emit(urlData);
  }

  delete(shortCode: string | undefined) {
    if (shortCode) {
      this.deleteLink.emit(shortCode);
    }
  }

  editQRCode(urlData: any) {
    this.editQRCodeEvent.emit(urlData);
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  handleFaviconError(event: any) {
    event.target.src = '/favicon.ico';
  }

  details() {
    this.showDetails = !this.showDetails;
  }
}
