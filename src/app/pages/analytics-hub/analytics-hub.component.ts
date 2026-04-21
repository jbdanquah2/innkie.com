import { Component, inject, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as L from 'leaflet';

@Component({
  selector: 'app-analytics-hub',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Traffic Hub</h1>
          <p class="text-slate-500 font-medium mt-1">Deep-dive insights across all your workspace channels.</p>
        </div>
      </div>

      <!-- Geographic Distribution -->
      <div class="card bg-white border border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <h3 class="text-lg font-bold text-slate-800 tracking-tight">Geographic Hotspots</h3>
           <div class="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-400">Visitor Location</div>
        </div>
        <div class="h-[450px] z-10" #mapContainer></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Device Breakdown -->
        <div class="card bg-white p-8 border border-slate-100 shadow-sm rounded-[2.5rem]">
           <div class="flex items-center justify-between mb-8">
             <h3 class="text-lg font-bold text-slate-800 tracking-tight">Device Breakdown</h3>
             <i class="fas fa-mobile-alt text-slate-300"></i>
           </div>
           <div class="h-[300px] relative">
              <canvas baseChart
                [data]="donutChartData"
                [options]="donutChartOptions"
                [type]="'doughnut'">
              </canvas>
           </div>
        </div>

        <!-- Top Referrers -->
        <div class="card bg-white border border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
           <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 class="text-lg font-bold text-slate-800 tracking-tight">Top Sources</h3>
              <i class="fas fa-external-link-alt text-slate-300"></i>
           </div>
           <div class="divide-y divide-slate-50 max-h-[350px] overflow-y-auto custom-scrollbar">
              <div *ngIf="referrers.length === 0" class="p-12 text-center text-slate-400 italic">No referrer data found.</div>
              <div *ngFor="let ref of referrers" class="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                 <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <i class="fas fa-globe"></i>
                    </div>
                    <span class="font-bold text-sm text-slate-700">{{ ref.name }}</span>
                 </div>
                 <div class="text-right">
                    <span class="text-sm font-black text-slate-900">{{ ref.value }}</span>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Visits</p>
                 </div>
              </div>
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

  private map: L.Map | undefined;
  referrers: { name: string, value: number }[] = [];

  // Donut Chart
  public donutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
      hoverBackgroundColor: ['#4f46e5', '#059669', '#d97706'],
      borderWidth: 0
    }]
  };

  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11, weight: 'bold' }, usePointStyle: true, padding: 20 } }
    }
  };

  ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(() => {
      this.loadStats();
    });
  }

  async ngAfterViewInit() {
    this.initMap();
    await this.loadStats();
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
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(this.map);
  }

  private async loadStats() {
    try {
      const stats = await this.workspaceService.getWorkspaceVisitorStats(30);
      if (!stats) return;

      // 1. Update Donut Chart (Devices)
      const dev = stats.devices;
      this.donutChartData.datasets[0].data = [
        dev['desktop'] || 0,
        dev['mobile'] || 0,
        dev['tablet'] || 0
      ];
      // Force chart refresh
      this.donutChartData = { ...this.donutChartData };

      // 2. Update Referrers
      this.referrers = Object.entries(stats.referrers)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value);

      // 3. Update Map Markers
      if (this.map && stats.countries) {
        // Clear old markers (simple way: remove and re-init or track them)
        // For now, let's just place markers for countries
        // Note: In real app, we'd have lat/lng for countries. Using a simple static map for now.
        this.renderMapPoints(stats.countries);
      }
    } catch (error) {
      console.error('Failed to load traffic stats', error);
    }
  }

  private renderMapPoints(countries: Record<string, number>) {
     // Placeholder for rendering country-based circles or heatmap points
     // To keep it simple and avoid massive coordinate lookups here
  }
}
