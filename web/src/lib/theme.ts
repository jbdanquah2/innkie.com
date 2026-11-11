// Runtime theming (ported from ThemeService): sets --primary-N channel variables consumed by Tailwind's primary-* colors.
const DEFAULT_COLOR = '#4f46e5';

type RGB = { r: number; g: number; b: number };
const hexToRgb = (hex: string): RGB | null => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
};
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const adjust = ({ r, g, b }: RGB, f: number) => {
  const c = (v: number) => clamp(f > 0 ? v + (255 - v) * f : v * (1 + f));
  return `${c(r)} ${c(g)} ${c(b)}`;
};

export function applyTheme(hex?: string | null) {
  const rgb = hexToRgb(hex || DEFAULT_COLOR) ?? hexToRgb(DEFAULT_COLOR)!;
  const palette: Record<string, string> = {
    '50': adjust(rgb, 0.95), '100': adjust(rgb, 0.9), '200': adjust(rgb, 0.75), '300': adjust(rgb, 0.6), '400': adjust(rgb, 0.3),
    '500': `${rgb.r} ${rgb.g} ${rgb.b}`, '600': adjust(rgb, -0.1), '700': adjust(rgb, -0.2), '800': adjust(rgb, -0.3), '900': adjust(rgb, -0.4), '950': adjust(rgb, -0.5),
  };
  Object.entries(palette).forEach(([shade, v]) => document.documentElement.style.setProperty(`--primary-${shade}`, v));
}

export const resetTheme = () => applyTheme(DEFAULT_COLOR);
