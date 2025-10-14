import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';
import {ShortUrl, UniqueVisitor} from '../../shared/models/short-url.model';
import {MatDialog} from '@angular/material/dialog';
import {ShortUrlDetailsComponent} from '../short-url-details/short-url-details.component';
import {ShortUrlService} from '../../shared/services/short-url.service';

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
export class LinkCardComponent implements OnInit {

  @Input() shortUrl: ShortUrl | undefined
  @Input() apiUrl!: string;
  @Output() copy = new EventEmitter<string>();
  @Output() editLink = new EventEmitter<any>();
  @Output() editQRCodeEvent = new EventEmitter<any>();
  @Output() openLinkDetails = new EventEmitter<any>();

  showDetails = false;
  uniqueVisitors: any[] = [];
  isCopyingShortUrl: boolean = false;

  constructor() {}

  async ngOnInit() {

  }

  openDetails(shortUrl: ShortUrl | undefined, visitors: UniqueVisitor[]) {
    this.openLinkDetails.emit(shortUrl);
  }

  copyToClipboard(url: string) {

    this.isCopyingShortUrl = true;

    this.copy.emit(url);

    setTimeout(() => {
      this.isCopyingShortUrl = false;
    }, 800);
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
