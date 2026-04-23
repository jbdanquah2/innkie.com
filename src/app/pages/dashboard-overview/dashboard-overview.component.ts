import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { AppUser, ShortUrl } from '@innkie/shared-models';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { environment } from '../../../environments/environment';
import { isLinkInWorkspace } from '../../shared/utils/workspace.utils';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, NgClass, DecimalPipe, DatePipe, BaseChartDirective, RouterLink],
  template: `
    <div class="space-y-10 animate-fadeIn pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
          <p class="text-slate-500 font-medium mt-1">Strategic overview of your link performance.</p>
        </div>
        <div class="flex gap-3">
           <div class="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-bold border border-primary-100 flex items-center gap-2 shadow-sm">
             <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
             Live Insights
           </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a routerLink="/links" class="group p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-100 rounded-[2rem] transition-all flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-primary-600 group-hover:text-white transition-all">
            <i class="fas fa-link"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 leading-none">Manage Links</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Create & Edit</p>
          </div>
        </a>
        <a routerLink="/qr-studio" class="group p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 rounded-[2rem] transition-all flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <i class="fas fa-qrcode"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 leading-none">QR Studio</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Brand Designs</p>
          </div>
        </a>
        <a routerLink="/analytics" class="group p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 rounded-[2rem] transition-all flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 leading-none">Traffic Hub</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Stats</p>
          </div>
        </a>
      </div>
      
      <!-- High Level Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-md relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Workspace Volume</p>
          <div class="flex items-end justify-between relative z-10">
            <div>
              <h3 class="text-4xl font-black tracking-tighter">{{ totalLinks }}</h3>
              <p class="text-xs font-bold text-slate-400 mt-1">Active Links</p>
            </div>
            <i class="fas fa-link text-3xl opacity-20"></i>
          </div>
        </div>

        <div class="card p-8 bg-primary-600 text-white rounded-[2.5rem] shadow-md relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
          <p class="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] mb-4">Engagement</p>
          <div class="flex items-end justify-between relative z-10">
            <div>
              <h3 class="text-4xl font-black tracking-tighter">{{ totalClicks | number }}</h3>
              <p class="text-xs font-bold text-primary-200 mt-1">Total Interactions</p>
            </div>
            <i class="fas fa-mouse-pointer text-3xl opacity-20"></i>
          </div>
        </div>

        <div class="card p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Effectiveness</p>
          <div class="flex items-end justify-between relative z-10">
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-4xl font-black tracking-tighter text-slate-900">{{ avgClicksPerLink | number:'1.1-1' }}</h3>
                @if (conversionTrend) {
                  <span [ngClass]="conversionTrend.isPositive ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-50'" 
                        class="px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border border-current/10">
                    <i class="fas" [ngClass]="conversionTrend.isPositive ? 'fa-arrow-up' : 'fa-minus'"></i>
                    {{ conversionTrend.value }}%
                  </span>
                }
              </div>
              <p class="text-xs font-bold text-slate-500 mt-1">Avg. Clicks Per Link</p>
            </div>
            <i class="fas fa-bolt text-3xl text-emerald-500 opacity-20"></i>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Left: Chart -->
        <div class="lg:col-span-8 space-y-8">
          <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[450px]">
            <div class="flex justify-between items-center mb-10">
              <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Traffic Trajectory</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Click volume over time</p>
              </div>
              <select (change)="onPeriodChange($event)" class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer">
                <option value="7">Last 7 Days</option>
                <option value="30" selected>Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 180 Days</option>
                <option value="365">Last 365 Days</option>
              </select>
            </div>

            <div class="h-[320px] relative">
              <canvas baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="'line'">
              </canvas>
              
              @if (noData) {
                <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
                   <div class="text-center">
                     <i class="fas fa-chart-line text-slate-100 text-7xl mb-4"></i>
                     <p class="text-slate-400 font-black uppercase tracking-widest text-sm">No workspace data yet</p>
                   </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Top Performers -->
        <div class="lg:col-span-4">
          <div class="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full">
            <div class="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 class="font-black text-slate-900 tracking-tight">Top Performers</h3>
              <i class="fas fa-crown text-amber-400"></i>
            </div>
            <div class="divide-y divide-slate-50 flex-grow">
              @if (isLoading) {
                <!-- Skeleton Loader -->
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="px-8 py-5 animate-pulse">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-slate-100 rounded-xl"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-3 bg-slate-100 rounded w-3/4"></div>
                        <div class="h-2 bg-slate-50 rounded w-1/2"></div>
                      </div>
                      <div class="w-8 h-4 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                }
              } @else {
                @if (topLinks.length === 0) {
                  <div class="p-12 text-center text-slate-300 italic text-sm font-medium">No performance data yet.</div>
                }
                @for (link of topLinks; track link.id) {
                  <div class="px-8 py-5 hover:bg-slate-50 transition-colors group cursor-pointer" [routerLink]="['/dashboard/details', link.shortCode]">
                     <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                          <img [src]="link.favicon || '/favicon.ico'" (error)="handleFaviconError($event)" class="w-5 h-5 object-contain" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-black text-slate-800 truncate leading-none">{{ link.title || link.shortCode }}</p>
                          <p class="text-[10px] font-bold text-primary-600 mt-1.5 uppercase tracking-tighter">/{{ link.shortCode }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm font-black text-slate-900 leading-none">{{ $any(link.clickCount) | number }}</p>
                          <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Clicks</p>
                        </div>
                     </div>
                  </div>
                }
              }
            </div>
            <a routerLink="/analytics" class="px-8 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 text-center transition-colors border-t border-slate-50">
              View Detailed Analytics
            </a>
          </div>
        </div>

      </div>

      <!-- Recent Activity -->
      <div class="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
           <div>
             <h3 class="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
             <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest workspace additions</p>
           </div>
           <button routerLink="/links" class="text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">Manage All Links</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th class="px-10 py-4">Link Details</th>
                <th class="px-6 py-4">Short URL</th>
                <th class="px-6 py-4">Created</th>
                <th class="px-6 py-4 text-center">Status</th>
                <th class="px-10 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @if (isLoading) {
                <!-- Table Skeleton -->
                @for (i of [1,2,3]; track i) {
                  <tr class="animate-pulse">
                    <td class="px-10 py-5">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-slate-100 rounded-xl"></div>
                        <div class="space-y-2">
                          <div class="h-3 bg-slate-100 rounded w-32"></div>
                          <div class="h-2 bg-slate-50 rounded w-48"></div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-5"><div class="h-3 bg-slate-100 rounded w-24"></div></td>
                    <td class="px-6 py-5"><div class="h-3 bg-slate-100 rounded w-20"></div></td>
                    <td class="px-6 py-5"><div class="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                    <td class="px-10 py-5"><div class="h-8 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                }
              } @else {
                @if (recentLinks.length === 0) {
                  <tr>
                    <td colspan="5" class="px-10 py-12 text-center text-slate-300 font-medium italic">No links created in this workspace yet.</td>
                  </tr>
                }
                @for (link of recentLinks; track link.id) {
                  <tr class="group hover:bg-slate-50/80 transition-colors">
                    <td class="px-10 py-5">
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                           <img [src]="link.favicon || '/favicon.ico'" (error)="handleFaviconError($event)" class="w-5 h-5 object-contain" />
                         </div>
                         <div class="min-w-0">
                           <p class="text-sm font-black text-slate-800 truncate max-w-[200px]">{{ link.title || 'Untitled Link' }}</p>
                           <p class="text-[10px] text-slate-400 font-medium truncate max-w-[250px] mt-0.5">{{ link.originalUrl }}</p>
                         </div>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-sm font-bold text-primary-600">innk.ie/{{ link.shortCode }}</span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-xs font-bold text-slate-500">{{ $any(link.createdAt)?.toDate() | date:'MMM d, yyyy' }}</span>
                    </td>
                    <td class="px-6 py-5 text-center">
                      <span class="inline-flex px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest"
                            [ngClass]="link.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'">
                        {{ link.isActive ? 'Active' : 'Paused' }}
                      </span>
                    </td>
                    <td class="px-10 py-5 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="copyToClipboard(link.shortCode)" class="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Copy Link">
                          <i class="far fa-copy"></i>
                        </button>
                        <button [routerLink]="['/dashboard/details', link.shortCode]" class="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="View Analytics">
                          <i class="fas fa-chart-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class DashboardOverviewComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  isLoading = true;
  totalLinks = 0;
  totalClicks = 0;
  avgClicksPerLink = 0;
  noData = true;

  topLinks: ShortUrl[] = [];
  recentLinks: ShortUrl[] = [];
  chartPeriod = 30;
  conversionTrend: { value: number, isPositive: boolean } | null = null;

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
    this.workspaceService.activeWorkspace$.subscribe(async ws => {
      await this.loadWorkspaceMetrics();
      await this.loadChartData(this.chartPeriod);
    });
  }

  async loadWorkspaceMetrics() {
    this.isLoading = true;
    const activeWs = this.workspaceService.activeWorkspace;
    const user = this.authService.currentUser as AppUser | null;
    const userId = user?.uid;
    if (!userId) {
      this.isLoading = false;
      return;
    }

    try {
      const links = await this.shortUrlService.getUserShortUrls(userId);
      const wsLinks = links.filter(l => isLinkInWorkspace(l, activeWs));
      
      this.totalLinks = wsLinks.length;
      this.totalClicks = wsLinks.reduce((acc, curr) => acc + (curr.clickCount as any || 0), 0);
      this.avgClicksPerLink = this.totalLinks > 0 ? this.totalClicks / this.totalLinks : 0;

      // Calculate simple trend (7-day link performance vs overall)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentPerformanceLinks = wsLinks.filter(l => {
        const createdAt = (l.createdAt as any)?.toDate();
        return createdAt && createdAt > sevenDaysAgo;
      });

      if (recentPerformanceLinks.length > 0) {
        const recentAvg = recentPerformanceLinks.reduce((acc, curr) => acc + (curr.clickCount as any || 0), 0) / recentPerformanceLinks.length;
        const trendValue = this.avgClicksPerLink > 0 
          ? Math.round(((recentAvg - this.avgClicksPerLink) / this.avgClicksPerLink) * 100)
          : 0;
        this.conversionTrend = {
          value: Math.abs(trendValue),
          isPositive: trendValue >= 0
        };
      }

      // Process Top Performers (Top 5 by clickCount)
      this.topLinks = [...wsLinks]
        .sort((a, b) => ((b.clickCount as any) || 0) - ((a.clickCount as any) || 0))
        .slice(0, 5);

      // Process Recent Activity (Top 5 by createdAt)
      this.recentLinks = wsLinks.slice(0, 5);
    } catch (e) {
      console.error('Failed to load metrics', e);
    } finally {
      this.isLoading = false;
    }
  }

  async loadChartData(days: number) {
    this.chartPeriod = days;
    try {
      const data = await this.workspaceService.getWorkspaceClicksOverTime(days);
      if (data && data.length > 0) {
        this.lineChartData.labels = data.map(d => d.date);
        this.lineChartData.datasets[0].data = data.map(d => d.clicks);
        this.noData = data.every(d => d.clicks === 0);
        // Force chart refresh
        this.lineChartData = { ...this.lineChartData };
      } else {
        this.noData = true;
      }
    } catch (error) {
      console.error('Failed to load chart data', error);
      this.noData = true;
    }
  }

  onPeriodChange(event: any) {
    const days = parseInt(event.target.value, 10);
    this.loadChartData(days);
  }

  copyToClipboard(shortCode: string) {
    const url = `${environment.appUrl}/${shortCode}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toast.success('Link copied to clipboard!');
    });
  }

  handleFaviconError(event: any) {
    event.target.src = '/favicon.ico';
  }
}
