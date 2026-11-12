/** Page geometry for building a PDF from images. Pure maths in millimetres, so it can be tested without a browser. */

export type PageSize = 'a4' | 'letter' | 'fit';
export type OrientationMode = 'auto' | 'portrait' | 'landscape';

export const PAGE_MM: Record<'a4' | 'letter', { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

/** Pixels to millimetres at a given resolution (96 is the CSS pixel, which is how screens and browsers size images). */
export const pxToMm = (px: number, dpi = 96) => (px * 25.4) / dpi;

export interface PageDims { width: number; height: number; orientation: 'p' | 'l' }

/**
 * The page for an image. A4 and Letter follow the chosen orientation, where "auto" matches each image's own shape.
 * "Fit to image" makes the page the size of the image plus the margin on every side.
 */
export function pageDims(imgWidth: number, imgHeight: number, size: PageSize, mode: OrientationMode, marginMm: number): PageDims {
  if (size === 'fit') {
    const w = pxToMm(imgWidth) + marginMm * 2;
    const h = pxToMm(imgHeight) + marginMm * 2;
    return { width: round(w), height: round(h), orientation: w > h ? 'l' : 'p' };
  }
  const base = PAGE_MM[size];
  const landscape = mode === 'landscape' || (mode === 'auto' && imgWidth > imgHeight);
  return landscape ? { width: base.h, height: base.w, orientation: 'l' } : { width: base.w, height: base.h, orientation: 'p' };
}

export interface Rect { x: number; y: number; width: number; height: number }

/** The largest rectangle with the image's shape that fits inside the page minus margins, centred. Never distorts. */
export function containRect(page: { width: number; height: number }, imgWidth: number, imgHeight: number, marginMm: number): Rect {
  const availW = Math.max(1, page.width - marginMm * 2);
  const availH = Math.max(1, page.height - marginMm * 2);
  const scale = Math.min(availW / imgWidth, availH / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  return { x: round((page.width - width) / 2), y: round((page.height - height) / 2), width: round(width), height: round(height) };
}

export type Quality = 'original' | 'balanced' | 'small';
export const QUALITY: Record<Quality, { maxSide: number; jpeg: number; label: string; hint: string }> = {
  original: { maxSide: Infinity, jpeg: 0.95, label: 'Original size', hint: 'Full resolution. Largest files.' },
  balanced: { maxSide: 2480, jpeg: 0.85, label: 'Balanced', hint: 'Sharp on a full A4 page (about 300 DPI) at a fraction of the size.' },
  small: { maxSide: 1600, jpeg: 0.7, label: 'Small', hint: 'Best for emailing. Fine for reading on screen.' },
};

/** The pixel size an image will be embedded at: rotated by quarter turns, then scaled down to the quality's limit. */
export function embedSize(width: number, height: number, rotation: number, quality: Quality): { width: number; height: number } {
  const turned = rotation % 180 !== 0;
  const w = turned ? height : width;
  const h = turned ? width : height;
  const limit = QUALITY[quality].maxSide;
  const f = Math.min(1, limit / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * f)), height: Math.max(1, Math.round(h * f)) };
}

const round = (n: number) => Math.round(n * 100) / 100;

export const nextRotation = (r: number) => (r + 90) % 360;
