/** Page-range parsing and sizing for the PDF tools. Pure, so it can be tested without a browser. */

export interface RangeResult { pages: number[]; error?: string }

/**
 * Parses "1-3, 5, 8-" into page numbers. Ranges may be open-ended ("8-" means to the last page), separators are
 * commas or spaces, and the result is sorted without duplicates. Anything out of range is an error.
 */
export function parsePageRange(text: string, total: number): RangeResult {
  // People write "1 - 3"; treat spaces around a dash as part of the range.
  const cleaned = text.trim().replace(/\s*([-\u2013\u2014])\s*/g, '$1');
  if (!cleaned) return { pages: [] };
  const set = new Set<number>();
  for (const token of cleaned.split(/[,\s;]+/).filter(Boolean)) {
    const m = /^(\d+)(?:\s*[-–—]\s*(\d*))?$/.exec(token);
    if (!m) return { pages: [], error: `"${token}" is not a page number or a range. Use something like 1-3, 5.` };
    const a = Number(m[1]);
    const hasDash = token.includes('-') || token.includes('–') || token.includes('—');
    const b = hasDash ? (m[2] === '' || m[2] === undefined ? total : Number(m[2])) : a;
    if (a < 1 || b < 1) return { pages: [], error: 'Pages start at 1.' };
    if (a > total) return { pages: [], error: `Page ${a} does not exist: this PDF has ${total} page${total === 1 ? '' : 's'}.` };
    if (b > total) return { pages: [], error: `Page ${b} does not exist: this PDF has ${total} page${total === 1 ? '' : 's'}.` };
    if (b < a) return { pages: [], error: `${a}-${b} runs backwards. Write it as ${b}-${a}.` };
    for (let p = a; p <= b; p++) set.add(p);
  }
  return { pages: [...set].sort((x, y) => x - y) };
}

/** [1,2,3,5,8,9] -> "1-3, 5, 8-9". */
export function formatPageRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j === i ? String(sorted[i]) : j === i + 1 ? `${sorted[i]}, ${sorted[j]}` : `${sorted[i]}-${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(', ');
}

/** "report-page-07.png": the page number is padded to the width of the last page so files sort correctly. */
export function pageFileName(base: string, page: number, total: number, ext: string): string {
  const width = String(total).length;
  return `${base}-page-${String(page).padStart(width, '0')}.${ext}`;
}

/**
 * The scale to render a page at, reduced if the result would be too large for a browser canvas.
 * pageWidth and pageHeight are in PDF points (1/72 inch), which is the size at scale 1.
 */
export function fitScale(pageWidth: number, pageHeight: number, scale: number, limits = { maxSide: 16384, maxArea: 67_108_864 }): { scale: number; reduced: boolean } {
  let s = scale;
  if (pageWidth * s > limits.maxSide) s = limits.maxSide / pageWidth;
  if (pageHeight * s > limits.maxSide) s = Math.min(s, limits.maxSide / pageHeight);
  if (pageWidth * pageHeight * s * s > limits.maxArea) s = Math.min(s, Math.sqrt(limits.maxArea / (pageWidth * pageHeight)));
  s = Math.floor(s * 1000) / 1000;
  return { scale: s, reduced: s < scale - 1e-9 };
}

/** Scale 1 is 72 pixels per inch of page, the PDF's own unit. */
export const dpiForScale = (scale: number) => Math.round(scale * 72);
