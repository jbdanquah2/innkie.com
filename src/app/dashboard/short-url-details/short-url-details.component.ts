import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import {Clipboard} from '@angular/cdk/clipboard';
import {DatePipe, NgIf} from '@angular/common';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import {ShortUrl, UniqueVisitor} from '../../shared/models/short-url.model';
import {MatCard} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {environment} from '../../../environments/environment';
import {ShortUrlService} from '../../shared/services/short-url.service';
import {LoadingService} from '../../shared/services/loading.service';

import { HttpClient, } from '@angular/common/http';
import * as L from 'leaflet';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';

type TimestampLike =
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number }
  | { toDate: () => Date }
  | number
  | string
  | Date;

@Component({
  selector: 'app-short-url-details',
  standalone: true,
  templateUrl: './short-url-details.component.html',
  styleUrls: ['./short-url-details.component.scss'],
  providers: [DatePipe],
  imports: [
    MatPaginator,
    MatCard,
    MatFormField,
    MatButton,
    MatIconButton,
    NgIf,
    MatDialogContent,
    MatLabel,
    MatInput,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatColumnDef,
    MatSort,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatRow,
    MatDialogClose,
    MatHeaderRowDef,
    MatRowDef,
    TimeAgoPipe
  ]
})
export class ShortUrlDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  shortUrl!: ShortUrl;
  uniqueVisitors: any = [];
  isCopyingShortUrl = false;
  hasNoVisitors = false;
  visitorTableDataSource = new MatTableDataSource<UniqueVisitor>([]);
  visitorTableColumns: string[] = ['ipAddress', 'device', 'location', 'firstVisit', 'lastVisit', 'visitCount'];
  apiUrl = environment.appUrl;

  @ViewChild(MatPaginator) private visitorTablePaginator!: MatPaginator;
  @ViewChild(MatSort) private visitorTableSort!: MatSort;

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;
  private map?: L.Map
  private geoJsonLayer?: L.GeoJSON;
  countryCounts: Record<string, number> = {};
  totalClicks = 0;
  maxCount = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public dialogPayload: { shortUrl: ShortUrl},
    private dialogReference: MatDialogRef<ShortUrlDetailsComponent>,
    private clipboardService: Clipboard,
    private datePipe: DatePipe,
    private shortUrlService: ShortUrlService,
    public loadingService: LoadingService,
    private http: HttpClient,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.show();

      this.shortUrl = this.dialogPayload.shortUrl;

      // Await the async visitor fetch
      const vis = await this.getUniqueVisitors(this.shortUrl.shortCode);
      this.uniqueVisitors = vis ?? [];
      this.hasNoVisitors = this.uniqueVisitors.length === 0;

      // Prepare country counts
      if (this.shortUrl?.topCountries && Object.keys(this.shortUrl.topCountries).length > 0) {
        this.countryCounts = { ...this.shortUrl.topCountries } as Record<string, number>;
      } else {
        this.countryCounts = this.buildCountsFromVisitors(this.uniqueVisitors);
      }

      // Compute totals
      this.totalClicks = Object.values(this.countryCounts).reduce((sum, v) => sum + (v || 0), 0);
      this.maxCount = Math.max(0, ...Object.values(this.countryCounts));

      // Apply to table data source
      this.visitorTableDataSource.data = this.uniqueVisitors;

    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      this.loadingService.hide();
    }
  }


  private buildCountsFromVisitors(visitors: Partial<UniqueVisitor>[]): Record<string, number> {
    const counts: Record<string, number> = {};
    (visitors || []).forEach(v => {
      const countryKey = (v.country || 'Unknown').toString().trim();
      if (!countryKey) return;
      const key = countryKey.toUpperCase();
      counts[key] = (counts[key] || 0) + (v.visitCount || 1);
    });
    return counts;
  }


  public ngAfterViewInit(): void {
    if (this.visitorTablePaginator) {
      this.visitorTableDataSource.paginator = this.visitorTablePaginator;
    }
    if (this.visitorTableSort) {
      this.visitorTableDataSource.sort = this.visitorTableSort;
    }

    // init map (guarded)
    setTimeout(() => this.initializeMap(), 0);
  }

  async getUniqueVisitors(shortCode: string): Promise<Partial<UniqueVisitor>[]> {
    this.uniqueVisitors = await this.shortUrlService.getUniqueVisitors(shortCode);
    console.log("uniqueVisitors::", this.uniqueVisitors)
    return this.uniqueVisitors ?? []
  }

  private initializeMap(): void {
    if (!this.mapContainer) return;

    // Create map (centered world view)
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 6,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    // base tile
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 6,
      opacity: 0.25,
    }).addTo(this.map);

    // Correct path — no leading slash!
    this.http.get('assets/world.geo.json').subscribe({
      next: (geoJson: any) => {
        // Normalize country counts for quick lookup
        const normalized = new Map<string, number>();
        Object.keys(this.countryCounts || {}).forEach((k) =>
          normalized.set(k.toUpperCase(), this.countryCounts[k])
        );

        // Style function for each country
        const styleFn = (feature: any) => {
          const props = feature.properties || {};
          const name = (props.NAME || props.name || props.ADMIN || '').toUpperCase();
          const isoA3 = (props.ISO_A3 || props.iso_a3 || '').toUpperCase();
          const isoA2 = (props.ISO_A2 || props.iso_a2 || '').toUpperCase();

          const count =
            normalized.get(isoA3) ??
            normalized.get(isoA2) ??
            normalized.get(name) ??
            0;

          return {
            weight: 1,
            color: '#cbd5e1', // border color
            fillColor: this.getColorForCount(count),
            fillOpacity: count > 0 ? 0.85 : 0.05,
          };
        };

        // Event handlers for hover + tooltip
        const onEachFeature = (feature: any, layer: L.Layer) => {
          const props = feature.properties || {};
          const name = props.NAME || props.name || props.ADMIN || 'Unknown';
          const isoA3 = props.ISO_A3 || props.iso_a3 || '';
          const isoA2 = props.ISO_A2 || props.iso_a2 || '';
          const keyTry = (isoA3 || isoA2 || name).toUpperCase();
          const count =
            normalized.get(keyTry) ?? normalized.get(name.toUpperCase()) ?? 0;

          layer.bindTooltip(`${name}: ${count}`, {
            sticky: true,
            direction: 'auto',
          });

          (layer as any).on({
            mouseover: (e: any) => {
              const target = e.target;
              if (target?.setStyle) {
                target.setStyle({ weight: 2, color: '#9aaedc' });
              }
            },
            mouseout: (e: any) => {
              if (this.geoJsonLayer && (this.geoJsonLayer as any).resetStyle) {
                (this.geoJsonLayer as any).resetStyle(e.target);
              }
            },
          });
        };

        // Add GeoJSON layer
        this.geoJsonLayer = L.geoJSON(geoJson, {
          style: styleFn,
          onEachFeature,
        }).addTo(this.map!);

        // Fit to bounds safely
        try {
          const bounds = this.geoJsonLayer.getBounds();
          if (bounds?.isValid()) {
            this.map!.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch (e) {
          console.warn('Bounds fit failed', e);
        }

        // Add legend
        this.addLegendControl();
      },
      error: (err) => {
        console.warn('Could not load world.geo.json — map disabled', err);
      },
    });
  }


  private getColorForCount(count: number): string {
    // simple palette (from light -> dark)
    const palette = ['#eef7fe','#d7ecfb','#bfe0f8','#95c8f2','#5aa8ed','#2f85e7','#1d5fcf','#123f9b'];
    if (!count || count <= 0) return palette[0];
    if (this.maxCount <= 1) return palette[6];
    // log-scale to get better distribution
    const idx = Math.min(palette.length - 1, Math.floor((Math.log(count + 1) / Math.log(this.maxCount + 1)) * (palette.length - 1)));
    return palette[Math.max(0, idx)];
  }

  private addLegendControl(): void {
    if (!this.map) return;

    // Use the Control constructor, not L.control()
    const legend = new L.Control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-legend');
      div.innerHTML = `
      <div style="font-size:0.8rem;color:#475569;margin-bottom:6px">Clicks</div>
      <div style="display:flex;gap:6px;align-items:center">
        ${[0, 1, 2, 3, 4]
        .map(
          i => `<span style="display:inline-block;width:18px;height:12px;background:${this.getColorForCount(
            Math.round(this.maxCount * i / 4)
          )};border-radius:3px"></span>`
        )
        .join('')}
        <span style="margin-left:8px;color:#475569;font-size:0.8rem">${this.maxCount || 0} max</span>
      </div>
    `;
      return div;
    };

    legend.addTo(this.map);
  }

  // --- Timestamp parsing helpers ---
  public parseTimestampToDate(value: TimestampLike | undefined | null): Date | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object' && typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate();
      } catch {
        // fall-through
      }
    }

    if (
      typeof value === 'object' && typeof (value as any).seconds === 'number' &&
      typeof (value as any).nanoseconds === 'number'
    ) {
      const ts = value as { seconds: number; nanoseconds: number };
      return new Date(ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6));
    }

    if (
      typeof value === 'object' && typeof (value as any)._seconds === 'number' &&
      typeof (value as any)._nanoseconds === 'number'
    ) {
      const legacyTs = value as { _seconds: number; _nanoseconds: number };
      return new Date(legacyTs._seconds * 1000 + Math.floor(legacyTs._nanoseconds / 1e6));
    }

    if (typeof value === 'number') {
      return value < 1e12 ? new Date(value * 1000) : new Date(value);
    }

    if (typeof value === 'string') {
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
        return this.parseTimestampToDate(numericValue);
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  public formatTimestamp(value?: TimestampLike | null, formatPattern = 'dd/MM/yyyy, HH:mm:ss'): string {
    const dateObject = this.parseTimestampToDate(value);
    return dateObject ? this.datePipe.transform(dateObject, formatPattern) || '' : '—';
  }

  public getShortUrlHref(): string | null {
    if (!this.shortUrl) return null;
    return `${this.apiUrl}/${this.shortUrl.shortCode}`;
  }

  public copyShortUrlToClipboard(): void {
    const shortUrlHref = this.getShortUrlHref();
    if (!shortUrlHref) return;

    this.isCopyingShortUrl = true;
    this.clipboardService.copy(shortUrlHref);

    setTimeout(() => {
      this.isCopyingShortUrl = false;
    }, 800);
  }

  public editLink(): void {
    this.dialogReference.close({ action: 'edit', shortUrl: this.shortUrl });
  }

  public deleteLink(): void {
    this.dialogReference.close({ action: 'delete', id: this.shortUrl.shortCode });
  }

  public openLinkDashboardInNewTab(): void {
    const dashboardRoute = `/dashboard`;
    window.open(dashboardRoute, '_blank');
  }

  public connectToTelegramIntegration(): void {
    console.log('User requested Telegram connection for link:', this.shortUrl?.id);
  }

  // --- Computed helpers for UI ---

  public getClicksCount(): number {
    const clickCountValue = this.shortUrl?.clickCount;
    if (typeof clickCountValue === 'number') {
      return clickCountValue;
    }
    return -1;
  }

  public getUniqueClicksCount(): number {
    const uniqueClicksValue = this.shortUrl?.uniqueClicks;
    if (typeof uniqueClicksValue === 'number') {
      return uniqueClicksValue;
    }
    return -1;
  }

  public getDeviceStatCount(deviceKind: 'desktop' | 'mobile' | 'tablet'): number {
    if (!this.shortUrl?.deviceStats) return 0;
    const deviceStatsObject = this.shortUrl.deviceStats as Record<string, number>;
    return deviceStatsObject[deviceKind] || 0;
  }

  // --- Table helpers ---
  public applyVisitorFilter(filterValue: string): void {
    this.visitorTableDataSource.filter = filterValue?.trim().toLowerCase() || '';
  }

  public getVisitorDeviceDisplay(visitor: UniqueVisitor): string {
    return (visitor.deviceType || []).join(', ');
  }

  public getVisitorLocationDisplay(visitor: UniqueVisitor): string {
    const cityPart = visitor.city ? `${visitor.city}` : '';
    const countryPart = visitor.country ? ` (${visitor.country})` : '';
    return `${cityPart}${countryPart}`.trim() || '—';
  }

  public ngOnDestroy(): void {
    try {
      if (this.map) {
        this.map.remove();
        this.map = undefined;
      }
    } catch (err) {
      // ignore cleanup errors
    }
  }

}
