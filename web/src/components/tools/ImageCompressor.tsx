'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { Dropzone } from './Dropzone';
import { downloadBlob, downloadZip, formatSavings, formatSize, randomId } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

interface Job {
  id: string;
  originalFile: File;
  compressedFile?: File;
  previewUrl?: string;
  originalPreviewUrl: string;
  status: 'pending' | 'compressing' | 'done' | 'error';
  progress: number;
  originalSize: number;
  compressedSize?: number;
  savings?: number;
}

type Format = 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
interface Settings { quality: number; targetSizeMB: number; maxWidth?: number; maxHeight?: number; format: Format }

const ext = (mime: string) => mime.split('/')[1] || 'jpg';
const numOrUndef = (v: string) => (v === '' ? undefined : Number(v));
const inputCls = 'w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20';

export function ImageCompressor() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Job | null>(null);
  const [s, setS] = useState<Settings>({ quality: 0.75, targetSizeMB: 0.5, format: 'image/jpeg' });

  const urls = useRef(new Set<string>());
  const runId = useRef(0); // lets a settings change cancel a stale queue
  const settingsRef = useRef(s);
  settingsRef.current = s;

  const patch = (id: string, p: Partial<Job>) => {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, ...p } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...p } : a));
  };

  const compress = async (job: Job, myRun: number) => {
    patch(job.id, { status: 'compressing', progress: 10 });
    const cfg = settingsRef.current;
    try {
      const { default: imageCompression } = await import('browser-image-compression');
      const file = await imageCompression(job.originalFile, {
        maxSizeMB: cfg.targetSizeMB,
        maxWidthOrHeight: cfg.maxWidth || cfg.maxHeight || 1920,
        useWebWorker: true,
        initialQuality: cfg.quality,
        alwaysKeepResolution: false,
        onProgress: (p: number) => runId.current === myRun && patch(job.id, { progress: Math.max(10, p) }),
        fileType: cfg.format === 'original' ? undefined : cfg.format,
      });
      if (runId.current !== myRun) return;
      if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      urls.current.add(previewUrl);
      patch(job.id, {
        status: 'done',
        progress: 100,
        compressedFile: file,
        previewUrl,
        compressedSize: file.size,
        savings: Math.round(((job.originalSize - file.size) / job.originalSize) * 100),
      });
      void logToolUsage('image_optimizer', 'compress', { bytesSaved: job.originalSize - file.size });
    } catch (e) {
      console.error('Compression failed:', e);
      patch(job.id, { status: 'error' });
      toast.error(`Failed to compress ${job.originalFile.name}`);
    }
  };

  const runQueue = async (list: Job[]) => {
    const myRun = ++runId.current;
    for (const job of list) {
      if (runId.current !== myRun) return;
      await compress(job, myRun);
    }
  };

  const handleFiles = (files: FileList) => {
    const fresh: Job[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => {
        const originalPreviewUrl = URL.createObjectURL(file);
        urls.current.add(originalPreviewUrl);
        return { id: randomId(), originalFile: file, originalSize: file.size, originalPreviewUrl, status: 'pending' as const, progress: 0 };
      });
    if (!fresh.length) return;
    setJobs((c) => [...c, ...fresh]);
    void runQueue(fresh);
  };

  // Re-run everything shortly after any setting changes (Angular did this on the input's `change` event).
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!jobsRef.current.length) return;
    const t = setTimeout(() => {
      const reset = jobsRef.current.map((j) => ({ ...j, status: 'pending' as const, progress: 0 }));
      setJobs(reset);
      void runQueue(reset);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  useEffect(() => {
    const set = urls.current;
    return () => { runId.current++; set.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} }); set.clear(); };
  }, []);

  const remove = (id: string) => {
    const j = jobs.find((x) => x.id === id);
    [j?.originalPreviewUrl, j?.previewUrl].forEach((u) => { if (u) { URL.revokeObjectURL(u); urls.current.delete(u); } });
    setJobs((c) => c.filter((x) => x.id !== id));
    setActive((a) => (a?.id === id ? null : a));
  };
  const clearAll = () => {
    runId.current++;
    urls.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    urls.current.clear();
    setJobs([]);
    setActive(null);
  };

  const allDone = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'error');
  const downloadOne = (j: Job) => j.compressedFile && downloadBlob(j.compressedFile, `optimized-${j.originalFile.name.split('.')[0]}.${ext(j.compressedFile.type)}`);
  const downloadAll = async () => {
    const done = jobs.filter((j) => j.status === 'done' && j.compressedFile);
    await downloadZip(done.map((j) => ({ name: `${j.originalFile.name.split('.')[0]}.${ext(j.compressedFile!.type)}`, data: j.compressedFile! })), `innkie-optimized-batch-${Date.now()}.zip`);
    toast.success('ZIP download started!');
    void logToolUsage('image_optimizer', 'download_zip', { count: done.length });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div>
              <div className="flex justify-between items-end mb-4">
                <label htmlFor="ic-quality" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Quality</label>
                <span className="text-primary-600 font-black text-lg">{(s.quality * 100).toFixed(0)}%</span>
              </div>
              <input id="ic-quality" type="range" min="0.1" max="1" step="0.05" value={s.quality} onChange={(e) => setS({ ...s, quality: Number(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" />
              <div className="flex justify-between mt-2 text-[8px] font-black text-slate-400 uppercase"><span>Smaller File</span><span>Better Quality</span></div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resize Dimensions</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ic-w" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Max Width</label>
                  <input id="ic-w" type="number" value={s.maxWidth ?? ''} onChange={(e) => setS({ ...s, maxWidth: numOrUndef(e.target.value) })} placeholder="Auto" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ic-h" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Max Height</label>
                  <input id="ic-h" type="number" value={s.maxHeight ?? ''} onChange={(e) => setS({ ...s, maxHeight: numOrUndef(e.target.value) })} placeholder="Auto" className={inputCls} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ic-format" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Output Format</label>
              <select id="ic-format" value={s.format} onChange={(e) => setS({ ...s, format: e.target.value as Format })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer">
                <option value="original">Original Format</option>
                <option value="image/webp">WebP (Recommended)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <label htmlFor="ic-size" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max File Size</label>
                <span className="text-primary-600 font-black text-sm">{s.targetSizeMB} MB</span>
              </div>
              <input id="ic-size" type="number" step="0.1" min="0.05" value={s.targetSizeMB} onChange={(e) => setS({ ...s, targetSizeMB: Number(e.target.value) || 0.05 })} className={inputCls} />
              <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight italic">The optimizer will aggressively downscale to hit this target.</p>
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-3">
              <button type="button" disabled={!allDone} onClick={downloadAll} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale">
                <i className="fas fa-file-archive" /> Download All (.zip)
              </button>
              {jobs.length > 0 && (
                <button type="button" onClick={clearAll} className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Clear Workspace</button>
              )}
            </div>
          </div>
          <AdSlot slotId="image_compressor_sidebar" minHeight="250px" />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Dropzone onFiles={handleFiles} accept="image/*" compact={jobs.length > 0} icon="fa-images" title="Click or drag images here to begin" titleCompact="Add more images" subtitle="Supports batch processing for JPG, PNG, and WebP" subtitleCompact="" />

          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group/job hover:border-primary-200 transition-all">
                <div className="flex flex-col md:flex-row items-center p-4 gap-6">
                  <button type="button" aria-label={`Compare ${job.originalFile.name}`} onClick={() => job.status === 'done' && setActive(job)} className="shrink-0 w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={job.previewUrl || job.originalPreviewUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity"><i className="fas fa-search-plus" /></div>
                  </button>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 truncate max-w-[200px]">{job.originalFile.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatSize(job.originalSize)}</p>
                      </div>
                      {job.status === 'done' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{formatSavings(job.savings)}</span>}
                    </div>
                    <div className="relative h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary-600 transition-all duration-300" style={{ width: `${job.progress}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className={`flex items-center gap-1.5 ${job.status === 'compressing' ? 'text-primary-600' : job.status === 'done' ? 'text-emerald-500' : ''}`}>
                        {job.status === 'compressing' && <i className="fas fa-circle-notch animate-spin" />}
                        {job.status === 'done' && <i className="fas fa-check-circle" />}
                        {job.status}
                      </span>
                      {job.status === 'done' && <span className="text-slate-400">{formatSize(job.compressedSize || 0)}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 flex gap-2">
                    {job.status === 'done' && (
                      <button type="button" aria-label="Download" onClick={() => downloadOne(job)} className="w-10 h-10 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl flex items-center justify-center transition-all"><i className="fas fa-download" /></button>
                    )}
                    <button type="button" aria-label="Remove" onClick={() => remove(job.id)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all"><i className="fas fa-times" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Quality inspection">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900">Quality Inspection</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compare visual fidelity</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setActive(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">Original</span>
                  <span className="text-sm font-bold text-slate-400">{formatSize(active.originalSize)}</span>
                </div>
                <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.originalPreviewUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">Optimized ({(s.quality * 100).toFixed(0)}%)</span>
                  <span className="text-sm font-black text-primary-600">{formatSize(active.compressedSize || 0)}</span>
                </div>
                <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-primary-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.previewUrl} alt="Optimized" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-8">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Savings</p><p className="text-2xl font-black text-emerald-500">{formatSavings(active.savings)}</p></div>
                <div className="hidden sm:block"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bytes Saved</p><p className="text-2xl font-black text-slate-700">{formatSize(active.originalSize - (active.compressedSize || 0))}</p></div>
              </div>
              <button type="button" onClick={() => downloadOne(active)} className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">Download This Image</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
