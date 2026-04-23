import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/" class="inline-flex items-center gap-2 group decoration-transparent">
      <svg [style.width]="size" [style.height]="size" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
        <defs>
          <linearGradient [id]="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" [attr.stop-color]="primaryColor" />
            <stop offset="100%" [attr.stop-color]="secondaryColor" />
          </linearGradient>
        </defs>
        
        <!-- Logo Mark -->
        <g [attr.stroke]="'url(#' + gradientId + ')'" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
          <!-- Left Vertical Node (The Source) -->
          <path d="M30 35V70" />
          <!-- Right Vertical Node (The Destination) -->
          <path d="M70 30V65" />
          <!-- The Connection Bridge (The 'N' Swoosh) -->
          <path d="M30 55C30 55 40 35 50 45C60 55 70 35 70 35" stroke-width="10" />
        </g>

        <!-- The Destination Point (i dot) -->
        <circle cx="70" cy="15" r="8" [attr.fill]="primaryColor" />
      </svg>
      <span *ngIf="showText" class="text-xl font-black tracking-tight text-slate-900 italic group-hover:text-primary-600 transition-colors">iNNkie</span>
    </a>
  `
})
export class LogoComponent {
  @Input() size: string = '40px';
  @Input() showText: boolean = false;
  @Input() primaryColor: string = 'rgb(var(--color-primary-600))';
  @Input() secondaryColor: string = 'rgb(var(--color-primary-400))';
  
  gradientId = 'logo-grad-' + Math.random().toString(36).substr(2, 9);
}
