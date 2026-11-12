'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip, formatSize, randomId } from '@/lib/files';
import { compressImage } from '@/lib/image-compress';
import { baseName, buildFileName, percentSaved, uniqueNames } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';
import { BatchRow, CompareDialog } from './BatchUi';
import { Dropzone } from './Dropzone';

interface Result { file: File; url: string; width: number; height: number }
interface Job {
  id: string;
  file: File;
  originalUrl: string;
  status: 'pending' | 'working' | 'done' | 'error';
  progress: number;
  result?: Result;
}
interface Settings { quality: number; background: string; shrink: boolean; maxSide: number }

const DEFAULTS: Settings = { quality: 0.92, background: '#ffffff', shrink: false, maxSide: 4096 };
const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const isPng = (f: File) => f.type === 'image/png' || (f.type === '' && /\.png$/i.test(f.name));

export function PngToJpeg() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [active, setActive] = useState<Job | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const urls = useRef(new Set<string>());
  const runId = useRef(0);
  const settingsRef = useRef(s);
  settingsRef.current = s;
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const patch = (id: string, p: Partial<Job>) => {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, ...p } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...p } : a));
  };

  const convert = async (job: Job, myRun: number) => {
    patch(job.id, { status: 'working', progress: 5 });
    const cfg = settingsRef.current;
    try {
      const work = compressImage(job.file, {
        type: 'image/jpeg',
        quality: cfg.quality,
        allowResize: cfg.shrink,
        maxWidth: cfg.maxSide,
        maxHeight: cfg.maxSide,
        background: cfg.background,
      }, (pct) => { if (runId.current === myRun) patch(job.id, { progress: Math.max(5, pct) }); });
      const out = await Promise.race([work, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Timed out')), 120_000))]);
      if (runId.current !== myRun) return;
      const file = new File([out.blob], `${baseName(job.file.name)}.jpg`, { type: 'image/jpeg' });
      if (job.result) { URL.revokeObjectURL(job.result.url); urls.current.delete(job.result.url); }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      patch(job.id, { status: 'done', progress: 100, result: { file, url, width: out.width, height: out.height } });
      void logToolUsage('png_to_jpeg', 'convert');
    } catch (e) {
      console.error('Conversion failed:', e);
      if (runId.current === myRun) {
        patch(job.id, { status: 'error' });
        toast.error(`Could not convert ${job.file.name}`);
      }
    }
  };

  const runQueue = async (list: Job[]) => {
    const myRun = ++runId.current;
    for (const job of list) {
      if (runId.current !== myRun) return;
      await convert(job, myRun);
    }
  };

  const handleFiles = (files: FileList) => {
    const accepted: File[] = [];
    const notes: string[] = [];
    for (const f of Array.from(files)) {
      if (isPng(f)) accepted.push(f);
      else notes.push(`${f.name} is not a PNG. For JPG and WebP files use the Image Compressor.`);
    }
    setSkipped(notes);
    if (!accepted.length) return;
    const fresh: Job[] = accepted.map((file) => {
      const originalUrl = URL.createObjectURL(file);
      urls.current.add(originalUrl);
      return { id: randomId(), file, originalUrl, status: 'pending', progress: 0 };
    });
    setJobs((c) => [...c, ...fresh]);
    void runQueue(fresh);
  };

  // A change to quality, background or size limits re-converts every file from its original PNG.
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
  }, [s]);

  useEffect(() => {
    const set = urls.current;
    return () => { runId.current++; set.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* ignore */ } }); set.clear(); };
  }, []);

  const remove = (id: string) => {
    const j = jobs.find((x) => x.id === id);
    [j?.originalUrl, j?.result?.url].forEach((u) => { if (u) { URL.revokeObjectURL(u); urls.current.delete(u); } });
    setJobs((c) => c.filter((x) => x.id !== id));
    setActive((a) => (a?.id === id ? null : a));
  };
  const clearAll = () => {
    runId.current++;
    urls.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* ignore */ } });
    urls.current.clear();
    setJobs([]);
    setActive(null);
    setSkipped([]);
  };

  const done = jobs.filter((j) => j.status === 'done' && j.result);
  const busy = jobs.some((j) => j.status === 'pending' || j.status === 'working');
  const nameFor = (j: Job) => buildFileName(baseName(j.file.name), { prefix, suffix, ext: 'jpg' });
  const downloadOne = (j: Job) => j.result && downloadBlob(j.result.file, nameFor(j));
  const downloadAll = async () => {
    const names = uniqueNames(done.map(nameFor));
    await downloadZip(done.map((j, i) => ({ name: names[i], data: j.result!.file })), `jpeg-images-${Date.now()}.zip`);
    toast.success('ZIP download started');
  };

  const totals = useMemo(() => {
    const before = done.reduce((n, j) => n + j.file.size, 0);
    const after = done.reduce((n, j) => n + (j.result?.file.size ?? 0), 0);
    return { before, after, saved: percentSaved(before, after) };
  }, [done]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((c) => ({ ...c, [k]: v }));
  const sample = buildFileName('photo', { prefix, suffix, ext: 'jpg' });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="pj-quality" className={label}>JPEG quality</label>
              <span className="text-sm font-semibold text-slate-900">{Math.round(s.quality * 100)}%</span>
            </div>
            <input id="pj-quality" type="range" min="0.5" max="1" step="0.01" value={s.quality} onChange={(e) => set('quality', Number(e.target.value))} className="w-full accent-primary-600" />
            <div className="flex justify-between text-xs text-slate-500"><span>Smaller file</span><span>Better quality</span></div>
          </div>

          <div>
            <label htmlFor="pj-bg" className={label}>Background for transparent areas</label>
            <div className="flex items-center gap-3">
              <input id="pj-bg" type="color" value={s.background} onChange={(e) => set('background', e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" />
              <span className="font-mono text-sm text-slate-600">{s.background}</span>
              {s.background.toLowerCase() !== '#ffffff' && <button type="button" onClick={() => set('background', '#ffffff')} className="text-sm font-medium text-primary-700 hover:underline">White</button>}
            </div>
            <p className="mt-2 text-xs text-slate-500">JPEG cannot be transparent, so any transparent part of a PNG is filled with this colour.</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={s.shrink} onChange={(e) => set('shrink', e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />Shrink very large images</label>
            {s.shrink && (
              <div className="mt-3">
                <label htmlFor="pj-side" className="block text-xs text-slate-500 mb-1">Longest side (px)</label>
                <input id="pj-side" type="number" min={16} value={s.maxSide} onChange={(e) => set('maxSide', Math.max(16, Math.round(Number(e.target.value)) || 4096))} className={field} />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">{s.shrink ? 'Larger images are scaled down to fit, keeping their proportions.' : 'Images keep their full size.'}</p>
          </div>

          <div>
            <p className={label}>File names</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pj-prefix" className="block text-xs text-slate-500 mb-1">Prefix</label>
                <input id="pj-prefix" type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="web-" className={field} />
              </div>
              <div>
                <label htmlFor="pj-suffix" className="block text-xs text-slate-500 mb-1">Suffix</label>
                <input id="pj-suffix" type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="-small" className={field} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Example: <span className="font-mono">{sample}</span></p>
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Nothing is uploaded. Hidden metadata is not carried into the JPEG.</p>

          <div className="space-y-2">
            <button type="button" disabled={!done.length || busy} onClick={downloadAll} className="w-full px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Download all as ZIP{done.length ? ` (${done.length})` : ''}
            </button>
            {jobs.length > 0 && <button type="button" onClick={clearAll} className="w-full py-2 text-sm font-medium text-rose-700 hover:underline">Clear all</button>}
          </div>
        </section>

        <div className="min-w-0 space-y-4">
          <Dropzone
            onFiles={handleFiles}
            accept="image/png,.png"
            compact={jobs.length > 0}
            icon="fa-file-image"
            title="Drop PNG files here, or click to choose"
            titleCompact="Add more PNG files"
            subtitle="Convert as many as you like in one go."
            subtitleCompact="Drop them here or click"
          />

          {skipped.length > 0 && (
            <ul role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1 list-disc pl-8">
              {skipped.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}

          {jobs.length > 0 && (
            <p className="text-sm text-slate-600" role="status">
              <strong className="text-slate-900">{jobs.length}</strong> file{jobs.length === 1 ? '' : 's'}
              {done.length > 0 && <> · {formatSize(totals.before)} to <strong className="text-slate-900">{formatSize(totals.after)}</strong> ({totals.saved >= 0 ? `saved ${totals.saved}%` : `${Math.abs(totals.saved)}% larger`})</>}
              {busy && ' · working…'}
            </p>
          )}

          <ul className="space-y-3" aria-label="Files">
            {jobs.map((job) => {
              const r = job.result;
              const saved = r ? percentSaved(job.file.size, r.file.size) : 0;
              return (
                <BatchRow
                  key={job.id}
                  item={{
                    id: job.id,
                    name: job.file.name,
                    beforeSize: job.file.size,
                    afterSize: r?.file.size,
                    width: r?.width,
                    height: r?.height,
                    thumbUrl: r?.url ?? job.originalUrl,
                    status: job.status,
                    progress: job.progress,
                    status_line: r ? (saved >= 0
                      ? <span className="font-medium text-emerald-700">Saved {saved}%</span>
                      : <span className="text-amber-800">The JPEG is {Math.abs(saved)}% larger. This PNG may be a graphic that suits PNG better.</span>) : undefined,
                  }}
                  onCompare={() => setActive(job)}
                  onDownload={() => downloadOne(job)}
                  onRemove={() => remove(job.id)}
                />
              );
            })}
          </ul>
          <AdSlot slotId="png_to_jpeg_sidebar" minHeight="250px" />
        </div>
      </div>

      {active?.result && (
        <CompareDialog
          title={active.file.name}
          subtitle={`${formatSize(active.file.size)} to ${formatSize(active.result.file.size)}`}
          left={{ label: 'Original PNG', url: active.originalUrl, size: active.file.size }}
          right={{ label: 'JPEG', url: active.result.url, size: active.result.file.size }}
          onClose={() => setActive(null)}
          onDownload={() => downloadOne(active)}
        />
      )}
    </>
  );
}
