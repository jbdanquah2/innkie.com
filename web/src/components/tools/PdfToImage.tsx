'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip, formatSize } from '@/lib/files';
import { baseName, sanitizeFilePart } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { dpiForScale, fitScale, formatPageRange, pageFileName, parsePageRange } from '@/lib/pdf-pages';
import { useToast } from '@/lib/toast';
import { Dropzone } from './Dropzone';

type PdfDoc = import('pdfjs-dist').PDFDocumentProxy;

const MAX_PDF_BYTES = 100 * 1024 * 1024;

/** Loads pdf.js on demand, with the worker bundled by Next. */
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  return pdfjs;
}

/** One page thumbnail, drawn only once it scrolls into view so a 500-page PDF stays light. */
function PageThumb({ pdf, page, selected, onToggle }: { pdf: PdfDoc; page: number; selected: boolean; onToggle: () => void }) {
  const wrap = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el || drawn) return;
    let cancelled = false;
    const io = new IntersectionObserver(async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try {
        const p = await pdf.getPage(page);
        const base = p.getViewport({ scale: 1 });
        const viewport = p.getViewport({ scale: 200 / base.width });
        const c = canvas.current;
        if (!c || cancelled) return;
        c.width = Math.floor(viewport.width);
        c.height = Math.floor(viewport.height);
        const ctx = c.getContext('2d');
        if (!ctx) return;
        await p.render({ canvasContext: ctx, viewport, canvas: c }).promise;
        p.cleanup();
        if (!cancelled) setDrawn(true);
      } catch { /* a thumbnail that fails is not worth interrupting the user for */ }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [pdf, page, drawn]);

  return (
    <button
      ref={wrap}
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Page ${page}`}
      className={`relative rounded-lg border-2 overflow-hidden bg-slate-100 min-h-[120px] transition-colors ${selected ? 'border-primary-600 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-400'}`}
    >
      <canvas ref={canvas} className="block w-full h-auto bg-white" />
      <span className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${selected ? 'bg-primary-600 text-white' : 'bg-slate-900/70 text-white'}`}>{page}</span>
      {selected && <span className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center" aria-hidden="true"><i className="fas fa-check" /></span>}
    </button>
  );
}

const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';

