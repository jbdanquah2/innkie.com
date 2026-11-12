import { fitWithin } from './image-tools';

export interface SizeSearch { quality: number; size: number; met: boolean }

/**
 * Finds the highest quality (up to maxQuality) whose output is no bigger than `target` bytes, by bisection.
 * `sizeAt` encodes at a quality and reports the byte size. If even the lowest quality is too big, `met` is false.
 */
export async function searchQuality(sizeAt: (quality: number) => Promise<number>, target: number, maxQuality: number, minQuality = 0.1, steps = 6): Promise<SizeSearch> {
  const top = await sizeAt(maxQuality);
  if (top <= target) return { quality: maxQuality, size: top, met: true };
  const bottom = await sizeAt(minQuality);
  if (bottom > target) return { quality: minQuality, size: bottom, met: false };
  let best: SizeSearch = { quality: minQuality, size: bottom, met: true };
  let lo = minQuality;
  let hi = maxQuality;
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    const size = await sizeAt(mid);
    if (size <= target) { best = { quality: mid, size, met: true }; lo = mid; } else hi = mid;
  }
  return best;
}

export type OutType = 'image/jpeg' | 'image/webp' | 'image/png';

export interface CompressOptions {
  type: OutType;
  /** 0 to 1. Ignored for PNG, which is lossless. */
  quality: number;
  allowResize: boolean;
  maxWidth?: number;
  maxHeight?: number;
  /** Largest acceptable output in bytes. */
  targetBytes?: number;
  /** JPEG cannot hold transparency, so transparent areas are filled with this colour. White by default. */
  background?: string;
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  /** The type the browser really produced. It can differ from the request (for example Safari cannot encode WebP). */
  type: string;
  /** A size limit was set but could not be reached. */
  limitMissed: boolean;
}

/**
 * Re-encodes an image in the browser. It decodes with the browser's own decoder (so EXIF rotation is applied and a
 * damaged file fails cleanly), draws onto a canvas, and encodes again, which also drops all metadata.
 */
export async function compressImage(file: Blob, o: CompressOptions, onProgress?: (pct: number) => void): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    onProgress?.(15);
    let { width, height } = o.allowResize ? fitWithin(bitmap.width, bitmap.height, o.maxWidth, o.maxHeight) : { width: bitmap.width, height: bitmap.height };

    const draw = (w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available');
      if (o.type === 'image/jpeg') { ctx.fillStyle = o.background ?? '#ffffff'; ctx.fillRect(0, 0, w, h); } // JPEG has no transparency
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, w, h);
      return canvas;
    };
    const encode = (canvas: HTMLCanvasElement, q: number) =>
      new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), o.type, o.type === 'image/png' ? undefined : q));

    let canvas = draw(width, height);
    onProgress?.(40);
    let blob = await encode(canvas, o.quality);
    let limitMissed = false;

    if (o.targetBytes && blob.size > o.targetBytes) {
      const target = o.targetBytes;
      limitMissed = true;
      for (let attempt = 0; attempt < 8; attempt++) {
        if (o.type === 'image/png') {
          blob = await encode(canvas, 1);
        } else {
          const r = await searchQuality(async (q) => (await encode(canvas, q)).size, target, o.quality);
          blob = await encode(canvas, r.quality);
        }
        if (blob.size <= target) { limitMissed = false; break; }
        if (!o.allowResize || Math.min(width, height) < 64) break;
        width = Math.max(1, Math.round(width * 0.85));
        height = Math.max(1, Math.round(height * 0.85));
        canvas = draw(width, height);
        onProgress?.(40 + attempt * 7);
      }
    }
    onProgress?.(100);
    return { blob, width, height, type: blob.type || o.type, limitMissed };
  } finally {
    bitmap.close();
  }
}
