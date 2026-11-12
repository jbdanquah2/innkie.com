/** Resize geometry. Pure, so the crop and scaling rules can be tested without a browser. */

export const MAX_SIDE = 16384;
export const MAX_AREA = 67_108_864;

export interface SrcRect { x: number; y: number; width: number; height: number }

/** The part of the source that fills the target shape: the full image, or a centred crop ("cover"). */
export function sourceRect(srcW: number, srcH: number, dstW: number, dstH: number, mode: 'crop' | 'stretch'): SrcRect {
  if (mode === 'stretch') return { x: 0, y: 0, width: srcW, height: srcH };
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = Math.min(srcW, dstW / scale);
  const height = Math.min(srcH, dstH / scale);
  return { x: (srcW - width) / 2, y: (srcH - height) / 2, width, height };
}

/**
 * The sizes to draw through when making an image much smaller. Halving at each step keeps detail that a single big
 * jump would turn into jagged edges. The last size is always the target.
 */
export function stepSizes(srcW: number, srcH: number, dstW: number, dstH: number): { width: number; height: number }[] {
  const steps: { width: number; height: number }[] = [];
  let w = srcW;
  let h = srcH;
  while (w / 2 > dstW && h / 2 > dstH) {
    w = Math.ceil(w / 2);
    h = Math.ceil(h / 2);
    steps.push({ width: w, height: h });
  }
  steps.push({ width: dstW, height: dstH });
  return steps;
}

export function validateSize(w: number, h: number): string | null {
  if (!w || !h) return 'Enter a width and a height.';
  if (w > MAX_SIDE || h > MAX_SIDE) return `Each side can be at most ${MAX_SIDE.toLocaleString('en-US')} pixels.`;
  if (w * h > MAX_AREA) return 'That is more pixels than a browser can draw. Choose a smaller size.';
  return null;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** "16:9" for common shapes; otherwise a decimal ratio like "1.91:1". */
export function ratioLabel(w: number, h: number): string {
  if (!w || !h) return '';
  const g = gcd(w, h);
  const a = w / g;
  const b = h / g;
  if (a <= 32 && b <= 32) return `${a}:${b}`;
  return w >= h ? `${(w / h).toFixed(2)}:1` : `1:${(h / w).toFixed(2)}`;
}

export interface Preset { id: string; label: string; width: number; height: number }

/** Sizes people ask for most. Platforms change their guidance now and then, so check the current one when it matters. */
export const PRESETS: Preset[] = [
  { id: 'square', label: 'Square post', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait post', width: 1080, height: 1350 },
  { id: 'story', label: 'Story or Reel', width: 1080, height: 1920 },
  { id: 'wide', label: 'Wide post', width: 1200, height: 675 },
  { id: 'og', label: 'Link preview', width: 1200, height: 630 },
  { id: 'youtube', label: 'YouTube thumbnail', width: 1280, height: 720 },
  { id: 'linkedin', label: 'LinkedIn banner', width: 1584, height: 396 },
  { id: 'hd', label: 'Full HD', width: 1920, height: 1080 },
  { id: 'uhd', label: '4K', width: 3840, height: 2160 },
  { id: 'icon', label: 'App icon', width: 512, height: 512 },
];

/** A percentage of the original size, keeping the shape. */
export function scaledSize(origW: number, origH: number, percent: number): { width: number; height: number } {
  return { width: Math.max(1, Math.round((origW * percent) / 100)), height: Math.max(1, Math.round((origH * percent) / 100)) };
}
