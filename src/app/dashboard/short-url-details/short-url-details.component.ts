import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DatePipe, NgIf, NgForOf} from '@angular/common';
import {ShortUrl, UniqueVisitor} from '@innkie/shared-models';
import {environment} from '../../../environments/environment';
import {ShortUrlService} from '../../shared/services/short-url.service';
import {LoadingService} from '../../shared/services/loading.service';

import { HttpClient, } from '@angular/common/http';
import * as L from 'leaflet';
import {TimeAgoPipe} from '../../shared/services/time-ago.pipe';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';

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
  imports: [
    NgIf,
    NgForOf,
    TimeAgoPipe,
    BaseChartDirective
  ]
})
export class ShortUrlDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  shortUrl!: ShortUrl;
  uniqueVisitors: any = [];
  filteredVisitors: any = [];
  isCopyingShortUrl = false;
  hasNoVisitors = false;
  apiUrl = environment.appUrl;

  // Chart Properties
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'Clicks',
        backgroundColor: 'rgba(74, 108, 247, 0.2)',
        borderColor: '#4a6cf7',
        pointBackgroundColor: '#4a6cf7',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4a6cf7',
        fill: 'origin',
        tension: 0.4
      }
    ],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: { stepSize: 1 }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  public lineChartType: 'line' = 'line';
  public selectedRange: number = 7;

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;
  private map?: L.Map
  private geoJsonLayer?: L.GeoJSON;
  countryCounts: Record<string, number> = {};
  totalClicks = 0;
  maxCount = 0;

  constructor(
    private datePipe: DatePipe,
    private shortUrlService: ShortUrlService,
    public loadingService: LoadingService,
    private http: HttpClient,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.loadingService.show();

      if (!this.shortUrl) {
        return;
      }

      // Fetch analytics
      await this.loadAnalytics();

      // Await the async visitor fetch
      this.uniqueVisitors = await this.shortUrlService.getUniqueVisitors(this.shortUrl.shortCode) ?? [];
      this.hasNoVisitors = this.uniqueVisitors.length === 0;

      // Prepare country counts
      if (this.shortUrl?.topCountries && Object.keys(this.shortUrl.topCountries).length > 0) {
        this.countryCounts = { ...this.shortUrl.topCountries } as Record<string, number>;
      } else {
        this.countryCounts = this.buildCountsFromVisitors(this.uniqueVisitors);

        console.log('this.countryCounts', this.countryCounts);

      }

      setTimeout(() => this.initializeMap(), 0);

      // Compute totals
      this.totalClicks = this.shortUrl.clickCount as number;
      this.maxCount = Math.max(0, ...Object.values(this.countryCounts));

      this.filteredVisitors = [...this.uniqueVisitors];

    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      this.loadingService.hide();
    }
  }

  async loadAnalytics(days: number = this.selectedRange) {
    this.selectedRange = days;
    try {
      const stats = await this.shortUrlService.getClicksAnalytics(this.shortUrl.shortCode, days);
      this.lineChartData.labels = stats.map((s: any) => s.date);
      this.lineChartData.datasets[0].data = stats.map((s: any) => s.clicks);
    } catch (e) {
      console.error('Failed to load chart data', e);
    }
  }

  exportToCSV() {
    if (!this.uniqueVisitors.length) return;

    const headers = ['IP Address', 'Device', 'City', 'Country', 'First Visit', 'Last Visit', 'Visit Count'];
    const rows = this.uniqueVisitors.map((v: any) => [
      v.ipAddress,
      (v.deviceType || []).join('/'),
      v.city || 'Unknown',
      v.country || 'Unknown',
      this.formatTimestamp(v.firstVisitAt),
      this.formatTimestamp(v.lastVisitAt),
      v.visitCount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${this.shortCode}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  get shortCode(): string {
    return this.shortUrl?.shortCode || '';
  }


  public ngAfterViewInit(): void {
  }

  private initializeMap(): void {

    if (!this.mapContainer) {
      return;
    }

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
        console.log('this.countryCounts>>>', this.countryCounts);
        Object.keys(this.countryCounts || {}).forEach((k) => {
            normalized.set(k.toUpperCase(), this.countryCounts[k])
          }
        );

        // Style function for each country
        const styleFn = (feature: any) => {
          const props = feature.properties || {};
          const name = (props.name || props.NAME || props.ADMIN || '').toUpperCase();
          const count = normalized.get(name) ?? 0;


          if (name === 'GHANA') console.log('🟢 Ghana matched with count =', count);

          return {
            weight: 1,
            color: '#cbd5e1',
            fillColor: this.getColorForCount(count),
            fillOpacity: count > 0 ? 0.85 : 0.05,
          };
        };

        // Tooltip + hover behavior
        const onEachFeature = (feature: any, layer: L.Layer) => {
          const props = feature.properties || {};
          const name = (props.name || props.NAME || props.ADMIN || '').toUpperCase();
          const count = normalized.get(name) ?? 0;

          layer.bindTooltip(`${props.name}: ${count}`, { sticky: true });

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
    if (!shortUrlHref) {
      return;
    }

    this.isCopyingShortUrl = true;
    navigator.clipboard.writeText(shortUrlHref).then(() => {
      setTimeout(() => {
        this.isCopyingShortUrl = false;
      }, 800);
    });
  }

  public editLink(): void {
    console.log('editLink');
  }

  public deleteLink(): void {
    console.log('deleteLink');
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
  public applyVisitorFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value?.trim().toLowerCase() || '';
    this.filteredVisitors = this.uniqueVisitors.filter((v: any) =>
      v.ipAddress?.toLowerCase().includes(filterValue) ||
      v.city?.toLowerCase().includes(filterValue) ||
      v.country?.toLowerCase().includes(filterValue) ||
      (v.deviceType || []).join(' ').toLowerCase().includes(filterValue)
    );
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

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}
