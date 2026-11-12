'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip, formatSize, randomId } from '@/lib/files';
import { compressImage, type OutType } from '@/lib/image-compress';
import { COMPRESSIBLE, baseName, describeUnsupported, extForMime, percentSaved, uniqueNames } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';
import { Dropzone } from './Dropzone';

type Format = 'original' | 'image/webp' | 'image/jpeg' | 'image/png';
interface Settings {
  format: Format;
  quality: number;
  resize: boolean;
  maxWidth: number;
  maxHeight: number;
  limitSize: boolean;
  targetMB: number;
}
interface Result { file: File; url: string; keptOriginal: boolean; width: number; height: number; note?: string }
interface Job {
  id: string;
  file: File;
  originalUrl: string;
  status: 'pending' | 'working' | 'done' | 'error';
  progress: number;
  result?: Result;
}

const DEFAULTS: Settings = { format: 'image/webp', quality: 0.75, resize: true, maxWidth: 1920, maxHeight: 1920, limitSize: false, targetMB: 0.5 };
const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const check = 'h-4 w-4 rounded border-slate-300 accent-primary-600';
const sameType = (a: string, b: string) => a.replace('jpg', 'jpeg') === b.replace('jpg', 'jpeg');
const num = (v: string, fallback: number) => (v === '' ? fallback : Math.max(1, Math.round(Number(v)) || fallback));

