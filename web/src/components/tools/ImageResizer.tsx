'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, formatSize } from '@/lib/files';
import { baseName, extForMime, sanitizeFilePart } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { PRESETS, ratioLabel, scaledSize, sourceRect, validateSize } from '@/lib/resize';
import { renderResized } from '@/lib/resize-image';
import { useToast } from '@/lib/toast';
import { Dropzone } from './Dropzone';

type Format = 'image/png' | 'image/jpeg' | 'image/webp';
interface Loaded { name: string; size: number; width: number; height: number }

const MAX_FILE = 50 * 1024 * 1024;
const PREVIEW_MAX = 900;
const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';

export function ImageResizer() {
  const toast = useToast();
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState<Loaded | null>(null);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [locked, setLocked] = useState(true);
  const [fit, setFit] = useState<'crop' | 'stretch'>('crop');
  const [format, setFormat] = useState<Format>('image/png');
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { bitmapRef.current?.close(); }, []);

  const load = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.warn(`${file.name} is not an image`);
    if (file.size > MAX_FILE) return toast.error(`${file.name} is ${formatSize(file.size)}. Images up to 50 MB are supported.`);
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      bitmapRef.current?.close();
      bitmapRef.current = bitmap;
      setInfo({ name: file.name, size: file.size, width: bitmap.width, height: bitmap.height });
      setW(bitmap.width);
      setH(bitmap.height);
      setLocked(true);
    } catch {
      toast.error('That image could not be read. Browsers cannot open some formats, such as HEIC; save it as JPG or PNG first.');
    }
  };

  const reset = () => { bitmapRef.current?.close(); bitmapRef.current = null; setInfo(null); setW(0); setH(0); };

  const ratio = info ? info.width / info.height : 1;
  const onW = (v: string) => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    setW(n);
    if (locked && n) setH(Math.max(1, Math.round(n / ratio)));
  };
  const onH = (v: string) => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    setH(n);
    if (locked && n) setW(Math.max(1, Math.round(n * ratio)));
  };

  const error = info ? validateSize(w, h) : null;
  const shapeDiffers = !!info && !!w && !!h && Math.abs(w / h - ratio) > 0.005;
  const enlarging = !!info && w > info.width && h > info.height;

  // The preview is drawn small, so typing a size never makes the page lag, whatever the output size is.
  useEffect(() => {
    const c = canvasRef.current;
    const bmp = bitmapRef.current;
    if (!c || !bmp || !info || error || !w || !h) return;
    const k = Math.min(1, PREVIEW_MAX / Math.max(w, h));
    const pw = Math.max(1, Math.round(w * k));
    const ph = Math.max(1, Math.round(h * k));
    c.width = pw;
    c.height = ph;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const src = sourceRect(bmp.width, bmp.height, w, h, fit);
    ctx.clearRect(0, 0, pw, ph);
    if (format === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pw, ph); }
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(bmp, src.x, src.y, src.width, src.height, 0, 0, pw, ph);
  }, [info, w, h, fit, format, error]);

  const download = async () => {
    const bmp = bitmapRef.current;
    if (!bmp || !info || error) return;
    setBusy(true);
    try {
      const canvas = await renderResized(bmp, w, h, fit, format === 'image/jpeg' ? '#ffffff' : undefined);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed'))), format, format === 'image/png' ? undefined : quality));
      const ext = extForMime(blob.type || format);
      downloadBlob(blob, `${sanitizeFilePart(baseName(info.name)) || 'image'}-${w}x${h}.${ext}`);
      toast.success(`Downloaded ${w} × ${h} px, ${formatSize(blob.size)}`);
      if (blob.type && blob.type !== format) toast.info(`Your browser cannot create ${extForMime(format).toUpperCase()} images, so this was saved as ${ext.toUpperCase()}.`);
      void logToolUsage('image_resizer', 'resize');
    } catch (e) {
      console.error(e);
      toast.error('The image could not be created. Try a smaller size.');
    } finally {
      setBusy(false);
    }
  };

  const outRatio = useMemo(() => ratioLabel(w, h), [w, h]);
  const seg = (on: boolean) => `flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="min-w-0 space-y-4">
        {!info ? (
          <Dropzone
            onFiles={(fl) => { const f = fl[0]; if (f) void load(f); }}
            accept="image/*"
            multiple={false}
            compact={false}
            icon="fa-expand"
            title="Drop an image here, or click to choose"
            titleCompact=""
            subtitle="JPG, PNG, WebP and more, up to 50 MB."
            subtitleCompact=""
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{info.name}</h2>
                <p className="text-sm text-slate-600">Original {info.width} × {info.height} px ({ratioLabel(info.width, info.height)}) · {formatSize(info.size)}</p>
              </div>
              <button type="button" onClick={reset} className="text-sm font-medium text-rose-700 hover:underline">Choose another image</button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center p-3 min-h-[260px]">
              {error ? <p role="alert" className="text-sm text-rose-700 px-4 text-center">{error}</p> : <canvas ref={canvasRef} className="max-w-full max-h-[560px] h-auto w-auto shadow-md" aria-label="Preview of the resized image" />}
            </div>
            {!error && (
              <p className="mt-3 text-sm text-slate-600" role="status">
                Output <strong className="text-slate-900">{w} × {h} px</strong> ({outRatio}).{' '}
                {shapeDiffers && (fit === 'crop' ? 'The edges are trimmed to fit this shape.' : 'The image is stretched to fit this shape.')}{' '}
                {enlarging && 'This is larger than the original, so it will look softer.'}
              </p>
            )}
          </div>
        )}
        <AdSlot slotId="image_resizer_middle" format="horizontal" minHeight="90px" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-700">Size in pixels</span>
            <button type="button" onClick={() => setLocked((v) => !v)} aria-pressed={locked} disabled={!info} className={`text-sm font-medium ${locked ? 'text-primary-700' : 'text-slate-600'} hover:underline disabled:opacity-40`}>
              {locked ? 'Proportions locked' : 'Proportions free'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="rs-w" className="block text-xs text-slate-500 mb-1">Width</label><input id="rs-w" type="number" min={1} inputMode="numeric" disabled={!info} value={w || ''} onChange={(e) => onW(e.target.value)} className={field} aria-invalid={!!error} /></div>
            <div><label htmlFor="rs-h" className="block text-xs text-slate-500 mb-1">Height</label><input id="rs-h" type="number" min={1} inputMode="numeric" disabled={!info} value={h || ''} onChange={(e) => onH(e.target.value)} className={field} aria-invalid={!!error} /></div>
          </div>
          {info && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Scale">
              {[25, 50, 75, 100, 150, 200].map((p) => (
                <button key={p} type="button" onClick={() => { const s = scaledSize(info.width, info.height, p); setLocked(true); setW(s.width); setH(s.height); }} className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:border-slate-500">{p}%</button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className={label}>Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" disabled={!info} onClick={() => { setLocked(false); setW(p.width); setH(p.height); }} className="text-left px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="block text-sm font-medium text-slate-800">{p.label}</span>
                <span className="block text-xs text-slate-500">{p.width} × {p.height}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={label}>If the shape changes</p>
          <div role="group" aria-label="If the shape changes" className="flex p-1 rounded-lg bg-slate-100">
            <button type="button" aria-pressed={fit === 'crop'} onClick={() => setFit('crop')} className={seg(fit === 'crop')}>Crop to fill</button>
            <button type="button" aria-pressed={fit === 'stretch'} onClick={() => setFit('stretch')} className={seg(fit === 'stretch')}>Stretch</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{fit === 'crop' ? 'Keeps proportions and trims the edges equally.' : 'Fills the exact size but can distort the image.'}</p>
        </div>

        <div>
          <p className={label}>Format</p>
          <div role="group" aria-label="Format" className="flex p-1 rounded-lg bg-slate-100">
            {([['image/png', 'PNG'], ['image/jpeg', 'JPEG'], ['image/webp', 'WebP']] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={format === v} onClick={() => setFormat(v)} className={seg(format === v)}>{t}</button>
            ))}
          </div>
          {format !== 'image/png' ? (
            <div className="mt-3">
              <div className="flex items-baseline justify-between"><label htmlFor="rs-q" className="text-xs text-slate-500">Quality</label><span className="text-sm font-semibold text-slate-900">{Math.round(quality * 100)}%</span></div>
              <input id="rs-q" type="range" min="0.4" max="1" step="0.01" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary-600" />
              {format === 'image/jpeg' && <p className="mt-1 text-xs text-slate-500">Transparent areas become white.</p>}
            </div>
          ) : <p className="mt-2 text-xs text-slate-500">PNG is lossless and keeps transparency.</p>}
        </div>

        <button type="button" onClick={download} disabled={!info || !!error || busy} className="w-full px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {busy ? 'Resizing…' : 'Download resized image'}
        </button>
        <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Your image is resized in your browser and never uploaded. Hidden metadata is not carried over.</p>
      </section>
    </div>
  );
}
