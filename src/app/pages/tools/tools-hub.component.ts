import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { TOOL_REGISTRY, UtilityTool } from '../../shared/config/tool-registry';
import { GUIDE_REGISTRY, Guide } from '../../shared/config/guide-registry';

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, AdSlotComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 pt-24 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header & Search -->
        <div class="text-center max-w-4xl mx-auto mb-16 space-y-8">
          <div class="space-y-4">
            <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Free <span class="text-primary-600">Utilities</span> Hub
            </h1>
            <p class="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              A professional suite of 100% private, browser-side tools for modern digital teams.
            </p>
          </div>

          <!-- Search Bar -->
          <div class="relative max-w-xl mx-auto group">
            <div class="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
              <i class="fas fa-search text-lg"></i>
            </div>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChanged($event)"
              placeholder="Search for a tool (e.g. PDF, Image, JWT)..."
              class="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-lg shadow-xl shadow-slate-200/40"
            />
            <div *ngIf="searchQuery()" class="absolute inset-y-0 right-4 flex items-center">
               <button (click)="clearSearch()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                 <i class="fas fa-times text-xs"></i>
               </button>
            </div>
          </div>

          <!-- Category Pills -->
          <div class="flex flex-wrap justify-center gap-3 pt-4">
            <button 
              (click)="activeCategory.set('all')"
              [class.bg-primary-600]="activeCategory() === 'all'"
              [class.text-white]="activeCategory() === 'all'"
              [class.shadow-xl]="activeCategory() === 'all'"
              [class.shadow-primary-200]="activeCategory() === 'all'"
              class="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-primary-400"
              [class.bg-white]="activeCategory() !== 'all'"
              [class.text-slate-500]="activeCategory() !== 'all'"
            >
              All Tools
            </button>
            <button 
              *ngFor="let cat of categories"
              (click)="activeCategory.set(cat.id)"
              [class.bg-primary-600]="activeCategory() === cat.id"
              [class.text-white]="activeCategory() === cat.id"
              [class.shadow-xl]="activeCategory() === cat.id"
              [class.shadow-primary-200]="activeCategory() === cat.id"
              class="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-primary-400"
              [class.bg-white]="activeCategory() !== cat.id"
              [class.text-slate-500]="activeCategory() !== cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Tool Categories -->
        <div class="space-y-20">
          <ng-container *ngFor="let category of categories">
            <section *ngIf="shouldShowCategory(category.id)" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-1 bg-primary-600 rounded-full"></div>
                  <h2 class="text-xl font-black text-slate-900 uppercase tracking-widest">{{ category.label }}</h2>
                </div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {{ getToolsByCategory(category.id).length }} Tools
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a *ngFor="let tool of getToolsByCategory(category.id)" 
                   [routerLink]="tool.route"
                   class="group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                  
                  <div class="flex justify-between items-start mb-6">
                    <div [ngClass]="{
                      'bg-primary-50 text-primary-600 group-hover:bg-primary-600': tool.color === 'primary',
                      'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600': tool.color === 'emerald',
                      'bg-blue-50 text-blue-600 group-hover:bg-blue-600': tool.color === 'blue',
                      'bg-rose-50 text-rose-600 group-hover:bg-rose-600': tool.color === 'rose',
                      'bg-amber-50 text-amber-600 group-hover:bg-amber-600': tool.color === 'amber',
                      'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600': tool.color === 'indigo'
                    }" class="p-3 rounded-2xl group-hover:text-white transition-all duration-300 shadow-sm">
                      <i [class]="tool.icon + ' text-2xl'"></i>
                    </div>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">{{ tool.name }}</h3>
                  <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">{{ tool.description }}</p>
                  <div class="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest border-t border-slate-50 pt-6 group-hover:gap-3 transition-all">
                    Launch Utility <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
                  </div>
                </a>
              </div>
            </section>
          </ng-container>

          <!-- Empty State -->
          <div *ngIf="filteredTools().length === 0" class="py-20 text-center animate-in zoom-in-95 duration-300">
             <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 text-3xl">
                <i class="fas fa-search"></i>
             </div>
             <h3 class="text-2xl font-black text-slate-900 mb-2">No tools match your search</h3>
             <p class="text-slate-500 font-medium mb-8">Try using different keywords or browse by category.</p>
             <button (click)="clearSearch()" class="px-8 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
               Clear Filter
             </button>
          </div>
        </div>

        <!-- Guides -->
        <section *ngIf="activeCategory() === 'all' && !searchQuery()" class="mt-24">
          <div class="flex items-center gap-3 mb-8">
            <div class="h-8 w-1 bg-primary-600 rounded-full"></div>
            <h2 class="text-xl font-black text-slate-900 uppercase tracking-widest">Guides & How-Tos</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a *ngFor="let guide of guides"
               [routerLink]="['/guides', guide.slug]"
               class="group flex items-center gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-primary-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                <i class="fas fa-book-open text-lg"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{{ guide.category }} · {{ guide.readingTime }}</p>
                <h3 class="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{{ guide.title }}</h3>
              </div>
              <div class="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors pl-2">
                <i class="fas fa-chevron-right text-xs"></i>
              </div>
            </a>
          </div>
        </section>

        <!-- Ad Slot -->
        <div class="mt-20">
          <app-ad-slot slotId="tools_hub_bottom" minHeight="250px"></app-ad-slot>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToolsHubComponent implements OnInit {
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  searchQuery = signal('');
  activeCategory = signal('all');

  categories = [
    { id: 'docs', label: 'Document Utilities' },
    { id: 'media', label: 'Media & Image' },
    { id: 'link', label: 'Links & Web' },
    { id: 'dev', label: 'Developer Utilities' }
  ];

  tools: UtilityTool[] = TOOL_REGISTRY;
  guides: Guide[] = GUIDE_REGISTRY;

  filteredTools = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();

    return this.tools.filter(t => {
      const matchesSearch = !query || 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);
      
      const matchesCategory = cat === 'all' || t.category === cat;

      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit() {
    // Listen for search query parameters (e.g., /tools?q=pdf)
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      if (q) {
        this.searchQuery.set(q);
      }
    });

    const schema = [{
      '@type': 'CollectionPage',
      '@id': 'https://innkie.com/tools#collection',
      'name': 'iNNkie Free Web Utilities & Tools',
      'description': 'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more.',
      'url': 'https://innkie.com/tools',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': this.tools.map((t, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'url': `https://innkie.com${t.route}`,
          'name': t.name
        }))
      }
    }, this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' }
    ])];

    this.seo.updateSeo(
      'Free Online Utilities & Productive Web Tools',
      'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more. All tools run in your browser for maximum privacy.',
      '/tools',
      'assets/preview.png',
      schema
    );
  }

  getToolsByCategory(categoryId: string) {
    return this.filteredTools().filter(t => t.category === categoryId);
  }

  shouldShowCategory(categoryId: string) {
    return this.getToolsByCategory(categoryId).length > 0;
  }

  onSearchChanged(query: string) {
    this.searchQuery.set(query);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.activeCategory.set('all');
  }
}
