'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, formatSize, randomId } from '@/lib/files';
import { baseName, sanitizeFilePart } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { readDimensions, prepareImage } from '@/lib/pdf-image';
import { QUALITY, containRect, nextRotation, pageDims, type OrientationMode, type PageSize, type Quality } from '@/lib/pdf-layout';
import { useToast } from '@/lib/toast';
import { Dropzone } from './Dropzone';

interface PdfImage { id: string; file: File; url: string; width: number; height: number; rotation: number }

const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const iconBtn = 'px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed';

export function ImageToPdf() {
  const toast = useToast();
  const [images, setImages] = useState<PdfImage[]>([]);
  const [size, setSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<OrientationMode>('auto');
  const [margin, setMargin] = useState(10);
  const [quality, setQuality] = useState<Quality>('balanced');
  const [fileName, setFileName] = useState('images');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const cancelRef = useRef(false);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const set = urls.current;
    return () => { cancelRef.current = true; set.forEach((u) => URL.revokeObjectURL(u)); set.clear(); };
  }, []);

  const addFiles = async (list: FileList) => {
    const fresh: PdfImage[] = [];
    const notes: string[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/')) { notes.push(`${file.name} is not an image.`); continue; }
      const dims = await readDimensions(file);
      if (!dims) { notes.push(`${file.name} could not be read. Browsers cannot open some formats, such as HEIC; save it as JPG or PNG first.`); continue; }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      fresh.push({ id: randomId(), file, url, width: dims.width, height: dims.height, rotation: 0 });
    }
    setSkipped(notes);
    if (fresh.length) {
      setImages((c) => [...c, ...fresh]);
      if (images.length === 0 && fileName === 'images') setFileName(sanitizeFilePart(baseName(fresh[0].file.name)) || 'images');
    }
  };

  const move = (i: number, dir: number) => setImages((c) => {
    const t = i + dir;
    if (t < 0 || t >= c.length) return c;
    const next = [...c];
    [next[i], next[t]] = [next[t], next[i]];
    return next;
  });
  const rotate = (id: string) => setImages((c) => c.map((im) => (im.id === id ? { ...im, rotation: nextRotation(im.rotation) } : im)));
  const remove = (id: string) => {
    const im = images.find((x) => x.id === id);
    if (im) { URL.revokeObjectURL(im.url); urls.current.delete(im.url); }
    setImages((c) => c.filter((x) => x.id !== id));
  };
  const clearAll = () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current.clear(); setImages([]); setSkipped([]); };

  const generate = async () => {
    if (!images.length) return;
    cancelRef.current = false;
    setProgress({ done: 0, total: images.length });
    try {
      const { jsPDF } = await import('jspdf');
      let doc: InstanceType<typeof jsPDF> | null = null;
      for (let i = 0; i < images.length; i++) {
        if (cancelRef.current) break;
        const img = images[i];
        const prepared = await prepareImage(img.file, img.rotation, quality);
        const page = pageDims(prepared.width, prepared.height, size, orientation, margin);
        if (!doc) doc = new jsPDF({ unit: 'mm', format: [page.width, page.height], orientation: page.orientation, compress: true });
        else doc.addPage([page.width, page.height], page.orientation);
        const rect = containRect(page, prepared.width, prepared.height, margin);
        doc.addImage(prepared.bytes, 'JPEG', rect.x, rect.y, rect.width, rect.height, undefined, 'FAST');
        setProgress({ done: i + 1, total: images.length });
      }
      if (cancelRef.current || !doc) { toast.info('Cancelled'); return; }
      const blob = doc.output('blob');
      downloadBlob(blob, `${sanitizeFilePart(fileName) || 'images'}.pdf`);
      toast.success(`PDF created: ${images.length} page${images.length === 1 ? '' : 's'}, ${formatSize(blob.size)}`);
      void logToolUsage('image_to_pdf', 'convert');
    } catch (e) {
      console.error(e);
      toast.error('The PDF could not be created. Try the "Small" quality, or fewer images at once.');
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const seg = (on: boolean) => `flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="min-w-0 space-y-4">
        <Dropzone
          onFiles={(f) => void addFiles(f)}
          accept="image/*"
          compact={images.length > 0}
          icon="fa-images"
          title="Drop images here, or click to choose"
          titleCompact="Add more images"
          subtitle="JPG, PNG, WebP and more. Each becomes one page."
          subtitleCompact="Drop them here or click"
        />

        {skipped.length > 0 && (
          <ul role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1 list-disc pl-8">{skipped.map((m) => <li key={m}>{m}</li>)}</ul>
        )}

        {images.length > 0 && <p className="text-sm text-slate-600" role="status"><strong className="text-slate-900">{images.length}</strong> page{images.length === 1 ? '' : 's'}, in this order</p>}

        <ol className="space-y-3" aria-label="Pages">
          {images.map((im, i) => (
            <li key={im.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">{i + 1}</span>
              <div className="shrink-0 h-24 w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" className="max-h-full max-w-full object-contain transition-transform" style={{ transform: `rotate(${im.rotation}deg)`, ...(im.rotation % 180 ? { maxHeight: '96px', maxWidth: '96px' } : {}) }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{im.file.name}</p>
                <p className="text-sm text-slate-600">{im.rotation % 180 ? `${im.height} × ${im.width}` : `${im.width} × ${im.height}`} px · {formatSize(im.file.size)}{im.rotation ? ` · turned ${im.rotation}°` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${im.file.name} up`} className={iconBtn}>Up</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move ${im.file.name} down`} className={iconBtn}>Down</button>
                <button type="button" onClick={() => rotate(im.id)} aria-label={`Rotate ${im.file.name}`} className={iconBtn}>Rotate</button>
                <button type="button" onClick={() => remove(im.id)} aria-label={`Remove ${im.file.name}`} className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
              </div>
            </li>
          ))}
        </ol>
        <AdSlot slotId="image_to_pdf_middle" format="horizontal" minHeight="90px" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
        <div>
          <p className={label}>Page size</p>
          <div role="group" aria-label="Page size" className="flex p-1 rounded-lg bg-slate-100">
            <button type="button" aria-pressed={size === 'a4'} onClick={() => setSize('a4')} className={seg(size === 'a4')}>A4</button>
            <button type="button" aria-pressed={size === 'letter'} onClick={() => setSize('letter')} className={seg(size === 'letter')}>US Letter</button>
            <button type="button" aria-pressed={size === 'fit'} onClick={() => setSize('fit')} className={seg(size === 'fit')}>Fit image</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{size === 'fit' ? 'Each page is exactly the size of its image, plus the margin.' : 'Images are fitted inside the page without being stretched.'}</p>
        </div>

        {size !== 'fit' && (
          <div>
            <p className={label}>Orientation</p>
            <div role="group" aria-label="Orientation" className="flex p-1 rounded-lg bg-slate-100">
              {([['auto', 'Match image'], ['portrait', 'Portrait'], ['landscape', 'Landscape']] as const).map(([v, t]) => (
                <button key={v} type="button" aria-pressed={orientation === v} onClick={() => setOrientation(v)} className={seg(orientation === v)}>{t}</button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{orientation === 'auto' ? 'Wide images get landscape pages and tall ones portrait.' : 'Every page uses this orientation.'}</p>
          </div>
        )}

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="i2p-margin" className={label}>Margin</label><span className="text-sm font-semibold text-slate-900">{margin} mm</span></div>
          <input id="i2p-margin" type="range" min="0" max="30" step="1" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full accent-primary-600" />
        </div>

        <div>
          <label htmlFor="i2p-quality" className={label}>Image quality</label>
          <select id="i2p-quality" value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className={field}>
            {(Object.keys(QUALITY) as Quality[]).map((q) => <option key={q} value={q}>{QUALITY[q].label}</option>)}
          </select>
          <p className="mt-2 text-xs text-slate-500">{QUALITY[quality].hint} Transparent areas become white.</p>
        </div>

        <div>
          <label htmlFor="i2p-name" className={label}>File name</label>
          <div className="flex items-center gap-2">
            <input id="i2p-name" type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className={field} />
            <span className="text-sm text-slate-500">.pdf</span>
          </div>
        </div>

        <div className="space-y-2">
          <button type="button" onClick={generate} disabled={!images.length || busy} className="w-full px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {progress ? `Adding page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : `Create PDF${images.length ? ` (${images.length} page${images.length === 1 ? '' : 's'})` : ''}`}
          </button>
          {progress && (
            <>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={progress.total}><div className="h-full bg-primary-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
              <button type="button" onClick={() => { cancelRef.current = true; }} className="w-full py-1.5 text-sm font-medium text-rose-700 hover:underline">Cancel</button>
            </>
          )}
          {images.length > 0 && !busy && <button type="button" onClick={clearAll} className="w-full py-1.5 text-sm font-medium text-rose-700 hover:underline">Clear all</button>}
        </div>

        <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Your images are combined in your browser. Nothing is uploaded.</p>
      </section>
    </div>
  );
}
