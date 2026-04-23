import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as L from 'leaflet';

@Component({
  selector: 'app-analytics-hub',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto space-y-10 animate-fadeIn pb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Traffic Hub</h1>
          <p class="text-slate-500 font-medium mt-1">Deep-dive insights across all your workspace channels.</p>
        </div>
        <div class="flex items-center gap-3">
           <div class="hidden sm:flex px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-bold border border-primary-100 items-center gap-2 shadow-sm mr-2">
             <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
             Real-time Sources
           </div>
           <select (change)="onPeriodChange($event)" class="bg-white border-slate-200 border rounded-xl text-xs font-bold text-slate-500 px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer shadow-sm">
             <option value="7">Last 7 Days</option>
             <option value="30" selected>Last 30 Days</option>
             <option value="90">Last 90 Days</option>
             <option value="180">Last 180 Days</option>
             <option value="365">Last 365 Days</option>
           </select>
        </div>
      </div>

      <!-- Geographic Distribution -->
      <div class="card bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div>
             <h3 class="text-xl font-black text-slate-900 tracking-tight">Geographic Hotspots</h3>
             <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global engagement heatmap</p>
           </div>
           <div class="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-400 shadow-sm">Visitor Origin</div>
        </div>
        <div class="h-[500px] z-10 relative">
          <div #mapContainer class="w-full h-full bg-slate-50"></div>

          @if (isLoading) {
            <div class="absolute inset-0 bg-white/90 z-20 flex items-center justify-center">
               <div class="flex flex-col items-center gap-4">
                  <div class="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Updating Heatmap...</p>
               </div>
            </div>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Device Breakdown -->
        <div class="card bg-white p-8 border border-slate-100 shadow-sm rounded-2xl flex flex-col h-full">
           <div class="flex items-center justify-between mb-10">
             <h3 class="text-lg font-black text-slate-900 tracking-tight">Device Mix</h3>
             <i class="fas fa-mobile-alt text-slate-200 text-xl"></i>
           </div>
           <div class="h-[280px] relative flex-grow">
              @if (isLoading) {
                <div class="w-48 h-48 rounded-full border-[16px] border-slate-50 mx-auto animate-pulse flex items-center justify-center mt-4">
                   <div class="w-24 h-24 rounded-full border-[16px] border-slate-100/50"></div>
                </div>
              } @else {
                <canvas baseChart
                  [data]="donutChartData"
                  [options]="donutChartOptions"
                  [type]="'doughnut'">
                </canvas>
              }
           </div>
        </div>

        <!-- Browser Breakdown -->
        <div class="card bg-white p-8 border border-slate-100 shadow-sm rounded-2xl flex flex-col h-full">
           <div class="flex items-center justify-between mb-10">
             <h3 class="text-lg font-black text-slate-900 tracking-tight">Browser Usage</h3>
             <i class="fas fa-compass text-slate-200 text-xl"></i>
           </div>
           <div class="h-[280px] relative flex-grow">
              @if (isLoading) {
                <div class="w-48 h-48 rounded-full border-[16px] border-slate-50 mx-auto animate-pulse flex items-center justify-center mt-4">
                   <div class="w-24 h-24 rounded-full border-[16px] border-slate-100/50"></div>
                </div>
              } @else {
                <canvas baseChart
                  [data]="browserChartData"
                  [options]="donutChartOptions"
                  [type]="'doughnut'">
                </canvas>
              }
           </div>
        </div>

        <!-- Top Referrers -->
        <div class="card bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
           <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 class="text-lg font-black text-slate-900 tracking-tight">Top Sources</h3>
              <i class="fas fa-external-link-alt text-slate-200 text-xl"></i>
           </div>
           <div class="divide-y divide-slate-50 flex-grow overflow-y-auto custom-scrollbar min-h-[300px]">
              @if (isLoading) {
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="px-8 py-5 flex items-center justify-between animate-pulse">
                     <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-slate-100"></div>
                        <div class="w-24 h-3 bg-slate-50 rounded"></div>
                     </div>
                     <div class="w-12 h-4 bg-slate-100 rounded"></div>
                  </div>
                }
              } @else {
                @if (referrers.length === 0) {
                  <div class="p-12 text-center text-slate-300 italic text-sm font-medium">No sources found for this period.</div>
                }
                @for (ref of referrers; track ref.name) {
                  <div class="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-sm group-hover:bg-primary-600 group-hover:text-white transition-colors">
                           <i class="fas fa-globe"></i>
                        </div>
                        <span class="font-black text-sm text-slate-800">{{ ref.name }}</span>
                     </div>
                     <div class="text-right">
                        <span class="text-sm font-black text-slate-900">{{ ref.value | number }}</span>
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Visits</p>
                     </div>
                  </div>
                }
              }
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class AnalyticsHubComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private workspaceService = inject(WorkspaceService);
  private http = inject(HttpClient);

  private map: L.Map | undefined;
  private geoJsonLayer?: L.GeoJSON;
  private cachedGeoJson: any = null;

  referrers: { name: string, value: number }[] = [];
  isLoading = true;
  chartPeriod = 30;
  maxCountryCount = 0;

  // Device Mix Chart
  public donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4f46e5', '#10b981', '#f59e0b'],
      hoverBackgroundColor: ['#4338ca', '#059669', '#d97706'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  // Browser Mix Chart
  public browserChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Chrome', 'Safari', 'Firefox', 'Other'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#3b82f6', '#f43f5e', '#f59e0b', '#94a3b8'],
      hoverBackgroundColor: ['#2563eb', '#e11d48', '#d97706', '#64748b'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 10, weight: 'bold' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 25,
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    }
  };

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(() => {
      this.loadStats(this.chartPeriod);
    });
  }

  async ngAfterViewInit() {
    this.initMap();
    await this.loadStats(this.chartPeriod);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 6,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(this.map);
  }

  private async loadStats(days: number) {
    this.isLoading = true;
    this.chartPeriod = days;
    try {
      const stats = await this.workspaceService.getWorkspaceVisitorStats(days);
      if (!stats) {
        this.isLoading = false;
        return;
      }

      // 1. Update Device Chart
      const dev = stats.devices || {};
      this.donutChartData.datasets[0].data = [
        dev['desktop'] || 0,
        dev['mobile'] || 0,
        dev['tablet'] || 0
      ];
      this.donutChartData = { ...this.donutChartData };

      // 2. Update Browser Chart
      const br = stats.browsers || {};
      this.browserChartData.datasets[0].data = [
        br['Chrome'] || br['chrome'] || 0,
        br['Safari'] || br['safari'] || 0,
        br['Firefox'] || br['firefox'] || 0,
        Object.entries(br).reduce((acc, [k, v]) =>
          !['chrome', 'safari', 'firefox'].includes(k.toLowerCase()) ? acc + (v as number) : acc, 0)
      ];
      this.browserChartData = { ...this.browserChartData };

      // 3. Update Referrers
      this.referrers = Object.entries(stats.referrers || {})
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // 4. Update Map Markers (Heatmap)
      if (this.map && stats.countries) {
        this.updateMapHeatmap(stats.countries);
      }
    } catch (error) {
      console.error('Failed to load traffic stats', error);
    } finally {
      this.isLoading = false;
    }
  }

  private updateMapHeatmap(countries: Record<string, number>) {
    if (!this.map) return;

    this.maxCountryCount = Math.max(0, ...Object.values(countries));

    const applyData = (geoJson: any) => {
      if (this.geoJsonLayer) {
        this.map!.removeLayer(this.geoJsonLayer);
      }

      const normalizedCounts = new Map<string, number>();
      Object.entries(countries).forEach(([k, v]) => normalizedCounts.set(k.toUpperCase(), v));

      const styleFn = (feature: any) => {
        const props = feature.properties || {};
        const name = (props.name || props.NAME || props.ADMIN || '').toUpperCase();
        const count = normalizedCounts.get(name) ?? 0;

        return {
          weight: 1,
          color: '#f1f5f9',
          fillColor: this.getColorForCount(count),
          fillOpacity: count > 0 ? 0.8 : 0.05
        };
      };

      const onEachFeature = (feature: any, layer: L.Layer) => {
        const props = feature.properties || {};
        const name = props.name || props.NAME || props.ADMIN || 'Unknown';
        const count = normalizedCounts.get(name.toUpperCase()) ?? 0;
        layer.bindTooltip(`<div class="font-black text-[10px] uppercase tracking-widest">${name}</div><div class="font-bold text-primary-600">${count} Visitors</div>`, { sticky: true });
      };

      this.geoJsonLayer = L.geoJSON(geoJson, {
        style: styleFn,
        onEachFeature
      }).addTo(this.map!);
    };

    if (this.cachedGeoJson) {
      applyData(this.cachedGeoJson);
    } else {
      this.http.get('assets/world.geo.json').subscribe({
        next: (geoJson: any) => {
          this.cachedGeoJson = geoJson;
          applyData(geoJson);
        },
        error: (err) => console.warn('GeoJSON load failed', err)
      });
    }
  }

  private getColorForCount(count: number): string {
    const palette = ['#eef7fe','#d7ecfb','#bfe0f8','#95c8f2','#5aa8ed','#2f85e7','#1d5fcf','#123f9b'];
    if (!count || count <= 0) return palette[0];
    if (this.maxCountryCount <= 1) return palette[4];
    const idx = Math.min(palette.length - 1, Math.floor((Math.log(count + 1) / Math.log(this.maxCountryCount + 1)) * (palette.length - 1)));
    return palette[idx];
  }

  onPeriodChange(event: any) {
    const days = parseInt(event.target.value, 10);
    this.loadStats(days);
  }

  handleFaviconError(event: any) {
    if (event.target) {
      (event.target as HTMLImageElement).src = '/favicon.ico';
    }
  }
}
