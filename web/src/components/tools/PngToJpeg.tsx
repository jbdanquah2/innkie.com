'use client';
import { useCallback, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { Dropzone } from './Dropzone';
import { downloadBlob, downloadZip, fileToDataUrl, formatSavings, formatSize, randomId } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

interface Job {
  id: string;
  file: File;
  convertedFile?: File;
  previewUrl?: string;
  originalPreviewUrl?: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  originalSize: number;
  convertedSize?: number;
  savings?: number;
}

export function PngToJpeg() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Job | null>(null);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  const update = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((cur) => cur.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...patch } : a));
  }, []);

  const convert = useCallback(
    async (job: Job) => {
      update(job.id, { status: 'converting', progress: 20 });
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        const converted = await imageCompression(job.file, {
          maxSizeMB: 5,
          maxWidthOrHeight: 4096,
          useWebWorker: true,
          initialQuality: 0.92,
          fileType: 'image/jpeg',
        });
        const previewUrl = await fileToDataUrl(converted);
        update(job.id, {
          status: 'done',
          progress: 100,
          convertedFile: converted,
          convertedSize: converted.size,
          savings: Math.round(((job.originalSize - converted.size) / job.originalSize) * 100),
          previewUrl,
        });
        void logToolUsage('png_to_jpeg', 'convert');
      } catch {
        update(job.id, { status: 'error' });
        toast.error(`Failed to convert ${job.file.name}`);
      }
    },
    [update, toast],
  );

  const handleFiles = async (list: FileList) => {
    const fresh: Job[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.includes('png')) {
        toast.warn(`Skipped ${file.name} (not a PNG)`);
        continue;
      }
      fresh.push({ id: randomId(), file, originalSize: file.size, originalPreviewUrl: await fileToDataUrl(file), status: 'pending', progress: 0 });
    }
    setJobs((cur) => [...cur, ...fresh]);
    for (const job of fresh) await convert(job); // sequential, like the Angular queue
  };

  const finalName = (name: string) => `${prefix}${name.split('.')[0]}${suffix}.jpg`;
  const allDone = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'error');

  const downloadOne = (j: Job) => j.convertedFile && downloadBlob(j.convertedFile, finalName(j.file.name));
  const downloadAll = async () => {
    const files = jobs.filter((j) => j.status === 'done' && j.convertedFile).map((j) => ({ name: finalName(j.file.name), data: j.convertedFile! }));
    await downloadZip(files, `converted-batch-${Date.now()}.zip`);
    toast.success('ZIP download started!');
  };

  const field = 'w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div className="space-y-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Filenames Pattern</span>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="p2j-prefix" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Prefix</label>
                  <input id="p2j-prefix" type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. web-" className={field} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="p2j-suffix" className="text-[8px] font-bold text-slate-400 uppercase ml-1">Suffix</label>
                  <input id="p2j-suffix" type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="e.g. -converted" className={field} />
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic px-1">Preview: {prefix}image{suffix}.jpg</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 space-y-3">
              <button type="button" disabled={!allDone} onClick={downloadAll} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale">
                <i className="fas fa-file-archive" /> Download All (.zip)
              </button>
              {jobs.length > 0 && (
                <button type="button" onClick={() => { setJobs([]); setActive(null); }} className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">
                  Clear Workspace
                </button>
              )}
            </div>
          </div>
          <AdSlot slotId="png_to_jpeg_sidebar" minHeight="250px" />
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Dropzone
            onFiles={handleFiles}
            accept="image/png"
            compact={jobs.length > 0}
            icon="fa-file-export"
            title="Drop your PNGs here"
            titleCompact="Add more PNGs"
            subtitle="or click to browse your files"
            subtitleCompact="Click or drag to continue"
          />

          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group/job hover:border-primary-200 transition-all">
                <button
                  type="button"
                  aria-label={`Compare ${job.file.name}`}
                  onClick={() => job.status === 'done' && setActive(job)}
                  className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 relative cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={job.previewUrl || job.originalPreviewUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/job:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <i className="fas fa-search-plus" />
                  </div>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{job.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{formatSize(job.originalSize)}</span>
                    {job.status === 'done' && (
                      <>
                        <i className="fas fa-arrow-right text-[8px] text-slate-300" />
                        <span className="text-[10px] font-black text-primary-600 uppercase">{formatSize(job.convertedSize || 0)}</span>
                      </>
                    )}
                    <span className="text-slate-200">•</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${job.status === 'done' ? 'text-emerald-500' : 'text-primary-500'}`}>
                      {job.status === 'done' ? formatSavings(job.savings) : job.status}
                    </span>
                  </div>
                  {job.status === 'converting' && (
                    <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 transition-all" style={{ width: `${job.progress}%` }} />
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex gap-2">
                  {job.status === 'done' && (
                    <button type="button" aria-label="Download" onClick={() => downloadOne(job)} className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                      <i className="fas fa-download" />
                    </button>
                  )}
                  <button type="button" aria-label="Remove" onClick={() => { setJobs((c) => c.filter((j) => j.id !== job.id)); setActive((a) => (a?.id === job.id ? null : a)); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <i className="fas fa-times" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Conversion quality check">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900">Conversion Quality Check</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{active.file.name}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setActive(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <i className="fas fa-times text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Original PNG</span>
                  <span className="text-sm font-bold text-slate-400">{formatSize(active.originalSize)}</span>
                </div>
                <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center checkerboard">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.originalPreviewUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">Converted JPEG</span>
                  <span className="text-sm font-black text-primary-600">{formatSize(active.convertedSize || 0)}</span>
                </div>
                <div className="aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-primary-100 flex items-center justify-center shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.previewUrl} alt="Converted" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Savings</p>
                  <p className="text-2xl font-black text-emerald-500">{formatSavings(active.savings)}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Filename</p>
                  <p className="text-sm font-black text-slate-700">{finalName(active.file.name)}</p>
                </div>
              </div>
              <button type="button" onClick={() => downloadOne(active)} className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">
                Download JPEG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
