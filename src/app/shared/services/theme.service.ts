import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private defaultColor = '#4f46e5'; // Original Indigo-600

  constructor() {
    this.resetTheme();
  }

  applyTheme(hex: string | null | undefined): void {
    const primaryHex = hex || this.defaultColor;
    const palette = this.generatePalette(primaryHex);
    
    Object.entries(palette).forEach(([shade, color]) => {
      document.documentElement.style.setProperty(`--color-primary-${shade}`, color);
    });
  }

  resetTheme(): void {
    this.applyTheme(this.defaultColor);
  }

  private generatePalette(hex: string): Record<string, string> {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return this.generatePalette(this.defaultColor);

    // Simple palette generation (lightening/darkening)
    return {
      '50': this.adjustBrightness(rgb, 0.95),
      '100': this.adjustBrightness(rgb, 0.9),
      '200': this.adjustBrightness(rgb, 0.75),
      '300': this.adjustBrightness(rgb, 0.6),
      '400': this.adjustBrightness(rgb, 0.3),
      '500': `${rgb.r} ${rgb.g} ${rgb.b}`, // Main color
      '600': this.adjustBrightness(rgb, -0.1),
      '700': this.adjustBrightness(rgb, -0.2),
      '800': this.adjustBrightness(rgb, -0.3),
      '900': this.adjustBrightness(rgb, -0.4),
      '950': this.adjustBrightness(rgb, -0.5),
    };
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private adjustBrightness(rgb: { r: number, g: number, b: number }, factor: number): string {
    const r = Math.round(factor > 0 ? rgb.r + (255 - rgb.r) * factor : rgb.r * (1 + factor));
    const g = Math.round(factor > 0 ? rgb.g + (255 - rgb.g) * factor : rgb.g * (1 + factor));
    const b = Math.round(factor > 0 ? rgb.b + (255 - rgb.b) * factor : rgb.b * (1 + factor));
    return `${Math.max(0, Math.min(255, r))} ${Math.max(0, Math.min(255, g))} ${Math.max(0, Math.min(255, b))}`;
  }
}
