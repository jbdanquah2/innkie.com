'use client';
import { useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { fileToDataUrl, randomId } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

interface PdfImage { id: string; file: File; previewUrl: string; width: number; height: number }

const loadImg = (url: string) =>
  new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

/** jsPDF can embed JPEG/PNG; anything else (WebP, GIF...) is redrawn to PNG first. */
async function embeddable(img: PdfImage): Promise<{ data: string; format: 'JPEG' | 'PNG' }> {
  if (img.file.type === 'image/jpeg') return { data: img.previewUrl, format: 'JPEG' };
  if (img.file.type === 'image/png') return { data: img.previewUrl, format: 'PNG' };
  const el = await loadImg(img.previewUrl);
  const c = document.createElement('canvas');
  c.width = el.naturalWidth;
  c.height = el.naturalHeight;
  c.getContext('2d')!.drawImage(el, 0, 0);
  return { data: c.toDataURL('image/png'), format: 'PNG' };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ImageToPdf() {
  const toast = useToast();
  const [images, setImages] = useState<PdfImage[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'auto'>('a4');
  const [orientation, setOrientation] = useState<'p' | 'l'>('p');
  const [margin, setMargin] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');

  const addFiles = async (files: File[]) => {
    const fresh: PdfImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const previewUrl = await fileToDataUrl(file);
        const el = await loadImg(previewUrl);
        fresh.push({ id: randomId(), file, previewUrl, width: el.width, height: el.height });
      } catch {
        toast.warn(`Could not read ${file.name}`);
      }
    }
    setImages((c) => [...c, ...fresh]);
  };

  const move = (i: number, dir: number) => {
    const t = i + dir;
    setImages((c) => {
      if (t < 0 || t >= c.length) return c;
      const next = [...c];
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  };

  const generate = async () => {
    if (!images.length) return;
    setGenerating(true);
    setProgress(0);
    setStep('Initializing engine...');
    try {
      const { jsPDF } = await import('jspdf');
      await wait(300);
      const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize === 'a4' ? 'a4' : undefined });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setStep(`Processing page ${i + 1} of ${images.length}...`);
        setProgress(Math.round((i / images.length) * 100));
        if (i > 0) doc.addPage(pageSize === 'a4' ? 'a4' : [img.width, img.height], orientation);

        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        const ratio = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height);
        const fw = img.width * ratio;
        const fh = img.height * ratio;
        const { data, format } = await embeddable(img);
        doc.addImage(data, format, (pw - fw) / 2, (ph - fh) / 2, fw, fh);
        await wait(50); // let the progress UI paint
      }

      setProgress(100);
      setStep('Saving document...');
      await wait(300);
      doc.save(`innkie-combined-${Date.now()}.pdf`);
      toast.success('PDF created and downloaded!');
      void logToolUsage('image_to_pdf', 'convert');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const seg = (on: boolean) => `flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${on ? 'bg-white' : ''}`;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(Array.from(e.dataTransfer.files)); }}
            className={`group relative bg-white border-4 border-dashed rounded-[3rem] p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-all duration-500 cursor-pointer overflow-hidden ${dragging ? 'border-primary-400 bg-primary-50' : 'border-slate-200'} ${generating ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input type="file" aria-label="Add images" accept="image/*" multiple onChange={(e) => { void addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <div className="relative z-10">
              <div className={`bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm ${images.length ? 'w-12 h-12' : 'w-16 h-16'}`}><i className="fas fa-plus" /></div>
              <h3 className={`font-black text-slate-900 mb-1 ${images.length ? 'text-base' : 'text-lg'}`}>{images.length ? 'Add More Images' : 'Add Images'}</h3>
              <p className="text-slate-400 text-sm font-medium italic">Drop photos or click to browse</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Document Pages ({images.length})</h3>
                <button type="button" onClick={() => setImages([])} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors">Clear All</button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {images.map((img, i) => (
                  <div key={img.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-primary-200 transition-all">
                    <div className="w-12 h-16 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">{img.file.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{img.width} x {img.height}px</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><i className="fas fa-arrow-up text-xs" /></button>
                      <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="p-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><i className="fas fa-arrow-down text-xs" /></button>
                      <button type="button" aria-label="Remove" onClick={() => setImages((c) => c.filter((x) => x.id !== img.id))} className="p-2 text-slate-400 hover:text-rose-600"><i className="fas fa-trash-alt text-xs" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <AdSlot slotId="image_to_pdf_middle" format="horizontal" minHeight="90px" />
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Document Layout</span>
              <div className="space-y-4">
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button type="button" onClick={() => setPageSize('a4')} className={seg(pageSize === 'a4')}>A4 Paper</button>
                  <button type="button" onClick={() => setPageSize('auto')} className={seg(pageSize === 'auto')}>Fit Image</button>
                </div>
                {pageSize === 'a4' && (
                  <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setOrientation('p')} className={seg(orientation === 'p')}>Portrait</button>
                    <button type="button" onClick={() => setOrientation('l')} className={seg(orientation === 'l')}>Landscape</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="i2p-margin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Margin</label>
                <span className="text-xs font-black text-primary-600">{margin}mm</span>
              </div>
              <input id="i2p-margin" type="range" min="0" max="50" step="5" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
            </div>
            <button type="button" onClick={generate} disabled={!images.length || generating} className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
              <i className={`fas ${generating ? 'fa-circle-notch animate-spin' : 'fa-file-pdf'}`} />
              {generating ? 'Creating PDF...' : 'Create PDF Document'}
            </button>
          </div>
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><i className="fas fa-shield-alt" /></div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Privacy Guard</p>
              <p className="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens locally in your browser. Your images never touch a server.</p>
            </div>
          </div>
        </div>
      </div>

      {generating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-slate-900">{progress}%</span></div>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Generating PDF</h3>
              <p className="text-slate-500 font-medium mt-1">{step}</p>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div style={{ width: `${progress}%` }} className="h-full bg-primary-600 transition-all duration-300" /></div>
          </div>
        </div>
      )}

      <AdSlot slotId="image_to_pdf_bottom" minHeight="250px" />
    </>
  );
}
