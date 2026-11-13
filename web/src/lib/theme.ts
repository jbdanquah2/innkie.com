// Runtime theming (ported from ThemeService): sets --primary-N channel variables consumed by Tailwind's primary-* colors.
const DEFAULT_COLOR = '#1d2127';

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

/** Text colour (as "r g b") that stays readable on the accent's 600 shade: white, or near-black for light accents. */
export function onPrimaryFor(hex?: string | null): string {
  const rgb = hexToRgb(hex || DEFAULT_COLOR) ?? hexToRgb(DEFAULT_COLOR)!;
  const [r, g, b] = adjust(rgb, -0.1).split(' ').map(Number);
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return 1.05 / (L + 0.05) >= 4.5 ? '255 255 255' : '15 23 42'; // contrast of white on the accent, else dark text
}

/** Reads a primary shade from the live theme (for canvas/SVG code that cannot use Tailwind classes). */
export function themeColor(shade: number, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--primary-${shade}`).trim();
  return v ? `rgb(${v.split(/\s+/).join(',')})` : fallback;
}

export function applyTheme(hex?: string | null) {
  const rgb = hexToRgb(hex || DEFAULT_COLOR) ?? hexToRgb(DEFAULT_COLOR)!;
  const palette: Record<string, string> = {
    '50': adjust(rgb, 0.95), '100': adjust(rgb, 0.9), '200': adjust(rgb, 0.75), '300': adjust(rgb, 0.6), '400': adjust(rgb, 0.3),
    '500': `${rgb.r} ${rgb.g} ${rgb.b}`, '600': adjust(rgb, -0.1), '700': adjust(rgb, -0.2), '800': adjust(rgb, -0.3), '900': adjust(rgb, -0.4), '950': adjust(rgb, -0.5),
  };
  document.documentElement.style.setProperty('--on-primary', onPrimaryFor(hex));
  Object.entries(palette).forEach(([shade, v]) => document.documentElement.style.setProperty(`--primary-${shade}`, v));
}

export const resetTheme = () => applyTheme(DEFAULT_COLOR);

/** A primary shade as #rrggbb, for chart code that appends alpha digits or needs a hex string. */
export function themeHex(shade: number, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--primary-${shade}`).trim();
  const [r, g, b] = v.split(/\s+/).map(Number);
  return [r, g, b].some((n) => !Number.isFinite(n)) ? fallback : `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
