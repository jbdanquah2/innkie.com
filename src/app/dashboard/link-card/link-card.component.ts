import {Component, computed, input, output, OnInit} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';
import {ShortUrl} from '@innkie/shared-models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-link-card',
  templateUrl: './link-card.component.html',
  imports: [
    NgClass,
    TimeAgoPipe,
    DatePipe
  ],
  standalone: true,
  styleUrls: ['./link-card.component.scss']
})
export class LinkCardComponent implements OnInit {

  shortUrl = input<ShortUrl>();
  apiUrl = input<string>(environment.appUrl);
  isGuest = input<boolean>(false);
  isSelected = input<boolean>(false);

  copy = output<string>();
  editLink = output<any>();
  editQRCodeEvent = output<any>();
  openLinkDetails = output<ShortUrl>();
  deleteLink = output<string>();
  selectionToggled = output<void>();

  fullShortUrl = computed(() => {
    const code = this.shortUrl()?.shortCode;
    return code ? `${this.apiUrl()}/${code}` : '';
  });

  showDetails = false;
  isCopyingShortUrl: boolean = false;
  isCopyingOriginalUrl: boolean = false;

  constructor() {}

  async ngOnInit() {}

  openDetails() {
    if (this.isGuest()) return;
    const url = this.shortUrl();
    if (url) {
      this.openLinkDetails.emit(url);
    }
  }

  copyToClipboard(target: 'short' | 'original' = 'short') {
    const url = target === 'short' ? this.fullShortUrl() : this.shortUrl()?.originalUrl;
    if (!url) return;

    if (target === 'short') {
      this.isCopyingShortUrl = true;
    } else {
      this.isCopyingOriginalUrl = true;
    }

    this.copy.emit(url);

    setTimeout(() => {
      this.isCopyingShortUrl = false;
      this.isCopyingOriginalUrl = false;
    }, 1500);
  }

  share() {
    const url = this.fullShortUrl();
    if (navigator.share) {
      navigator.share({
        title: this.shortUrl()?.title || 'Check out this link',
        text: this.shortUrl()?.description || 'Shortened with iNNkie',
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      this.copyToClipboard('short');
    }
  }

  edit() {
    if (this.isGuest()) return;
    this.editLink.emit(this.shortUrl());
  }

  delete() {
    const shortCode = this.shortUrl()?.shortCode;
    if (shortCode) {
      this.deleteLink.emit(shortCode);
    }
  }

  editQRCode() {
    this.editQRCodeEvent.emit(this.shortUrl());
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  handleFaviconError(event: any) {
    event.target.src = '/favicon.ico';
  }
}
