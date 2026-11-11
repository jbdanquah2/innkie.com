'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { Dropzone } from './Dropzone';
import { downloadBlob, downloadZip, randomId } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

interface Job {
  id: string;
  name: string;
  svgContent: string;
  svgUrl: string; // blob: URL used to *display* the source safely (<img> never runs scripts)
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  pngBlob?: Blob;
  previewUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
  finalWidth?: number;
  finalHeight?: number;
}

const mkSvgUrl = (svg: string) => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
const field = 'w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20';

export function SvgToPng() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Job | null>(null);
  const [scale, setScale] = useState(2);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasted, setPasted] = useState('');

  const runId = useRef(0);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const patch = (id: string, p: Partial<Job>) => {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, ...p } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...p } : a));
  };

  const convert = async (job: Job, myRun: number) => {
    patch(job.id, { status: 'converting', progress: 30 });
    let url = '';
    try {
      const img = new Image();
      url = mkSvgUrl(job.svgContent);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

      let w = img.width;
      let h = img.height;
      if (!w || !h) {
        const el = new DOMParser().parseFromString(job.svgContent, 'image/svg+xml').querySelector('svg');
        const vb = el?.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
        if (vb && vb.length === 4) { w = w || vb[2]; h = h || vb[3]; }
      }
      w = w || 300;
      h = h || 300;

      const sc = scaleRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = w * sc;
      canvas.height = h * sc;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
      if (runId.current !== myRun) return;

      patch(job.id, { status: 'done', progress: 100, pngBlob, previewUrl: URL.createObjectURL(pngBlob), originalWidth: w, originalHeight: h, finalWidth: canvas.width, finalHeight: canvas.height });
      void logToolUsage('svg_to_png', 'convert');
    } catch (e) {
      console.error(e);
      patch(job.id, { status: 'error' });
      toast.error(`Failed to convert ${job.name}`);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };

  const runQueue = async (list: Job[]) => {
    const myRun = ++runId.current;
    for (const j of list) {
      if (runId.current !== myRun) return;
      await convert(j, myRun);
    }
  };

  const addJobs = (fresh: Job[]) => {
    if (!fresh.length) return;
    setJobs((c) => [...c, ...fresh]);
    void runQueue(fresh);
  };

  const handleFiles = async (files: FileList) => {
    const fresh: Job[] = [];
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.svg')) { toast.warn(`Skipped ${file.name} (not an SVG)`); continue; }
      const svg = await file.text();
      fresh.push({ id: randomId(), name: file.name, svgContent: svg, svgUrl: mkSvgUrl(svg), status: 'pending', progress: 0 });
    }
    addJobs(fresh);
  };

  const handlePaste = () => {
    if (!pasted.trim()) return;
    const id = randomId();
    addJobs([{ id, name: `pasted-vector-${id.slice(0, 4)}.svg`, svgContent: pasted, svgUrl: mkSvgUrl(pasted), status: 'pending', progress: 0 }]);
    setPasted('');
  };

  // Re-render everything when the scale changes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!jobsRef.current.length) return;
    const t = setTimeout(() => {
      const reset = jobsRef.current.map((j) => ({ ...j, status: 'pending' as const, progress: 0 }));
      setJobs(reset);
      void runQueue(reset);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  useEffect(() => () => { runId.current++; jobsRef.current.forEach((j) => { URL.revokeObjectURL(j.svgUrl); if (j.previewUrl) URL.revokeObjectURL(j.previewUrl); }); }, []);

  const release = (j: Job) => { URL.revokeObjectURL(j.svgUrl); if (j.previewUrl) URL.revokeObjectURL(j.previewUrl); };
  const remove = (id: string) => { const j = jobs.find((x) => x.id === id); if (j) release(j); setJobs((c) => c.filter((x) => x.id !== id)); setActive((a) => (a?.id === id ? null : a)); };
  const clearAll = () => { runId.current++; jobs.forEach(release); setJobs([]); setActive(null); };

  const finalName = (name: string) => `${prefix}${name.split('.')[0]}${suffix}.png`;
  const allDone = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'error');
  const downloadOne = (j: Job) => j.pngBlob && downloadBlob(j.pngBlob, finalName(j.name));
  const downloadAll = async () => {
    await downloadZip(jobs.filter((j) => j.status === 'done' && j.pngBlob).map((j) => ({ name: finalName(j.name), data: j.pngBlob! })), `converted-vectors-${Date.now()}.zip`);
    toast.success('ZIP download started!');
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-1">
                <label htmlFor="svg-scale" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Scale</label>
                <span className="text-primary-600 font-black text-lg">{scale}x</span>
              </div>
              <input id="svg-scale" type="range" min="1" max="8" step="1" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase"><span>Standard</span><span>High DPI (8K Ready)</span></div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Naming Pattern</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="svg-prefix" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Prefix</label>
                  <input id="svg-prefix" type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="None" className={field} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="svg-suffix" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Suffix</label>
                  <input id="svg-suffix" type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="None" className={field} />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-3">
              <button type="button" disabled={!allDone} onClick={downloadAll} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale">
                <i className="fas fa-file-archive" /> Download All (.zip)
              </button>
              {jobs.length > 0 && <button type="button" onClick={clearAll} className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Clear Workspace</button>}
            </div>
          </div>
          <AdSlot slotId="svg_to_png_sidebar" minHeight="250px" />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit mx-auto lg:mx-0">
            {(['upload', 'paste'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-slate-900 text-white' : ''}`}>
                {m === 'upload' ? 'Upload Files' : 'Paste Code'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <Dropzone onFiles={handleFiles} accept=".svg" compact={jobs.length > 0} icon="fa-vector-square" title="Drop your SVGs here" titleCompact="Add more vectors" subtitle="or click to browse your files" subtitleCompact="Click or drag to continue" />
          ) : (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} aria-label="SVG code" placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...' className="w-full h-48 p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-100 rounded-2xl font-mono text-xs outline-none transition-all" />
              <div className="flex justify-end mt-4">
                <button type="button" onClick={handlePaste} disabled={!pasted.trim()} className="px-8 py-3 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50">Add Vector Code</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group/job hover:border-primary-200 transition-all">
                <button type="button" aria-label={`Inspect ${job.name}`} onClick={() => job.status === 'done' && setActive(job)} className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 relative cursor-zoom-in">
                  {job.status === 'done' ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={job.previewUrl} alt="" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fas fa-search-plus" /></div>
                    </>
                  ) : (
                    <i className="fas fa-file-code text-slate-200 text-xl" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{job.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {job.status === 'done' && (<><span className="text-[10px] font-bold text-slate-400 uppercase">{job.finalWidth}x{job.finalHeight}</span><span className="text-slate-200">•</span></>)}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${job.status === 'done' ? 'text-emerald-500' : 'text-primary-500'}`}>{job.status}</span>
                  </div>
                  {job.status === 'converting' && <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-primary-500 transition-all" style={{ width: `${job.progress}%` }} /></div>}
                </div>
                <div className="shrink-0 flex gap-2">
                  {job.status === 'done' && <button type="button" aria-label="Download" onClick={() => downloadOne(job)} className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm"><i className="fas fa-download" /></button>}
                  <button type="button" aria-label="Remove" onClick={() => remove(job.id)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"><i className="fas fa-times" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Raster quality check">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900">Raster Quality Check</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{active.name}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setActive(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Vector Source (SVG)</span>
                  <span className="text-sm font-bold text-slate-400">{active.originalWidth}x{active.originalHeight}</span>
                </div>
                <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center checkerboard p-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.svgUrl} alt="SVG source" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">Rasterized PNG ({scale}x)</span>
                  <span className="text-sm font-black text-primary-600">{active.finalWidth}x{active.finalHeight}</span>
                </div>
                <div className="aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-primary-100 flex items-center justify-center shadow-inner p-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.previewUrl} alt="PNG output" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-8">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale Factor</p><p className="text-2xl font-black text-primary-600">{scale}x</p></div>
                <div className="hidden sm:block"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Filename</p><p className="text-sm font-black text-slate-700">{finalName(active.name)}</p></div>
              </div>
              <button type="button" onClick={() => downloadOne(active)} className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">Download PNG</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
