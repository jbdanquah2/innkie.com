/** SVG sizing helpers. They read the SVG text directly, so the result does not depend on which browser loads it. */

const PX_PER: Record<string, number> = { '': 1, px: 1, pt: 96 / 72, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };

export function looksLikeSvg(text: string): boolean {
  return /<svg[\s>]/i.test(text);
}

/** The opening <svg ...> tag, or null. */
export function rootTag(svg: string): string | null {
  const m = /<svg\b[^>]*>/i.exec(svg);
  return m ? m[0] : null;
}

function getAttr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? '') : null;
}

function setAttr(tag: string, name: string, value: string): string {
  const re = new RegExp(`(\\s${name}\\s*=\\s*)("[^"]*"|'[^']*')`, 'i');
  if (re.test(tag)) return tag.replace(re, `$1"${value}"`);
  return tag.replace(/<svg\b/i, `<svg ${name}="${value}"`);
}

/** A CSS length in pixels. Percentages and font-relative units cannot be resolved without a layout, so they give null. */
export function parseLength(v: string | null): number | null {
  if (!v) return null;
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(px|pt|pc|mm|cm|in)?\s*$/i.exec(v);
  if (!m) return null;
  const n = Number(m[1]) * PX_PER[(m[2] ?? '').toLowerCase()];
  return n > 0 && Number.isFinite(n) ? n : null;
}

function parseViewBox(v: string | null): { width: number; height: number } | null {
  if (!v) return null;
  const nums = v.trim().split(/[\s,]+/).map(Number);
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n)) || nums[2] <= 0 || nums[3] <= 0) return null;
  return { width: nums[2], height: nums[3] };
}

export interface Intrinsic { width: number; height: number; source: 'attributes' | 'viewBox' | 'default' }

/**
 * The size the SVG declares for itself. Both width and height win; with one of them, the viewBox supplies the shape;
 * with only a viewBox, that is the size. With nothing, browsers use 300 x 150, and so do we.
 */
export function svgIntrinsicSize(svg: string): Intrinsic {
  const tag = rootTag(svg);
  if (!tag) return { width: 300, height: 150, source: 'default' };
  const w = parseLength(getAttr(tag, 'width'));
  const h = parseLength(getAttr(tag, 'height'));
  const vb = parseViewBox(getAttr(tag, 'viewBox'));
  if (w && h) return { width: w, height: h, source: 'attributes' };
  if (vb) {
    if (w) return { width: w, height: (w * vb.height) / vb.width, source: 'attributes' };
    if (h) return { width: (h * vb.width) / vb.height, height: h, source: 'attributes' };
    return { width: vb.width, height: vb.height, source: 'viewBox' };
  }
  if (w) return { width: w, height: w / 2, source: 'default' };
  if (h) return { width: h * 2, height: h, source: 'default' };
  return { width: 300, height: 150, source: 'default' };
}

export type SizeMode = 'scale' | 'width';

export function outputSize(intrinsic: { width: number; height: number }, o: { mode: SizeMode; scale: number; width: number }): { width: number; height: number } {
  const factor = o.mode === 'width' ? o.width / intrinsic.width : o.scale;
  return { width: Math.max(1, Math.round(intrinsic.width * factor)), height: Math.max(1, Math.round(intrinsic.height * factor)) };
}

/** Browsers refuse canvases that are too large (and some silently produce a blank image), so cap the output. */
export function clampOutput(width: number, height: number, limits = { maxSide: 16384, maxArea: 67_108_864 }): { width: number; height: number; reduced: boolean } {
  let f = 1;
  if (width > limits.maxSide) f = Math.min(f, limits.maxSide / width);
  if (height > limits.maxSide) f = Math.min(f, limits.maxSide / height);
  if (width * height * f * f > limits.maxArea) f = Math.min(f, Math.sqrt(limits.maxArea / (width * height)));
  if (f >= 1) return { width, height, reduced: false };
  return { width: Math.max(1, Math.floor(width * f)), height: Math.max(1, Math.floor(height * f)), reduced: true };
}

/**
 * Returns the SVG with its root width and height set to the output size and a viewBox that keeps the artwork
 * proportional. Loading it at exactly that size makes the browser rasterise the vector at full sharpness.
 */
export function withSize(svg: string, width: number, height: number, intrinsic: { width: number; height: number }): string {
  const tag = rootTag(svg);
  if (!tag) return svg;
  let next = setAttr(tag, 'width', String(width));
  next = setAttr(next, 'height', String(height));
  if (!parseViewBox(getAttr(tag, 'viewBox'))) next = setAttr(next, 'viewBox', `0 0 ${intrinsic.width} ${intrinsic.height}`);
  return svg.replace(tag, next);
}
