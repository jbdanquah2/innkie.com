import {Component, inject} from '@angular/core';
import {LoadingService} from '../shared/services/loading.service';
import {AsyncPipe, NgIf} from '@angular/common';


@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe
  ],
  template: `
    <div *ngIf="loading$ | async" 
         class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-50/90 backdrop-blur-md transition-all duration-300">
      <div class="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <!-- Spinner -->
        <div class="relative w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin shadow-sm">
        </div>
        
        <!-- Loading Text -->
        <div class="mt-4 font-semibold text-sm text-slate-600 tracking-widest uppercase animate-pulse">
          Loading
        </div>
      </div>
    </div>
  `
})
export class LoadingComponent {
  private loadingService = inject(LoadingService);
  loading$ = this.loadingService.loading$;
}
