'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip, formatSize, randomId } from '@/lib/files';
import { compressImage, type OutType } from '@/lib/image-compress';
import { COMPRESSIBLE, baseName, describeUnsupported, extForMime, percentSaved, uniqueNames } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';
import { BatchRow, CompareDialog } from './BatchUi';
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
                    status: job.status === 'pending' ? 'pending' : job.status === 'working' ? 'working' : job.status === 'error' ? 'error' : 'done',
                    progress: job.progress,
                    status_line: r ? (r.keptOriginal
                      ? <span className="text-amber-800">Already well compressed, so the original is kept.</span>
                      : saved >= 0
                        ? <span className="font-medium text-emerald-700">Saved {saved}%</span>
                        : <span className="text-amber-800">{Math.abs(saved)}% larger: the new format is bigger for this image.</span>) : undefined,
                    note: r?.note,
                  }}
                  onCompare={() => setActive(job)}
                  onDownload={() => downloadOne(job)}
                  onRemove={() => remove(job.id)}
                />
              );
            })}
          </ul>
          <AdSlot slotId="image_compressor_sidebar" minHeight="250px" />
        </div>
      </div>

      {active?.result && (
        <CompareDialog
          title={active.file.name}
          subtitle={`${formatSize(active.file.size)} to ${formatSize(active.result.file.size)}`}
          left={{ label: 'Original', url: active.originalUrl, size: active.file.size }}
          right={{ label: 'Compressed', url: active.result.url, size: active.result.file.size }}
          onClose={() => setActive(null)}
          onDownload={() => downloadOne(active)}
        />
      )}
    </>
  );
}
