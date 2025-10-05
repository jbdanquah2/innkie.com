import { Component, Input, Output, EventEmitter } from '@angular/core';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';
import {ShortUrl} from '../../shared/models/short-url.model';

@Component({
  selector: 'app-link-card',
  templateUrl: './link-card.component.html',
  imports: [
    NgClass,
    TimeAgoPipe,
    DatePipe,
    NgIf
  ],
  styleUrls: ['./link-card.component.scss']
})
export class LinkCardComponent {
  @Input() shortUrl!: ShortUrl
  @Input() apiUrl!: string;
  @Output() copy = new EventEmitter<string>();
  @Output() editLink = new EventEmitter<any>();
  @Output() editQRCodeEvent = new EventEmitter<any>();

  showDetails = false;

  copyToClipboard(url: string) {
    this.copy.emit(url);
  }

  edit(urlData: any) {
    this.editLink.emit(urlData);
  }

  editQRCode(urlData: any) {
    this.editQRCodeEvent.emit(urlData);
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  details(event: any) {
    console.log('###details', event)

    this.showDetails = !this.showDetails;

  }
}
