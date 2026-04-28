import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-local-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="{'backdrop-blur-sm bg-white/60': blur()}"
         class="absolute inset-0 flex items-center justify-center z-10 rounded-3xl animate-in fade-in duration-300">
       <div class="flex flex-col items-center gap-3">
         <!-- Premium Spinner -->
         <div class="relative flex items-center justify-center">
            <i class="fas fa-circle-notch animate-spin text-primary-500 text-4xl"></i>
            <div class="absolute w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
         </div>
         
         <p class="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
           {{ message() }}
         </p>
       </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
  `]
})
export class LocalLoaderComponent {
  message = input<string>('Processing...');
  blur = input<boolean>(true);
}
