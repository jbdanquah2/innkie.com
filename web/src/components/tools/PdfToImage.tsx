'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

type PdfDoc = import('pdfjs-dist').PDFDocumentProxy;

/** Loads pdf.js on demand, with the worker bundled by Next (no CDN version pinning like the Angular build had). */
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  return pdfjs;
}

async function renderPage(pdf: PdfDoc, pageNum: number, scale: number, mime: string): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#fff'; // JPEG has no alpha: avoid black pages
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL(mime, 0.92);
}

const dataUrlToBlob = async (u: string) => (await fetch(u)).blob();

export function PdfToImage() {
  const toast = useToast();
  const pdfRef = useRef<PdfDoc | null>(null);
  const [fileName, setFileName] = useState('');
  const [total, setTotal] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selected, setSelected] = useState(1);
  const [mode, setMode] = useState<'single' | 'all'>('single');
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [busy, setBusy] = useState(false);
  const loaded = total > 0;

  useEffect(() => () => { void pdfRef.current?.destroy(); }, []);

  const loadPdf = async (file: File) => {
    if (file.type !== 'application/pdf') return toast.warn(`${file.name} is not a PDF`);
    setBusy(true);
    try {
      const pdfjs = await loadPdfjs();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      void pdfRef.current?.destroy();
      pdfRef.current = pdf;
      setFileName(file.name);
      setTotal(pdf.numPages);
      setSelected(1);
      const list: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) list.push(await renderPage(pdf, i, 0.3, 'image/png'));
      setPreviews(list);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load PDF. Please ensure it is a valid document.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    void pdfRef.current?.destroy();
    pdfRef.current = null;
    setTotal(0);
    setPreviews([]);
    setSelected(1);
    setFileName('');
  };

  const convert = async () => {
    const pdf = pdfRef.current;
    if (!pdf) return;
    setBusy(true);
    const ext = format.split('/')[1];
    try {
      if (mode === 'single') {
        const url = await renderPage(pdf, selected, scale, format);
        downloadBlob(await dataUrlToBlob(url), `innkie-pdf-page-${selected}-${Date.now()}.${ext}`);
      } else {
        const files: { name: string; data: Blob }[] = [];
        for (let i = 1; i <= pdf.numPages; i++) files.push({ name: `page-${i}.${ext}`, data: await dataUrlToBlob(await renderPage(pdf, i, scale, format)) });
        await downloadZip(files, `innkie-pdf-export-${Date.now()}.zip`);
      }
      toast.success('Conversion completed successfully!');
      void logToolUsage('pdf_to_image', 'convert');
    } catch (e) {
      console.error(e);
      toast.error('Failed to convert PDF to images.');
    } finally {
      setBusy(false);
    }
  };

  const seg = (on: boolean) => `flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${on ? 'bg-white shadow-sm' : ''}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 space-y-6">
        {!loaded ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void loadPdf(f); }}
            className="group relative bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <input type="file" aria-label="Choose a PDF" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadPdf(f); e.target.value = ''; }} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <i className={busy ? 'fas fa-circle-notch animate-spin' : 'fas fa-file-pdf'} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{busy ? 'Reading PDF...' : 'Drop your PDF here'}</h3>
              <p className="text-slate-400 font-medium italic">Supports standard PDF documents (Max 50MB)</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fas fa-file-pdf" /></div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 truncate max-w-[200px]">{fileName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{total} Pages Detected</p>
                </div>
              </div>
              <button type="button" aria-label="Remove PDF" onClick={reset} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center transition-all"><i className="fas fa-times" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
              {previews.map((src, i) => (
                <button key={i} type="button" onClick={() => setSelected(i + 1)} aria-pressed={selected === i + 1} className={`relative aspect-[3/4] bg-slate-50 rounded-xl border-2 border-slate-100 overflow-hidden cursor-pointer hover:border-primary-300 transition-all ring-primary-100 ring-offset-2 ${selected === i + 1 ? 'ring-4' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/60 backdrop-blur rounded text-[8px] font-black text-white">PAGE {i + 1}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <AdSlot slotId="pdf_to_image_middle" format="horizontal" minHeight="90px" />
      </div>

      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Extraction Range</span>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setMode('single')} className={seg(mode === 'single')}>Selected Page</button>
              <button type="button" onClick={() => setMode('all')} className={seg(mode === 'all')}>All Pages</button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="p2i-scale" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Scale</label>
              <span className="text-xs font-black text-primary-600">{scale}x</span>
            </div>
            <input id="p2i-scale" type="range" min="1" max="4" step="0.5" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
            <div className="flex justify-between mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest"><span>Normal</span><span>Ultra HD</span></div>
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Export Format</span>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setFormat('image/png')} className={seg(format === 'image/png')}>PNG</button>
              <button type="button" onClick={() => setFormat('image/jpeg')} className={seg(format === 'image/jpeg')}>JPEG</button>
            </div>
          </div>
          <button type="button" onClick={convert} disabled={!loaded || busy} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
            <i className={`fas ${busy ? 'fa-circle-notch animate-spin' : 'fa-magic'}`} />
            {busy ? 'Processing PDF...' : 'Convert to Images'}
          </button>
        </div>
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><i className="fas fa-shield-alt" /></div>
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Document Guard</p>
            <p className="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens in your RAM. Your PDF never touches a server. <strong>Data sovereignty guaranteed.</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