export function ImageCompressor() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [active, setActive] = useState<Job | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const urls = useRef(new Set<string>());
  const runId = useRef(0); // a settings change cancels a stale queue
  const settingsRef = useRef(s);
  settingsRef.current = s;
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const patch = (id: string, p: Partial<Job>) => {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, ...p } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...p } : a));
  };

  const compress = async (job: Job, myRun: number) => {
    patch(job.id, { status: 'working', progress: 5 });
    const cfg = settingsRef.current;
    try {
      const wanted = (cfg.format === 'original' ? job.file.type.replace('image/jpg', 'image/jpeg') : cfg.format) as OutType;
      const work = compressImage(job.file, {
        type: wanted,
        quality: cfg.quality,
        allowResize: cfg.resize,
        maxWidth: cfg.maxWidth,
        maxHeight: cfg.maxHeight,
        targetBytes: cfg.limitSize ? Math.round(cfg.targetMB * 1024 * 1024) : undefined,
      }, (pct) => { if (runId.current === myRun) patch(job.id, { progress: Math.max(5, pct) }); });
      // A safety net: nothing is allowed to leave the queue waiting forever.
      const out = await Promise.race([work, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Timed out')), 120_000))]);
      if (runId.current !== myRun) return;
      const outFile = new File([out.blob], `${baseName(job.file.name)}.${extForMime(out.type)}`, { type: out.type });
      // Never hand back something bigger than what was put in, unless the format was changed on purpose.
      const keptOriginal = outFile.size >= job.file.size && sameType(out.type, job.file.type);
      const file = keptOriginal ? job.file : outFile;
      const notes: string[] = [];
      if (!sameType(out.type, wanted)) notes.push(`Your browser cannot create ${extForMime(wanted).toUpperCase()} images, so this was saved as ${extForMime(out.type).toUpperCase()}.`);
      if (out.limitMissed && !keptOriginal) notes.push('The size limit could not be reached without making the image too small.');
      if (job.result) { URL.revokeObjectURL(job.result.url); urls.current.delete(job.result.url); }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      patch(job.id, { status: 'done', progress: 100, result: { file, url, keptOriginal, width: out.width, height: out.height, note: notes.join(' ') || undefined } });
      void logToolUsage('image_optimizer', 'compress', { bytesSaved: job.file.size - file.size });
    } catch (e) {
      console.error('Compression failed:', e);
      if (runId.current === myRun) {
        patch(job.id, { status: 'error' });
        toast.error(`Could not compress ${job.file.name}. It may be damaged or too large for your browser.`);
      }
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
    const accepted: File[] = [];
    const notes: string[] = [];
    for (const f of Array.from(files)) {
      const why = describeUnsupported(f);
      if (why) notes.push(why); else accepted.push(f);
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

  // Changing a setting re-runs every image from its original, shortly after the last change.
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

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

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
  const totals = useMemo(() => {
    const before = done.reduce((n, j) => n + j.file.size, 0);
    const after = done.reduce((n, j) => n + (j.result?.file.size ?? 0), 0);
    return { before, after, saved: percentSaved(before, after) };
  }, [done]);

  const fileNameFor = (j: Job) => {
    const r = j.result!;
    return r.keptOriginal ? j.file.name : `${baseName(j.file.name)}-compressed.${extForMime(r.file.type)}`;
  };
  const downloadOne = (j: Job) => j.result && downloadBlob(j.result.file, fileNameFor(j));
  const downloadAll = async () => {
    const names = uniqueNames(done.map(fileNameFor));
    await downloadZip(done.map((j, i) => ({ name: names[i], data: j.result!.file })), `compressed-images-${Date.now()}.zip`);
    toast.success('ZIP download started');
    void logToolUsage('image_optimizer', 'download_zip', { count: done.length });
  };

  const pngOutput = s.format === 'image/png';
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((c) => ({ ...c, [k]: v }));

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
          <div>
            <label htmlFor="ic-format" className={label}>Output format</label>
            <select id="ic-format" value={s.format} onChange={(e) => set('format', e.target.value as Format)} className={field}>
              <option value="image/webp">WebP (smallest)</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG (lossless)</option>
              <option value="original">Keep each file&apos;s format</option>
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="ic-quality" className={label}>Quality</label>
              <span className="text-sm font-semibold text-slate-900">{Math.round(s.quality * 100)}%</span>
            </div>
            <input id="ic-quality" type="range" min="0.1" max="1" step="0.05" value={s.quality} onChange={(e) => set('quality', Number(e.target.value))} disabled={pngOutput} className="w-full accent-primary-600 disabled:opacity-40" />
            <div className="flex justify-between text-xs text-slate-500"><span>Smaller file</span><span>Better quality</span></div>
            {pngOutput && <p className="mt-2 text-xs text-slate-500">PNG is lossless, so quality does not change the result. Resize the image, or choose WebP or JPEG, to make it smaller.</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={s.resize} onChange={(e) => set('resize', e.target.checked)} className={check} />Shrink large images</label>
            {s.resize && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ic-w" className="block text-xs text-slate-500 mb-1">Max width (px)</label>
                  <input id="ic-w" type="number" min={1} value={s.maxWidth} onChange={(e) => set('maxWidth', num(e.target.value, 1920))} className={field} />
                </div>
                <div>
                  <label htmlFor="ic-h" className="block text-xs text-slate-500 mb-1">Max height (px)</label>
                  <input id="ic-h" type="number" min={1} value={s.maxHeight} onChange={(e) => set('maxHeight', num(e.target.value, 1920))} className={field} />
                </div>
                <p className="col-span-2 text-xs text-slate-500">Images bigger than this are scaled down to fit, keeping their proportions. Smaller images are never enlarged.</p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={s.limitSize} onChange={(e) => set('limitSize', e.target.checked)} className={check} />Also limit the file size</label>
            {s.limitSize && (
              <div className="mt-3">
                <label htmlFor="ic-size" className="block text-xs text-slate-500 mb-1">Largest file (MB)</label>
                <input id="ic-size" type="number" step="0.1" min="0.05" value={s.targetMB} onChange={(e) => set('targetMB', Math.max(0.05, Number(e.target.value) || 0.5))} className={field} />
                <p className="mt-2 text-xs text-slate-500">To reach this, quality and, if the box above is ticked, the dimensions may be reduced further.</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Camera, location and other hidden metadata are removed from every image. Nothing is uploaded.</p>

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
            accept={COMPRESSIBLE.join(',')}
            compact={jobs.length > 0}
            icon="fa-images"
            title="Drop images here, or click to choose"
            titleCompact="Add more images"
            subtitle="JPG, PNG and WebP. Add as many as you like."
            subtitleCompact="Drop them here or click"
          />

          {skipped.length > 0 && (
            <ul role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1 list-disc pl-8">
              {skipped.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}

          {jobs.length > 0 && (
            <p className="text-sm text-slate-600" role="status">
              <strong className="text-slate-900">{jobs.length}</strong> image{jobs.length === 1 ? '' : 's'}
              {done.length > 0 && <> · {formatSize(totals.before)} to <strong className="text-slate-900">{formatSize(totals.after)}</strong> ({totals.saved >= 0 ? `saved ${totals.saved}%` : `${Math.abs(totals.saved)}% larger`})</>}
              {busy && ' · working…'}
            </p>
          )}

          <ul className="space-y-3" aria-label="Images">
            {jobs.map((job) => {
              const r = job.result;
              const saved = r ? percentSaved(job.file.size, r.file.size) : 0;
              return (
                <li key={job.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <button type="button" disabled={!r} onClick={() => setActive(job)} aria-label={`Compare ${job.file.name}`} className="shrink-0 h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r?.url ?? job.originalUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{job.file.name}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatSize(job.file.size)}
                      {r && <> to <strong className="text-slate-900">{formatSize(r.file.size)}</strong> · {r.width} × {r.height} px</>}
                    </p>
                    {(job.status === 'working' || job.status === 'pending') && (
                      <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-primary-600 transition-all" style={{ width: `${job.progress}%` }} />
                      </div>
                    )}
                    {job.status === 'error' && <p className="mt-1 text-sm text-rose-700">Could not be compressed.</p>}
                    {r && (
                      <p className="mt-1 text-sm">
                        {r.keptOriginal
                          ? <span className="text-amber-800">Already well compressed, so the original is kept.</span>
                          : saved >= 0
                            ? <span className="font-medium text-emerald-700">Saved {saved}%</span>
                            : <span className="text-amber-800">{Math.abs(saved)}% larger: the new format is bigger for this image.</span>}
                      </p>
                    )}
                    {r?.note && <p className="mt-1 text-sm text-amber-800">{r.note}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r && job.status === 'done' && <button type="button" onClick={() => setActive(job)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:border-slate-500">Compare</button>}
                    {r && job.status === 'done' && <button type="button" onClick={() => downloadOne(job)} className="px-3 py-2 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700">Download</button>}
                    <button type="button" onClick={() => remove(job.id)} aria-label={`Remove ${job.file.name}`} className="px-3 py-2 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <AdSlot slotId="image_compressor_sidebar" minHeight="250px" />
        </div>
      </div>

      {active?.result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Compare original and compressed">
          <div className="absolute inset-0 bg-slate-900/80" onClick={() => setActive(null)} />
          <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{active.file.name}</h2>
                <p className="text-sm text-slate-600">{formatSize(active.file.size)} to {formatSize(active.result.file.size)}</p>
              </div>
              <button type="button" autoFocus onClick={() => setActive(null)} aria-label="Close" className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:border-slate-500">Close</button>
            </div>
            <div className="flex-1 overflow-auto p-5 grid md:grid-cols-2 gap-5">
              {([['Original', active.originalUrl, formatSize(active.file.size)], ['Compressed', active.result.url, formatSize(active.result.file.size)]] as const).map(([title, src, size]) => (
                <figure key={title} className="min-w-0">
                  <figcaption className="flex justify-between text-sm mb-2"><span className="font-medium text-slate-900">{title}</span><span className="text-slate-600">{size}</span></figcaption>
                  <div className="rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center min-h-[200px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={title} className="max-w-full max-h-[55vh] object-contain" />
                  </div>
                </figure>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end">
              <button type="button" onClick={() => downloadOne(active)} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700">Download</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
