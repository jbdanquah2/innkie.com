import { QUALITY, embedSize, type Quality } from './pdf-layout';

export interface PreparedImage { bytes: Uint8Array; width: number; height: number }

/**
 * Decodes an image with the browser (so EXIF rotation from phones and cameras is applied), turns it by the chosen
 * quarter turns, scales it to the quality limit, and encodes a JPEG on a white background (JPEG has no transparency).
 * Embedding these bytes gives a PDF that shows the image the right way up and without distortion.
 */
export async function prepareImage(file: Blob, rotation: number, quality: Quality): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const { width, height } = embedSize(bitmap.width, bitmap.height, rotation, quality);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const turned = rotation % 180 !== 0;
    const dw = turned ? height : width;
    const dh = turned ? width : height;
    ctx.drawImage(bitmap, -dw / 2, -dh / 2, dw, dh);
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed'))), 'image/jpeg', QUALITY[quality].jpeg));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
  } finally {
    bitmap.close();
  }
}

/** The size an image displays at (after EXIF rotation), or null if the browser cannot read the file. */
export async function readDimensions(file: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const d = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return d;
  } catch {
    return null;
  }
}
