/** Small pure helpers shared by the image tools: file names, extensions and fitting sizes. */

/** The file name without its last extension: "my.photo.v2.png" -> "my.photo.v2". */
export function baseName(fileName: string): string {
  const name = fileName.split(/[\\/]/).pop() ?? fileName;
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};

export function extForMime(mime: string): string {
  return EXT[mime.toLowerCase()] ?? (mime.split('/')[1]?.split('+')[0] || 'bin');
}

/**
 * Makes names unique within one batch by numbering repeats ("photo.jpg", "photo-2.jpg"), so a ZIP never
 * overwrites one file with another. Comparison ignores case, as many file systems do.
 */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    let n = 1;
    while (used.has(candidate.toLowerCase())) {
      n++;
      const dot = name.lastIndexOf('.');
      candidate = dot > 0 ? `${name.slice(0, dot)}-${n}${name.slice(dot)}` : `${name}-${n}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

/**
 * The size an image should be scaled to so it fits inside maxWidth x maxHeight, keeping its proportions and never
 * enlarging it. Either limit may be missing.
 */
export function fitWithin(width: number, height: number, maxWidth?: number, maxHeight?: number): { width: number; height: number; scaled: boolean } {
  const sw = maxWidth && maxWidth > 0 ? maxWidth / width : Infinity;
  const sh = maxHeight && maxHeight > 0 ? maxHeight / height : Infinity;
  const scale = Math.min(sw, sh, 1);
  if (scale >= 1) return { width, height, scaled: false };
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scaled: true };
}

/** The input types the browser can re-encode faithfully. Others (animated GIF, SVG, ...) would lose something. */
export const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp'];

export function describeUnsupported(file: { name: string; type: string }): string | null {
  const t = file.type.toLowerCase();
  if (COMPRESSIBLE.includes(t)) return null;
  if (t === 'image/gif') return `${file.name}: GIFs can be animated, and compressing would keep only the first frame.`;
  if (t === 'image/svg+xml') return `${file.name}: SVG is already a compact vector format. Use the SVG to PNG tool if you need a raster image.`;
  if (t.startsWith('image/')) return `${file.name}: ${t.replace('image/', '').toUpperCase()} images are not supported here. Use JPG, PNG or WebP.`;
  return `${file.name}: this is not an image.`;
}

export function percentSaved(before: number, after: number): number {
  return before > 0 ? Math.round(((before - after) / before) * 100) : 0;
}

/** Removes characters that are not allowed in file names on common systems, and keeps the part to a sensible length. */
export function sanitizeFilePart(text: string): string {
  return text.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/^\.+/, '').slice(0, 60);
}

/** prefix + name + suffix + extension, with the parts made safe for a file name. */
export function buildFileName(base: string, parts: { prefix?: string; suffix?: string; ext: string }): string {
  const name = sanitizeFilePart(base) || 'image';
  return `${sanitizeFilePart(parts.prefix ?? '')}${name}${sanitizeFilePart(parts.suffix ?? '')}.${parts.ext}`;
}
