import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <div *ngFor="let toast of toasts$ | async; trackBy: trackById"
           class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 animate-in slide-in-from-right-8 duration-300 transition-all"
           [ngClass]="{
             'bg-white border-emerald-100 text-emerald-900 shadow-emerald-200/40': toast.type === 'success',
             'bg-white border-rose-100 text-rose-900 shadow-rose-200/40': toast.type === 'danger',
             'bg-white border-primary-100 text-primary-900 shadow-primary-200/40': toast.type === 'info',
             'bg-white border-amber-100 text-amber-900 shadow-amber-200/40': toast.type === 'warning'
           }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
               [ngClass]="{
                 'bg-emerald-50 text-emerald-600': toast.type === 'success',
                 'bg-rose-50 text-rose-600': toast.type === 'danger',
                 'bg-primary-50 text-primary-600': toast.type === 'info',
                 'bg-amber-50 text-amber-600': toast.type === 'warning'
               }">
            <i class="fas" [ngClass]="{
              'fa-check-circle': toast.type === 'success',
              'fa-exclamation-circle': toast.type === 'danger',
              'fa-info-circle': toast.type === 'info',
              'fa-exclamation-triangle': toast.type === 'warning'
            }"></i>
          </div>
          <p class="text-sm font-bold tracking-tight">{{ toast.message }}</p>
        </div>
        
        <button (click)="remove(toast.id)" class="text-slate-300 hover:text-slate-600 transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  remove(id: string) {
    this.toastService.remove(id);
  }

  trackById(index: number, toast: Toast) {
    return toast.id;
  }
}
