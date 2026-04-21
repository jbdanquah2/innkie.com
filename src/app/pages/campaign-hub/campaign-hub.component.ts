import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../shared/services/workspace.service';
import { ShortUrlService } from '../../shared/services/short-url.service';
import { AuthService } from '../../shared/services/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ShortUrl, AppUser } from '@innkie/shared-models';

@Component({
  selector: 'app-campaign-hub',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Campaign Hub</h1>
        <p class="text-slate-500 font-medium mt-1">Group your links by tags and track their performance.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Campaign List -->
        <div class="lg:col-span-4 space-y-4">
           <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div class="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tags</span>
                <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">{{ campaigns.length }}</span>
              </div>
              <div class="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div *ngIf="campaigns.length === 0" class="p-8 text-center text-slate-400 text-sm italic">No tagged links found.</div>
                <button *ngFor="let tag of campaigns" 
                        (click)="selectCampaign(tag)"
                        [class.bg-indigo-600]="selectedTag === tag"
                        [class.text-white]="selectedTag === tag"
                        [class.shadow-lg]="selectedTag === tag"
                        [class.shadow-indigo-200]="selectedTag === tag"
                        class="w-full text-left px-6 py-4 rounded-2xl transition-all group flex items-center justify-between mb-1">
                   <div class="flex items-center gap-3">
                      <i class="fas fa-hashtag text-xs opacity-40"></i>
                      <span class="font-bold text-sm">{{ tag }}</span>
                   </div>
                   <i class="fas fa-chevron-right text-[10px] opacity-0 group-hover:opacity-40 transition-opacity" [class.opacity-100]="selectedTag === tag"></i>
                </button>
              </div>
           </div>

           <!-- Quick Info -->
           <div class="p-6 bg-slate-900 rounded-3xl text-white">
              <h3 class="font-bold text-sm mb-2">Pro Tip</h3>
              <p class="text-xs text-slate-400 leading-relaxed">Adding tags during link creation automatically groups them into campaigns here.</p>
           </div>
        </div>

        <!-- Right: Campaign Analytics -->
        <div class="lg:col-span-8 space-y-6">
           <!-- Empty State -->
           <div *ngIf="!selectedTag" class="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
              <div class="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center text-3xl">
                <i class="fas fa-bullhorn"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-800">Select a Campaign</h3>
                <p class="text-slate-500 max-w-xs mx-auto">Pick a tag from the left to view its aggregate performance across all links.</p>
              </div>
           </div>

           <!-- Campaign Dashboard -->
           <div *ngIf="selectedTag" class="space-y-6 animate-fadeIn">
              <!-- Metrics -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Links in Campaign</p>
                  <h4 class="text-2xl font-black text-slate-900">{{ campaignLinks.length }}</h4>
                </div>
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregate Clicks</p>
                  <h4 class="text-2xl font-black text-indigo-600">{{ campaignTotalClicks }}</h4>
                </div>
              </div>

              <!-- Chart -->
              <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-8">
                  <h3 class="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span class="text-indigo-600">#</span>{{ selectedTag }} Performance
                  </h3>
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                </div>
                
                <div class="h-[300px]">
                   <canvas baseChart
                     [data]="lineChartData"
                     [options]="lineChartOptions"
                     [type]="'line'">
                   </canvas>
                </div>
              </div>

              <!-- Link Breakdown -->
              <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                   <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Performing Links</h3>
                </div>
                <div class="divide-y divide-slate-50">
                   <div *ngFor="let link of campaignLinks" class="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div class="min-w-0 pr-4">
                         <p class="text-sm font-bold text-slate-900 truncate">{{ link.title || link.shortCode }}</p>
                         <p class="text-[10px] font-medium text-slate-400 truncate">{{ link.originalUrl }}</p>
                      </div>
                      <div class="text-right shrink-0">
                         <span class="text-sm font-black text-slate-700">{{ link.clickCount || 0 }}</span>
                         <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Clicks</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class CampaignHubComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private shortUrlService = inject(ShortUrlService);
  private authService = inject(AuthService);

  campaigns: string[] = [];
  selectedTag: string | null = null;
  campaignLinks: ShortUrl[] = [];
  campaignTotalClicks = 0;

  // Chart
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [{
      data: [],
      label: 'Campaign Clicks',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderColor: '#4f46e5',
      pointBackgroundColor: '#fff',
      pointBorderColor: '#4f46e5',
      fill: 'origin',
      tension: 0.4
    }],
    labels: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } },
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
    }
  };

  async ngOnInit() {
    this.workspaceService.activeWorkspace$.subscribe(() => {
      this.loadCampaigns();
    });
  }

  async loadCampaigns() {
    const activeWs = this.workspaceService.activeWorkspace;
    const user = this.authService.currentUser as AppUser | null;
    const userId = user?.uid;
    
    if (!userId) return;

    const allLinks = await this.shortUrlService.getUserShortUrls(userId);
    const wsLinks = allLinks.filter(l => {
       if (activeWs) return l.workspaceId === activeWs.id;
       return !l.workspaceId || l.workspaceId === 'personal';
    });

    const tags = new Set<string>();
    wsLinks.forEach(l => {
      (l.tags || []).forEach(t => tags.add(t));
    });

    this.campaigns = Array.from(tags).sort();
    this.selectedTag = null;
  }

  async selectCampaign(tag: string) {
    this.selectedTag = tag;
    const activeWs = this.workspaceService.activeWorkspace;

    // 1. Fetch aggregate chart data
    const chartData = await this.workspaceService.getCampaignClicksOverTime(tag, 30);

    // 2. Fetch campaign links
    const user = this.authService.currentUser as AppUser | null;
    const userId = user?.uid;
    if (!userId) return;
    
    const allLinks = await this.shortUrlService.getUserShortUrls(userId);
    this.campaignLinks = allLinks.filter(l => {
       const inWs = activeWs ? l.workspaceId === activeWs.id : (!l.workspaceId || l.workspaceId === 'personal');
       return inWs && (l.tags || []).includes(tag);
    }).sort((a, b) => ((b.clickCount as any) || 0) - ((a.clickCount as any) || 0));

    this.campaignTotalClicks = this.campaignLinks.reduce((acc, curr) => acc + (curr.clickCount as any || 0), 0);
    
    // Update chart
    this.lineChartData.labels = chartData.map(d => d.date);
    this.lineChartData.datasets[0].data = chartData.map(d => d.clicks);
  }
}
