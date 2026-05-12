import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TOOL_REGISTRY, UtilityTool } from '../../config/tool-registry';

@Component({
  selector: 'app-related-tools',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mt-20 border-t border-slate-100 pt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="flex items-center gap-3 mb-10">
        <div class="h-8 w-1 bg-primary-600 rounded-full"></div>
        <h2 class="text-2xl font-black text-slate-900 uppercase tracking-widest">Related Utilities</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a *ngFor="let tool of relatedTools" 
           [routerLink]="tool.route"
           class="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
          
          <div [ngClass]="{
            'bg-primary-50 text-primary-600 group-hover:bg-primary-600': tool.color === 'primary',
            'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600': tool.color === 'emerald',
            'bg-blue-50 text-blue-600 group-hover:bg-blue-600': tool.color === 'blue',
            'bg-rose-50 text-rose-600 group-hover:bg-rose-600': tool.color === 'rose',
            'bg-amber-50 text-amber-600 group-hover:bg-amber-600': tool.color === 'amber',
            'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600': tool.color === 'indigo'
          }" class="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
            <i [class]="tool.icon + ' text-xl'"></i>
          </div>

          <div class="min-w-0">
            <h3 class="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{{ tool.name }}</h3>
            <p class="text-slate-500 text-xs font-medium truncate">{{ tool.description }}</p>
          </div>

          <div class="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors px-2">
            <i class="fas fa-chevron-right text-xs"></i>
          </div>
        </a>
      </div>

      <!-- View All Button -->
      <div class="mt-12 text-center">
        <a routerLink="/tools" class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary-600 transition-all group">
          Browse All Utilities <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
        </a>
      </div>
    </div>
  `
})
export class RelatedToolsComponent implements OnInit {
  @Input() category: string = '';
  @Input() excludeId: string = '';
  @Input() maxTools: number = 3;

  relatedTools: UtilityTool[] = [];

  ngOnInit() {
    this.relatedTools = TOOL_REGISTRY
      .filter(t => t.category === this.category && t.id !== this.excludeId)
      .slice(0, this.maxTools);
    
    // Fallback if no specific category tools found (though shouldn't happen)
    if (this.relatedTools.length === 0) {
      this.relatedTools = TOOL_REGISTRY
        .filter(t => t.id !== this.excludeId)
        .slice(0, this.maxTools);
    }
  }
}
