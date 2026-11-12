import { sourceRect, stepSizes } from './resize';

/**
 * Draws the chosen part of a bitmap at the target size onto a new canvas. It asks the browser for a high-quality
 * resize in one call, and falls back to halving step by step, which keeps edges clean for big reductions.
 */
export async function renderResized(bitmap: ImageBitmap, dstW: number, dstH: number, mode: 'crop' | 'stretch', background?: string): Promise<HTMLCanvasElement> {
  const src = sourceRect(bitmap.width, bitmap.height, dstW, dstH, mode);
  const out = document.createElement('canvas');
  out.width = dstW;
  out.height = dstH;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, dstW, dstH); }

  try {
    const resized = await createImageBitmap(bitmap, Math.round(src.x), Math.round(src.y), Math.max(1, Math.round(src.width)), Math.max(1, Math.round(src.height)), { resizeWidth: dstW, resizeHeight: dstH, resizeQuality: 'high' });
    ctx.drawImage(resized, 0, 0, dstW, dstH);
    resized.close();
    return out;
  } catch {
    // fall through to the canvas route
  }

  let current: CanvasImageSource = bitmap;
  let sx = src.x, sy = src.y, sw = src.width, sh = src.height;
  const steps = stepSizes(Math.round(sw), Math.round(sh), dstW, dstH);
  for (let i = 0; i < steps.length - 1; i++) {
    const c = document.createElement('canvas');
    c.width = steps[i].width;
    c.height = steps[i].height;
    const cx = c.getContext('2d')!;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(current, sx, sy, sw, sh, 0, 0, c.width, c.height);
    current = c; sx = 0; sy = 0; sw = c.width; sh = c.height;
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, sx, sy, sw, sh, 0, 0, dstW, dstH);
  return out;
}
