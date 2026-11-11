export function formatSize(bytes: number): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Zips named blobs and triggers a download. JSZip is loaded on demand (kept out of the initial bundle). */
export async function downloadZip(files: { name: string; data: Blob }[], zipName: string) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.data));
  downloadBlob(await zip.generateAsync({ type: 'blob' }), zipName);
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export const randomId = () => Math.random().toString(36).slice(2, 9);

/** "-39%" when smaller, "+39%" when the output grew (e.g. PNG -> JPEG of a flat graphic). */
export const formatSavings = (n?: number) => (n === undefined ? '' : n >= 0 ? `-${n}%` : `+${Math.abs(n)}%`);
