import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { AppUser } from '@innkie/shared-models';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="space-y-8 animate-fadeIn">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Command Center</h1>
          <p class="text-slate-500 font-medium mt-1">Real-time overview of your link ecosystem.</p>
        </div>
        <div class="hidden sm:flex gap-2">
           <div class="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-2">
             <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             Live Data
           </div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm">
              <i class="fas fa-link"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Links</p>
              <h3 class="text-2xl font-black text-slate-800">{{ totalLinks }}</h3>
            </div>
          </div>
        </div>

        <div class="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-sm">
              <i class="fas fa-mouse-pointer"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clicks</p>
              <h3 class="text-2xl font-black text-slate-800">{{ totalClicks }}</h3>
            </div>
          </div>
        </div>

        <div class="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm">
              <i class="fas fa-bolt"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Conversion</p>
              <h3 class="text-2xl font-black text-slate-800">{{ avgClicksPerLink | number:'1.1-1' }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chart Area -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[450px]">
        <div class="flex justify-between items-center mb-8">
          <h3 class="text-lg font-bold text-slate-800 tracking-tight">Traffic Trajectory</h3>
          <select class="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-500 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option>Last 30 Days</option>
          </select>
        </div>

        <div class="h-[350px] relative">
          <canvas baseChart
            [data]="lineChartData"
            [options]="lineChartOptions"
            [type]="'line'">
          </canvas>
          
          <!-- Empty State for Chart -->
          <div *ngIf="noData" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
             <div class="text-center">
               <i class="fas fa-chart-line text-slate-200 text-6xl mb-4"></i>
               <p class="text-slate-400 font-bold">No click data available for this workspace yet.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardOverviewComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);

  totalLinks = 0;
  totalClicks = 0;
  avgClicksPerLink = 0;
  noData = true;

  // Chart Logic
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [{
      data: [],
      label: 'Workspace Clicks',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderColor: '#4f46e5',
      pointBackgroundColor: '#fff',
      pointBorderColor: '#4f46e5',
      pointHoverBackgroundColor: '#4f46e5',
      pointHoverBorderColor: '#fff',
      fill: 'origin',
      tension: 0.4
    }],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.03)' },
        ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' }
      }
    }
  };

  async ngOnInit() {
    // 1. Initial Workspace Data
    this.workspaceService.activeWorkspace$.subscribe(async ws => {
      await this.loadWorkspaceMetrics();
      await this.loadChartData();
    });
  }

  async loadWorkspaceMetrics() {
    const activeWs = this.workspaceService.activeWorkspace;
    const user = this.authService.currentUser as AppUser | null;
    const userId = user?.uid;
    if (!userId) return;

    // Fetch all links to calculate totals
    const links = await this.shortUrlService.getUserShortUrls(userId);
    
    // Scoping
    const wsLinks = links.filter(l => {
       if (activeWs) {
         return l.workspaceId === activeWs.id;
       } else {
         return !l.workspaceId || l.workspaceId === 'personal';
       }
    });
    
    this.totalLinks = wsLinks.length;
    this.totalClicks = wsLinks.reduce((acc, curr) => acc + (curr.clickCount as any || 0), 0);
    this.avgClicksPerLink = this.totalLinks > 0 ? this.totalClicks / this.totalLinks : 0;
  }

  async loadChartData() {
    try {
      const data = await this.workspaceService.getWorkspaceClicksOverTime(30);
      if (data && data.length > 0) {
        this.lineChartData.labels = data.map(d => d.date);
        this.lineChartData.datasets[0].data = data.map(d => d.clicks);
        this.noData = data.every(d => d.clicks === 0);
      } else {
        this.noData = true;
      }
    } catch (error) {
      console.error('Failed to load chart data', error);
      this.noData = true;
    }
  }
}
