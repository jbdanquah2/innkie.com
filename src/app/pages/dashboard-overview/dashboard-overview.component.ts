import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { AppUser, ShortUrl, PlatformUsageEvent } from '@innkie/shared-models';
import { BaseChartDirective } from 'ng2-charts';
import { LocalLoaderComponent } from '../../shared/components/local-loader/local-loader.component';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { environment } from '../../../environments/environment';
import { isLinkInWorkspace } from '@innkie/shared-models';
import { toDateSafe, handleFaviconError as safeHandleFaviconError } from '../../shared/utils/utils.urls';
import { ToastService } from '../../shared/services/toast.service';
import { PlatformMetricsService } from '../../shared/services/platform-metrics.service';
import { skip } from 'rxjs';

import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, NgClass, DecimalPipe, DatePipe, BaseChartDirective, RouterLink, LocalLoaderComponent, AdSlotComponent],
  template: `
    <div class="space-y-10 animate-fadeIn pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
          <p class="text-slate-500 font-medium mt-1">Strategic overview of your workspace performance.</p>
        </div>
        
        <!-- Tab Navigation -->
        <div class="inline-flex p-1 bg-slate-100 rounded-2xl shadow-sm border border-slate-200">
          <button (click)="setTab('links')" 
            [ngClass]="activeTab === 'links' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            Link Center
          </button>
          <button (click)="setTab('platform')" 
            [ngClass]="activeTab === 'platform' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            Platform Utilities
          </button>
        </div>
      </div>

      <!-- Top Dashboard Ad -->
      <app-ad-slot slotId="dashboard_top_subtle" format="horizontal" minHeight="90px"></app-ad-slot>

      @if (activeTab === 'links') {
        <!-- Link Insights -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="card p-8 bg-primary-600 text-white rounded-[2.5rem] shadow-xl shadow-primary-500/10 relative overflow-hidden group">
            <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
            <p class="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] mb-4">Total Engagement</p>
            <div class="flex items-end justify-between relative z-10">
              <div>
                <h3 class="text-4xl font-black tracking-tighter">{{ totalClicks | number }}</h3>
                <p class="text-xs font-bold text-primary-200 mt-1">Click Interactions</p>
              </div>
              <i class="fas fa-mouse-pointer text-3xl opacity-20"></i>
            </div>
          </div>

          <div class="card p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
            <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-slate-100 transition-all"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Link Volume</p>
            <div class="flex items-end justify-between relative z-10">
              <div>
                <h3 class="text-4xl font-black tracking-tighter text-slate-900">{{ totalLinks | number }}</h3>
                <p class="text-xs font-bold text-slate-500 mt-1">Shortened Links</p>
              </div>
              <i class="fas fa-link text-3xl text-primary-600 opacity-20"></i>
            </div>
          </div>

          <div class="card p-8 bg-amber-500 text-white rounded-[2.5rem] shadow-xl shadow-amber-500/10 relative overflow-hidden group">
            <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
            <p class="text-[10px] font-black text-amber-100 uppercase tracking-[0.2em] mb-4">Effectiveness</p>
            <div class="flex items-end justify-between relative z-10">
              <div>
                <h3 class="text-4xl font-black tracking-tighter">{{ avgClicksPerLink | number:'1.1-1' }}</h3>
                <p class="text-xs font-bold text-amber-100 mt-1">Avg. Clicks Per Link</p>
              </div>
              <i class="fas fa-chart-line text-3xl opacity-20"></i>
            </div>
          </div>
        </div>
      } @else {
        <!-- Platform Utility Metrics (Redesign) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Smart Links -->
          <div class="card p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                 <i class="fas fa-link"></i>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart Links</p>
            </div>
            <div class="relative z-10 mt-6">
              <h3 class="text-3xl font-black tracking-tighter text-slate-900">{{ totalLinksShortened | number }}</h3>
              <p class="text-xs font-bold text-slate-500 mt-1">URLs Shortened</p>
            </div>
          </div>

          <!-- QR Studio -->
          <div class="card p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                 <i class="fas fa-qrcode"></i>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">QR Studio</p>
            </div>
            <div class="relative z-10 mt-6">
              <h3 class="text-3xl font-black tracking-tighter text-slate-900">{{ totalQRsGenerated | number }}</h3>
              <p class="text-xs font-bold text-slate-500 mt-1">QRs Generated</p>
            </div>
          </div>

          <!-- Media Optimizer -->
          <div class="card p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                 <i class="fas fa-image"></i>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Media Hub</p>
            </div>
            <div class="relative z-10 mt-6">
              <h3 class="text-3xl font-black tracking-tighter text-slate-900">{{ totalImagesCompressed | number }}</h3>
              <p class="text-xs font-bold text-slate-500 mt-1">Images Processed</p>
            </div>
          </div>

          <!-- Dev Tools -->
          <div class="card p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div class="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                 <i class="fas fa-code"></i>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dev Tools</p>
            </div>
            <div class="relative z-10 mt-6">
              <h3 class="text-3xl font-black tracking-tighter text-slate-900">{{ totalOtherUsage | number }}</h3>
              <p class="text-xs font-bold text-slate-500 mt-1">Utility Actions</p>
            </div>
          </div>

        </div>
      }

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Left: Dynamic Chart -->
        <div [ngClass]="activeTab === 'links' ? 'lg:col-span-8' : 'lg:col-span-12'" class="space-y-8">
          <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[450px]">
            <div class="flex justify-between items-center mb-10">
              <div>
                <h3 class="text-xl font-black text-slate-900 tracking-tight">
                  {{ activeTab === 'links' ? 'Traffic Trajectory' : 'Platform Activity' }}
                </h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {{ activeTab === 'links' ? 'Click volume over time' : 'Multitool usage metrics' }}
                </p>
              </div>
              <select (change)="onPeriodChange($event)" class="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer">
                <option value="7">Last 7 Days</option>
                <option value="30" selected>Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            <div class="h-[320px] relative">
              @defer (on viewport) {
                <canvas baseChart
                  [data]="activeTab === 'links' ? lineChartData : platformChartData"
                  [options]="lineChartOptions"
                  [type]="'line'">
                </canvas>
              } @placeholder {
                <div class="w-full h-full bg-slate-50 animate-pulse rounded-xl"></div>
              }

              @if (isChartLoading) {
                <app-local-loader [message]="activeTab === 'links' ? 'Analyzing Traffic...' : 'Compiling Activity...'"></app-local-loader>
              }

              @if (noData && !isChartLoading && activeTab === 'links') {
                <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
                   <div class="text-center">
                     <i class="fas fa-chart-line text-slate-100 text-7xl mb-4"></i>
                     <p class="text-slate-400 font-black uppercase tracking-widest text-sm">No traffic data yet</p>
                   </div>
                </div>
              }

              @if (noPlatformData && !isChartLoading && activeTab === 'platform') {
                <div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
                   <div class="text-center">
                     <i class="fas fa-rocket text-slate-100 text-7xl mb-4"></i>
                     <p class="text-slate-400 font-black uppercase tracking-widest text-sm">No tool activity yet</p>
                   </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Contextual List -->
        @if (activeTab === 'links') {
          <div class="lg:col-span-4">
            <div class="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full">
              <div class="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <h3 class="font-black text-slate-900 tracking-tight">Top Performers</h3>
                <i class="fas fa-crown text-amber-400"></i>
              </div>
              <div class="divide-y divide-slate-50 flex-grow">
                @if (isLoading) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <div class="px-8 py-5 animate-pulse">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-slate-100 rounded-xl"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-3 bg-slate-100 rounded w-3/4"></div>
                          <div class="h-2 bg-slate-50 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  }
                } @else {
                  @if (topLinks.length === 0) {
                    <div class="p-12 text-center text-slate-300 italic text-sm font-medium">No performance data.</div>
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
        }

      </div>

      <!-- Recent Activity (Unified) -->
      <div class="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
           <div>
             <h3 class="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
             <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest workspace activity across all tools</p>
           </div>
           <button routerLink="/analytics" class="text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">View All Insights</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th class="px-10 py-4">Context</th>
                <th class="px-6 py-4">Action / Identifier</th>
                <th class="px-6 py-4">Timestamp</th>
                <th class="px-6 py-4 text-center">Outcome</th>
                <th class="px-10 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @if (isLoading) {
                @for (i of [1,2,3]; track i) {
                  <tr class="animate-pulse">
                    <td class="px-10 py-5"><div class="h-3 bg-slate-100 rounded w-32"></div></td>
                    <td class="px-6 py-5"><div class="h-3 bg-slate-100 rounded w-48"></div></td>
                    <td class="px-6 py-5"><div class="h-3 bg-slate-100 rounded w-20"></div></td>
                    <td class="px-6 py-5"><div class="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                    <td class="px-10 py-5"><div class="h-8 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                }
              } @else {
                @if (recentActivity.length === 0) {
                  <tr>
                    <td colspan="5" class="px-10 py-12 text-center text-slate-300 font-medium italic">No workspace activity detected.</td>
                  </tr>
                }
                @for (event of recentActivity; track event.id) {
                  <tr class="group hover:bg-slate-50/80 transition-colors">
                    <td class="px-10 py-5">
                      <div class="flex items-center gap-4">
                         <div [ngClass]="{
                            'bg-primary-50 text-primary-600': event.toolType === 'link_shortener',
                            'bg-emerald-50 text-emerald-600': event.toolType === 'qr_studio',
                            'bg-blue-50 text-blue-600': event.toolType === 'image_optimizer',
                            'bg-rose-50 text-rose-600': event.toolType === 'png_to_jpeg',
                            'bg-indigo-50 text-indigo-600': event.toolType === 'svg_to_png',
                            'bg-amber-50 text-amber-600': event.toolType === 'json_formatter' || event.toolType === 'utm_builder'
                         }" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5">
                           <i [ngClass]="{
                             'fas fa-link': event.toolType === 'link_shortener',
                             'fas fa-qrcode': event.toolType === 'qr_studio',
                             'fas fa-file-image': event.toolType === 'image_optimizer',
                             'fas fa-file-export': event.toolType === 'png_to_jpeg',
                             'fas fa-image': event.toolType === 'svg_to_png',
                             'fas fa-code': event.toolType === 'json_formatter',
                             'fas fa-bullhorn': event.toolType === 'utm_builder'
                           }"></i>
                         </div>
                         <div class="min-w-0">
                           <p class="text-sm font-black text-slate-800 truncate max-w-[200px] capitalize">{{ event.toolType.replace('_', ' ') }}</p>
                           <p class="text-[10px] text-slate-400 font-medium truncate max-w-[250px] mt-0.5">Workspace Activity</p>
                         </div>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-700 capitalize">{{ event.action }}</span>
                        @if (event.metadata?.shortCode) {
                          <span class="text-[10px] font-black text-primary-600 uppercase mt-0.5">/{{ event.metadata.shortCode }}</span>
                        } @else if (event.metadata?.bytesSaved) {
                          <span class="text-[10px] font-black text-emerald-600 uppercase mt-0.5">Saved {{ event.metadata.bytesSaved | number }} bytes</span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-xs font-bold text-slate-500">{{ toDateSafe(event.timestamp) | date:'MMM d, h:mm a' }}</span>
                    </td>
                    <td class="px-6 py-5 text-center">
                      <span class="inline-flex px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                        SUCCESS
                      </span>
                    </td>
                    <td class="px-10 py-5 text-right">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (event.toolType === 'link_shortener' && event.metadata?.shortCode) {
                          <button [routerLink]="['/dashboard/details', event.metadata.shortCode]" class="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="View Details">
                            <i class="fas fa-chart-line"></i>
                          </button>
                        }
                        @if (event.toolType === 'qr_studio') {
                          <button routerLink="/qr-studio" class="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="QR Studio">
                            <i class="fas fa-external-link-alt"></i>
                          </button>
                        }
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
  `,
})
export class DashboardOverviewComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private metricsService = inject(PlatformMetricsService);

  currentUser: AppUser | null = null;
  activeTab: 'links' | 'platform' = 'links';
  isLoading = true;
  isChartLoading = false;
  totalLinks = 0;
  totalClicks = 0;
  avgClicksPerLink = 0;
  totalToolActions = 0;

  // Specific Tool Metrics
  totalLinksShortened = 0;
  totalImagesCompressed = 0;
  totalQRsGenerated = 0;
  totalOtherUsage = 0;

  noData = true;
  noPlatformData = true;
  protected readonly toDateSafe = toDateSafe;

  topLinks: ShortUrl[] = [];
  recentActivity: PlatformUsageEvent[] = [];
  chartPeriod = 30;
  conversionTrend: { value: number, isPositive: boolean } | null = null;

  // Track summaries for platform chart
  private platformSummaries: any[] = [];

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

  public platformChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'Tool Actions',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#10b981',
        fill: 'origin',
        tension: 0.4
      },
      {
        data: [],
        label: 'Links Shortened',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
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
      legend: { 
        display: false,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 10, weight: 'bold' },
          padding: 20
        }
      },
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
    this.currentUser = this.authService.currentUser;
    await this.workspaceService.waitForInitialWorkspaces();
    
    this.workspaceService.activeWorkspace$.pipe(skip(1)).subscribe(async ws => {
      await this.loadWorkspaceMetrics();
      await this.loadChartData(this.chartPeriod);
    });

    await this.loadWorkspaceMetrics();
    await this.loadChartData(this.chartPeriod);
  }

  setTab(tab: 'links' | 'platform') {
    this.activeTab = tab;
    
    // Update chart options dynamically to show/hide legend
    this.lineChartOptions = {
      ...this.lineChartOptions,
      plugins: {
        ...this.lineChartOptions.plugins,
        legend: {
          ...this.lineChartOptions.plugins?.legend,
          display: tab === 'platform'
        }
      }
    };

    if (tab === 'platform') {
      this.processPlatformChartData();
    }
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
      const wsLinks = await this.shortUrlService.getUserShortUrls(userId, activeWs?.id);
      this.platformSummaries = await this.metricsService.getWorkspaceSummary(this.chartPeriod);

      // Aggregate Specific Platform Metrics
      this.totalLinksShortened = this.platformSummaries.reduce((acc, curr) => acc + (curr.metrics?.linksShortened || 0), 0);
      this.totalImagesCompressed = this.platformSummaries.reduce((acc, curr) => acc + (curr.metrics?.imagesCompressed || 0), 0);
      this.totalQRsGenerated = this.platformSummaries.reduce((acc, curr) => acc + (curr.metrics?.qrsGenerated || 0), 0);
      this.totalOtherUsage = this.platformSummaries.reduce((acc, curr) => acc + (curr.metrics?.otherToolsUsage || 0), 0);

      this.totalToolActions = this.totalLinksShortened + this.totalImagesCompressed + this.totalQRsGenerated + this.totalOtherUsage;

      this.totalLinks = wsLinks.length;
      this.totalClicks = wsLinks.reduce((acc, curr) => acc + (curr.clickCount as any || 0), 0);
      this.avgClicksPerLink = this.totalLinks > 0 ? this.totalClicks / this.totalLinks : 0;

      // Process Top Performers
      this.topLinks = [...wsLinks]
        .sort((a, b) => ((b.clickCount as any) || 0) - ((a.clickCount as any) || 0))
        .slice(0, 5);

      // Process Recent Activity (Unified)
      this.recentActivity = await this.metricsService.getRecentEvents(10);
      
      if (this.activeTab === 'platform') {
        this.processPlatformChartData();
      }
    } catch (e) {
      console.error('Failed to load metrics', e);
    } finally {
      this.isLoading = false;
    }
  }

  private processPlatformChartData() {
    if (!this.platformSummaries.length) return;
    
    const sorted = [...this.platformSummaries].sort((a, b) => a.date.localeCompare(b.date));
    
    // Dataset 0: Total actions (minus links)
    const toolActions = sorted.map(s => 
      (s.metrics?.imagesCompressed || 0) + (s.metrics?.qrsGenerated || 0) + (s.metrics?.otherToolsUsage || 0)
    );
    
    // Dataset 1: Links shortened
    const linksShortened = sorted.map(s => s.metrics?.linksShortened || 0);
    
    this.platformChartData = {
      labels: sorted.map(s => s.date),
      datasets: [
        { ...this.platformChartData.datasets[0], data: toolActions },
        { ...this.platformChartData.datasets[1], data: linksShortened }
      ]
    };
  }

  async loadChartData(days: number) {
    this.chartPeriod = days;
    this.isChartLoading = true;
    try {
      // Re-fetch summaries for the new period
      this.platformSummaries = await this.metricsService.getWorkspaceSummary(days);
      
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
      
      this.noPlatformData = this.platformSummaries.length === 0 || 
        this.platformSummaries.every(s => 
          (s.metrics?.linksShortened || 0) + (s.metrics?.imagesCompressed || 0) + 
          (s.metrics?.qrsGenerated || 0) + (s.metrics?.otherToolsUsage || 0) === 0
        );

      if (this.activeTab === 'platform') {
        this.processPlatformChartData();
      }
    } catch (error) {
      console.error('Failed to load chart data', error);
      this.noData = true;
    } finally {
      this.isChartLoading = false;
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
    safeHandleFaviconError(event);
  }
}
