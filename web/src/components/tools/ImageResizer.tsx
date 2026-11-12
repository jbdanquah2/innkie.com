'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { fileToDataUrl } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

const PRESETS = [
  { label: 'Instagram Square', width: 1080, height: 1080, icon: 'fab fa-instagram' },
  { label: 'Twitter Post', width: 1200, height: 675, icon: 'fab fa-twitter' },
  { label: 'YouTube Thmb', width: 1280, height: 720, icon: 'fab fa-youtube' },
  { label: 'Standard HD', width: 1920, height: 1080, icon: 'fas fa-desktop' },
];

const MAX_DIM = 16384; // browsers refuse larger canvases and silently produce blank output

export function ImageResizer() {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState(1);
  const [locked, setLocked] = useState(true);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  // What to do when the target shape differs from the photo's: cut the edges off (crop) or squash it (stretch).
  const [fit, setFit] = useState<'crop' | 'stretch'>('crop');

  const loadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.warn(`${file.name} is not an image`);
    const el = new Image();
    el.onload = () => {
      setImg(el);
      setRatio(el.width / el.height);
      setW(el.width);
      setH(el.height);
    };
    el.onerror = () => toast.error('Could not read that image');
    el.src = await fileToDataUrl(file);
  };

  // Redraw the preview whenever the image or target size changes.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !img || !w || !h || w > MAX_DIM || h > MAX_DIM) return;
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    if (format === 'image/jpeg') {
      // JPEG has no transparency: without a backing colour transparent areas would export as black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    if (fit === 'crop') {
      // "Cover": scale until the target is filled, then trim the overflow equally from both sides.
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale;
      const sh = h / scale;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }, [img, w, h, fit, format]);

  const onW = (v: string) => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    setW(n);
    if (locked && ratio) setH(Math.round(n / ratio));
  };
  const onH = (v: string) => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    setH(n);
    if (locked && ratio) setW(Math.round(n * ratio));
  };

  const download = () => {
    const c = canvasRef.current;
    if (!c || !w || !h) return;
    const a = document.createElement('a');
    a.download = `innkie-resized-${Date.now()}.${format.split('/')[1]}`;
    a.href = c.toDataURL(format, 0.9);
    a.click();
    toast.success('Image resized and downloaded!');
    void logToolUsage('image_resizer', 'resize');
  };

  const numCls = 'w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-slate-700';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 space-y-6">
        {!img ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void loadImage(f); }}
            className="group relative bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <input type="file" aria-label="Choose an image" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadImage(f); }} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm"><i className="fas fa-cloud-upload-alt" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Drop your image here</h3>
              <p className="text-slate-400 font-medium italic">Supports PNG, JPEG, WebP (Max 20MB)</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center min-h-[400px] relative group">
            <canvas ref={canvasRef} className="max-w-full max-h-[600px] rounded-2xl shadow-2xl transition-all duration-300" />
            <button type="button" aria-label="Remove image" onClick={() => { setImg(null); setW(0); setH(0); }} className="absolute top-8 right-8 w-10 h-10 bg-white/90 backdrop-blur text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
              <i className="fas fa-times" />
            </button>
          </div>
        )}
        <AdSlot slotId="image_resizer_middle" format="horizontal" minHeight="90px" />
      </div>

      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions (px)</span>
              <button type="button" onClick={() => setLocked((v) => !v)} className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${locked ? 'text-primary-600' : ''}`}>
                <i className={`fas ${locked ? 'fa-lock' : 'fa-unlock'}`} />
                {locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="rs-w" className="text-[10px] font-bold text-slate-400 block ml-1">Width</label>
                <input id="rs-w" type="number" min={1} max={MAX_DIM} value={w || ''} onChange={(e) => onW(e.target.value)} className={numCls} />
              </div>
              <div className="space-y-2">
                <label htmlFor="rs-h" className="text-[10px] font-bold text-slate-400 block ml-1">Height</label>
                <input id="rs-h" type="number" min={1} max={MAX_DIM} value={h || ''} onChange={(e) => onH(e.target.value)} className={numCls} />
              </div>
            </div>
            <div className="mt-4">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">If the shape changes</span>
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200" role="group" aria-label="If the shape changes">
                {([['crop', 'Crop to fill'], ['stretch', 'Stretch']] as const).map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={fit === id} onClick={() => setFit(id)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${fit === id ? 'bg-white shadow-sm' : ''}`}>{label}</button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-snug">{fit === 'crop' ? 'Keeps proportions and trims the edges.' : 'Fills the exact size but can distort the image.'}</p>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Presets</span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => { setLocked(false); setW(p.width); setH(p.height); }} className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 group">
                  <i className={`${p.icon} text-slate-400 group-hover:text-primary-600 text-xs`} />
                  <span className="text-[10px] font-black text-slate-600 group-hover:text-primary-700">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Export Format</span>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['image/png', 'image/jpeg'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${format === f ? 'bg-white shadow-sm' : ''}`}>{f === 'image/png' ? 'PNG' : 'JPEG'}</button>
              ))}
            </div>
          </div>

          <button type="button" onClick={download} disabled={!img} className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none uppercase tracking-widest text-xs flex items-center justify-center gap-3">
            <i className="fas fa-download" /> Download Image
          </button>
        </div>

        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><i className="fas fa-shield-alt" /></div>
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Privacy Guard</p>
            <p className="text-[10px] font-medium text-emerald-600 leading-relaxed">Processing happens locally on your device. Your image is never uploaded to our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
