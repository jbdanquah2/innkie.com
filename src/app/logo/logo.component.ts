import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/" class="inline-flex items-center gap-2 group decoration-transparent">
      <img [src]="logoUrl" [style.width]="size" [style.height]="size" 
           alt="iNNkie Logo" 
           class="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 object-contain" />
      <span *ngIf="showText" class="text-xl font-black tracking-tight text-slate-900 italic group-hover:text-primary-600 transition-colors">iNNkie</span>
    </a>
  `
})
export class LogoComponent {
  @Input() size: string = '40px';
  @Input() showText: boolean = false;
  
  logoUrl = 'assets/logos/logo.png';
}
