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
  private dialog: MatDialog = inject(MatDialog);
  private shortUrlService = inject(ShortUrlService);
  private timeAgoPipe = inject(TimeAgoPipe);

  @Input() shortUrl!: ShortUrl
  @Input() apiUrl!: string;
  @Output() copy = new EventEmitter<string>();
  @Output() editLink = new EventEmitter<any>();
  @Output() editQRCodeEvent = new EventEmitter<any>();

  showDetails = false;
  uniqueVisitors: any[] = []

  constructor() {}

  async ngOnInit() {
    console.log("shortUrl::", this.shortUrl)
    // await this.getUniqueVisitors(this.shortUrl.shortCode)
  }

  openDetails(shortUrl: ShortUrl, visitors: UniqueVisitor[]) {
    this.dialog.open(ShortUrlDetailsComponent, {
      width: '980px',
      height: '85vh',
      data: { shortUrl }
    }).afterClosed().subscribe(res => {
      if (res?.action === 'edit') {
        // navigate to edit
      } else if (res?.action === 'delete') {
        // delete flow
      }
    });
  }

  // async getUniqueVisitors(shortCode: string): Promise<Partial<UniqueVisitor>[]> {
  //   this.uniqueVisitors = await this.shortUrlService.getUniqueVisitors(shortCode);
  //   console.log("uniqueVisitors::", this.uniqueVisitors)
  //   return this.uniqueVisitors
  // }

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