export function PdfToImage() {
  const toast = useToast();
  const pdfRef = useRef<PdfDoc | null>(null);
  const cancelRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [rangeText, setRangeText] = useState('');
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [needPassword, setNeedPassword] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => () => { cancelRef.current = true; void pdfRef.current?.destroy(); }, []);

  const reset = () => {
    void pdfRef.current?.destroy();
    pdfRef.current = null;
    setPdf(null);
    setFile(null);
    setTotal(0);
    setPageSize(null);
    setSelected([]);
    setRangeText('');
    setNeedPassword(null);
    setPassword('');
    setPasswordError('');
  };

  const open = async (f: File, pw?: string) => {
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) return toast.warn(`${f.name} is not a PDF`);
    if (f.size > MAX_PDF_BYTES) return toast.error(`${f.name} is ${formatSize(f.size)}. PDFs up to 100 MB are supported.`);
    setLoading(true);
    try {
      const pdfjs = await loadPdfjs();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer(), password: pw }).promise;
      void pdfRef.current?.destroy();
      pdfRef.current = doc;
      const first = await doc.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      first.cleanup();
      setPdf(doc);
      setFile(f);
      setTotal(doc.numPages);
      setPageSize({ w: vp.width, h: vp.height });
      const all = Array.from({ length: doc.numPages }, (_, i) => i + 1);
      setSelected(all);
      setRangeText(formatPageRange(all));
      setNeedPassword(null);
      setPassword('');
      setPasswordError('');
    } catch (e) {
      const err = e as { name?: string; code?: number };
      if (err?.name === 'PasswordException') {
        setNeedPassword(f);
        setPasswordError(err.code === 2 ? 'That password is not correct. Try again.' : '');
      } else {
        console.error(e);
        toast.error('This PDF could not be read. It may be damaged or not a real PDF.');
      }
    } finally {
      setLoading(false);
    }
  };

  const range = useMemo(() => parsePageRange(rangeText, total), [rangeText, total]);
  const onRangeChange = (text: string) => {
    setRangeText(text);
    const r = parsePageRange(text, total);
    if (!r.error) setSelected(r.pages);
  };
  const toggle = (page: number) => {
    const next = selected.includes(page) ? selected.filter((p) => p !== page) : [...selected, page].sort((a, b) => a - b);
    setSelected(next);
    setRangeText(formatPageRange(next));
  };
  const selectAll = () => { const all = Array.from({ length: total }, (_, i) => i + 1); setSelected(all); setRangeText(formatPageRange(all)); };
  const selectNone = () => { setSelected([]); setRangeText(''); };

  const convert = async () => {
    if (!pdf || !file || !selected.length) return;
    cancelRef.current = false;
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const base = sanitizeFilePart(baseName(file.name)) || 'document';
    const files: { name: string; data: Blob }[] = [];
    let reducedCount = 0;
    setProgress({ done: 0, total: selected.length });
    try {
      for (const n of selected) {
        if (cancelRef.current) break;
        const page = await pdf.getPage(n);
        const base1 = page.getViewport({ scale: 1 });
        const fit = fitScale(base1.width, base1.height, scale);
        if (fit.reduced) reducedCount++;
        const viewport = page.getViewport({ scale: fit.scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas is not available');
        if (format === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed'))), format, format === 'image/jpeg' ? quality : undefined));
        page.cleanup();
        files.push({ name: pageFileName(base, n, total, ext), data: blob });
        setProgress({ done: files.length, total: selected.length });
      }
      if (cancelRef.current) { toast.info('Conversion cancelled'); return; }
      if (files.length === 1) downloadBlob(files[0].data, files[0].name);
      else await downloadZip(files, `${base}-pages.zip`);
      toast.success(files.length === 1 ? 'Image downloaded' : `${files.length} images downloaded as a ZIP`);
      if (reducedCount) toast.info(`${reducedCount} large page${reducedCount === 1 ? ' was' : 's were'} reduced to the largest size your browser can draw.`);
      void logToolUsage('pdf_to_image', 'convert');
    } catch (e) {
      console.error(e);
      toast.error('The conversion failed. Try a lower scale, or fewer pages at once.');
    } finally {
      setProgress(null);
    }
  };

  // The same rounding the converter uses, so the estimate matches the real image.
  const outW = pageSize ? Math.floor(pageSize.w * scale) : 0;
  const outH = pageSize ? Math.floor(pageSize.h * scale) : 0;
  const busy = loading || progress !== null;
  const seg = (on: boolean) => `flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="min-w-0 space-y-4">
        {needPassword ? (
          <form onSubmit={(e) => { e.preventDefault(); void open(needPassword, password); }} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
            <h2 className="font-semibold text-slate-900">This PDF is password protected</h2>
            <p className="text-sm text-slate-600">{needPassword.name}</p>
            <label htmlFor="pdf-password" className={label}>Password</label>
            <input id="pdf-password" type="password" autoComplete="off" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={field} aria-invalid={!!passwordError} />
            {passwordError && <p role="alert" className="text-sm text-rose-700">{passwordError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={!password || loading} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-40">{loading ? 'Opening…' : 'Open PDF'}</button>
              <button type="button" onClick={reset} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500">Cancel</button>
            </div>
            <p className="text-xs text-slate-500">The password is used in your browser to open the file and is never sent anywhere.</p>
          </form>
        ) : !pdf ? (
          <Dropzone
            onFiles={(fl) => { const f = fl[0]; if (f) void open(f); }}
            accept="application/pdf,.pdf"
            multiple={false}
            compact={false}
            icon="fa-file-pdf"
            title={loading ? 'Reading the PDF…' : 'Drop a PDF here, or click to choose'}
            titleCompact=""
            subtitle="PDFs up to 100 MB. Password-protected files are supported."
            subtitleCompact=""
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{file?.name}</h2>
                <p className="text-sm text-slate-600">{total} page{total === 1 ? '' : 's'}{file ? ` · ${formatSize(file.size)}` : ''}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <button type="button" onClick={selectAll} className="font-medium text-primary-700 hover:underline">Select all</button>
                <button type="button" onClick={selectNone} className="font-medium text-slate-600 hover:text-slate-900 hover:underline">Clear</button>
                <button type="button" onClick={reset} className="font-medium text-rose-700 hover:underline">Choose another PDF</button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">Click pages to choose which to convert.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto p-1" aria-label="Pages">
              {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
                <PageThumb key={n} pdf={pdf} page={n} selected={selected.includes(n)} onToggle={() => toggle(n)} />
              ))}
            </div>
          </div>
        )}
        <AdSlot slotId="pdf_to_image_middle" format="horizontal" minHeight="90px" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
        <div>
          <label htmlFor="p2i-range" className={label}>Pages to convert</label>
          <input id="p2i-range" type="text" value={rangeText} onChange={(e) => onRangeChange(e.target.value)} disabled={!pdf} placeholder="1-3, 5, 8-" spellCheck={false} className={`${field} font-mono`} aria-invalid={!!range.error} />
          {range.error
            ? <p role="alert" className="mt-1.5 text-xs text-rose-700">{range.error}</p>
            : <p className="mt-1.5 text-xs text-slate-500" role="status">{pdf ? `${selected.length} of ${total} page${total === 1 ? '' : 's'} selected` : 'Open a PDF first.'}</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="p2i-scale" className={label}>Resolution</label>
            <span className="text-sm font-semibold text-slate-900">{scale}× · {dpiForScale(scale)} DPI</span>
          </div>
          <input id="p2i-scale" type="range" min="1" max="4" step="0.5" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-primary-600" />
          <div className="flex justify-between text-xs text-slate-500"><span>Smaller files</span><span>Sharper text</span></div>
          {pageSize && <p className="mt-2 text-xs text-slate-500">About {outW} × {outH} px per page (based on page 1). Use 2× for screens and 4× for printing.</p>}
        </div>

        <div>
          <p className={label}>Format</p>
          <div role="group" aria-label="Format" className="flex p-1 rounded-lg bg-slate-100">
            <button type="button" aria-pressed={format === 'image/png'} onClick={() => setFormat('image/png')} className={seg(format === 'image/png')}>PNG</button>
            <button type="button" aria-pressed={format === 'image/jpeg'} onClick={() => setFormat('image/jpeg')} className={seg(format === 'image/jpeg')}>JPEG</button>
          </div>
          {format === 'image/jpeg' ? (
            <div className="mt-3">
              <div className="flex items-baseline justify-between"><label htmlFor="p2i-q" className="text-xs text-slate-500">JPEG quality</label><span className="text-sm font-semibold text-slate-900">{Math.round(quality * 100)}%</span></div>
              <input id="p2i-q" type="range" min="0.5" max="1" step="0.01" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary-600" />
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">PNG keeps text and line art perfectly crisp.</p>
          )}
        </div>

        <div className="space-y-2">
          <button type="button" onClick={convert} disabled={!pdf || busy || !selected.length || !!range.error} className="w-full px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {progress ? `Converting page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : selected.length > 1 ? `Convert ${selected.length} pages` : 'Convert page'}
          </button>
          {progress && (
            <>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={progress.done} aria-valuemin={0} aria-valuemax={progress.total}><div className="h-full bg-primary-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
              <button type="button" onClick={() => { cancelRef.current = true; }} className="w-full py-1.5 text-sm font-medium text-rose-700 hover:underline">Cancel</button>
            </>
          )}
          <p className="text-xs text-slate-500">One page downloads as an image; several download together as a ZIP.</p>
        </div>

        <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Your PDF is read and drawn in your browser. It is never uploaded.</p>
      </section>
    </div>
  );
}
