'use client';
import { useEffect, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { downloadBlob, downloadZip, formatSize, randomId } from '@/lib/files';
import { baseName, buildFileName, uniqueNames } from '@/lib/image-tools';
import { logToolUsage } from '@/lib/metrics';
import { clampOutput, looksLikeSvg, outputSize, svgIntrinsicSize, withSize, type SizeMode } from '@/lib/svg';
import { useToast } from '@/lib/toast';
import { BatchRow, CompareDialog } from './BatchUi';
import { Dropzone } from './Dropzone';

interface Result { blob: Blob; url: string; width: number; height: number; note?: string }
interface Job {
  id: string;
  name: string;
  svg: string;
  /** A blob: URL used only to *show* the source. An <img> never runs scripts inside an SVG. */
  svgUrl: string;
  status: 'pending' | 'working' | 'done' | 'error';
  progress: number;
  result?: Result;
  error?: string;
}
interface Settings { mode: SizeMode; scale: number; width: number; transparent: boolean; background: string }

const DEFAULTS: Settings = { mode: 'scale', scale: 2, width: 512, transparent: true, background: '#ffffff' };
const svgUrlOf = (svg: string) => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';

export function SvgToPng() {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [pasted, setPasted] = useState('');
  const [active, setActive] = useState<Job | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  const runId = useRef(0);
  const settingsRef = useRef(s);
  settingsRef.current = s;
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const pastedCount = useRef(0);

  const patch = (id: string, p: Partial<Job>) => {
    setJobs((c) => c.map((j) => (j.id === id ? { ...j, ...p } : j)));
    setActive((a) => (a && a.id === id ? { ...a, ...p } : a));
  };

  const convert = async (job: Job, myRun: number) => {
    patch(job.id, { status: 'working', progress: 20, error: undefined });
    const cfg = settingsRef.current;
    let url = '';
    try {
      const intrinsic = svgIntrinsicSize(job.svg);
      const wanted = outputSize(intrinsic, { mode: cfg.mode, scale: cfg.scale, width: cfg.width });
      const size = clampOutput(wanted.width, wanted.height);
      // Loading the SVG at exactly the output size makes the browser rasterise the vector sharply.
      url = svgUrlOf(withSize(job.svg, size.width, size.height, intrinsic));
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('invalid-svg')); img.src = url; });
      patch(job.id, { progress: 60 });

      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-canvas');
      if (!cfg.transparent) { ctx.fillStyle = cfg.background; ctx.fillRect(0, 0, size.width, size.height); }
      ctx.drawImage(img, 0, 0, size.width, size.height);
      const blob = await new Promise<Blob>((res, rej) => {
        try { canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/png'); } catch (e) { rej(e); }
      });
      if (runId.current !== myRun) return;

      const notes: string[] = [];
      if (intrinsic.source === 'default') notes.push('This SVG does not state a size, so 300 × 150 was assumed. Use "Width" to set the output size you want.');
      if (size.reduced) notes.push(`Reduced to ${size.width} × ${size.height} px, the most your browser can draw.`);
      if (job.result) URL.revokeObjectURL(job.result.url);
      patch(job.id, { status: 'done', progress: 100, result: { blob, url: URL.createObjectURL(blob), width: size.width, height: size.height, note: notes.join(' ') || undefined } });
      void logToolUsage('svg_to_png', 'convert');
    } catch (e) {
      console.error(e);
      const name = e instanceof Error ? e.message : '';
      const error = name === 'invalid-svg'
        ? 'The browser could not read this as an SVG image. The code may be incomplete or invalid.'
        : e instanceof DOMException && e.name === 'SecurityError'
          ? 'This SVG uses features that browsers block when converting to PNG, such as external images or HTML inside the SVG.'
          : 'This SVG could not be converted. It may be too large for your browser.';
      if (runId.current === myRun) patch(job.id, { status: 'error', error });
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
    const notes: string[] = [];
    for (const file of Array.from(files)) {
      if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') { notes.push(`${file.name} is not an SVG file.`); continue; }
      const svg = await file.text();
      if (!looksLikeSvg(svg)) { notes.push(`${file.name} does not contain SVG code.`); continue; }
      fresh.push({ id: randomId(), name: file.name, svg, svgUrl: svgUrlOf(svg), status: 'pending', progress: 0 });
    }
    setSkipped(notes);
    addJobs(fresh);
  };

  const addPasted = () => {
    if (!looksLikeSvg(pasted)) return toast.error('That does not look like SVG code. It should contain an <svg> element.');
    pastedCount.current++;
    addJobs([{ id: randomId(), name: `pasted-${pastedCount.current}.svg`, svg: pasted, svgUrl: svgUrlOf(pasted), status: 'pending', progress: 0 }]);
    setPasted('');
  };

  // A change to the size or background re-renders every SVG.
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

  useEffect(() => () => {
    runId.current++;
    jobsRef.current.forEach((j) => { URL.revokeObjectURL(j.svgUrl); if (j.result) URL.revokeObjectURL(j.result.url); });
  }, []);

  const release = (j: Job) => { URL.revokeObjectURL(j.svgUrl); if (j.result) URL.revokeObjectURL(j.result.url); };
  const remove = (id: string) => {
    const j = jobs.find((x) => x.id === id);
    if (j) release(j);
    setJobs((c) => c.filter((x) => x.id !== id));
    setActive((a) => (a?.id === id ? null : a));
  };
  const clearAll = () => { runId.current++; jobs.forEach(release); setJobs([]); setActive(null); setSkipped([]); };

  const done = jobs.filter((j) => j.status === 'done' && j.result);
  const busy = jobs.some((j) => j.status === 'pending' || j.status === 'working');
  const nameFor = (j: Job) => buildFileName(baseName(j.name), { prefix, suffix, ext: 'png' });
  const downloadOne = (j: Job) => j.result && downloadBlob(j.result.blob, nameFor(j));
  const downloadAll = async () => {
    const names = uniqueNames(done.map(nameFor));
    await downloadZip(done.map((j, i) => ({ name: names[i], data: j.result!.blob })), `png-images-${Date.now()}.zip`);
    toast.success('ZIP download started');
  };

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((c) => ({ ...c, [k]: v }));
  const sizeTab = (m: SizeMode, text: string) => (
    <button type="button" role="tab" aria-selected={s.mode === m} onClick={() => set('mode', m)} className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${s.mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{text}</button>
  );
  const srcTab = (t: 'upload' | 'paste', text: string) => (
    <button type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{text}</button>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 lg:sticky lg:top-24" aria-label="Settings">
          <div>
            <p className={label}>Output size</p>
            <div role="tablist" aria-label="How to set the size" className="flex p-1 rounded-lg bg-slate-100 w-fit">{sizeTab('scale', 'Scale')}{sizeTab('width', 'Width')}</div>
            {s.mode === 'scale' ? (
              <div className="mt-3">
                <div className="flex items-baseline justify-between"><label htmlFor="sp-scale" className="text-xs text-slate-500">Multiply the SVG&apos;s own size</label><span className="text-sm font-semibold text-slate-900">{s.scale}×</span></div>
                <input id="sp-scale" type="range" min="1" max="8" step="1" value={s.scale} onChange={(e) => set('scale', Number(e.target.value))} className="w-full accent-primary-600" />
                <div className="flex justify-between text-xs text-slate-500"><span>1×</span><span>8×</span></div>
              </div>
            ) : (
              <div className="mt-3">
                <label htmlFor="sp-width" className="block text-xs text-slate-500 mb-1">Width in pixels</label>
                <input id="sp-width" type="number" min={1} max={16384} value={s.width} onChange={(e) => set('width', Math.min(16384, Math.max(1, Math.round(Number(e.target.value)) || 512)))} className={field} />
                <p className="mt-2 text-xs text-slate-500">The height follows the SVG&apos;s proportions.</p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={s.transparent} onChange={(e) => set('transparent', e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-primary-600" />Transparent background</label>
            {!s.transparent && (
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="sp-bg" className="sr-only">Background colour</label>
                <input id="sp-bg" type="color" value={s.background} onChange={(e) => set('background', e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 bg-white p-1" />
                <span className="font-mono text-sm text-slate-600">{s.background}</span>
              </div>
            )}
          </div>

          <div>
            <p className={label}>File names</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="sp-prefix" className="block text-xs text-slate-500 mb-1">Prefix</label><input id="sp-prefix" type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={field} /></div>
              <div><label htmlFor="sp-suffix" className="block text-xs text-slate-500 mb-1">Suffix</label><input id="sp-suffix" type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="@2x" className={field} /></div>
            </div>
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">Nothing is uploaded. Scripts inside an SVG are never run.</p>

          <div className="space-y-2">
            <button type="button" disabled={!done.length || busy} onClick={downloadAll} className="w-full px-5 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Download all as ZIP{done.length ? ` (${done.length})` : ''}</button>
            {jobs.length > 0 && <button type="button" onClick={clearAll} className="w-full py-2 text-sm font-medium text-rose-700 hover:underline">Clear all</button>}
          </div>
        </section>

        <div className="min-w-0 space-y-4">
          <div role="tablist" aria-label="Where the SVG comes from" className="flex p-1 rounded-lg bg-slate-100 w-fit">{srcTab('upload', 'Upload files')}{srcTab('paste', 'Paste SVG code')}</div>
          {tab === 'upload' ? (
            <Dropzone onFiles={(f) => void handleFiles(f)} accept=".svg,image/svg+xml" compact={jobs.length > 0} icon="fa-vector-square" title="Drop SVG files here, or click to choose" titleCompact="Add more SVG files" subtitle="Convert as many as you like in one go." subtitleCompact="Drop them here or click" />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <label htmlFor="svg-code" className="block text-sm font-medium text-slate-700 mb-1.5">SVG code</label>
              <textarea id="svg-code" value={pasted} onChange={(e) => setPasted(e.target.value)} spellCheck={false} rows={8} placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>' className={`${field} font-mono text-xs resize-y`} />
              <button type="button" onClick={addPasted} disabled={!pasted.trim()} className="mt-3 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40">Convert to PNG</button>
            </div>
          )}

          {skipped.length > 0 && (
            <ul role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1 list-disc pl-8">{skipped.map((m) => <li key={m}>{m}</li>)}</ul>
          )}

          <ul className="space-y-3" aria-label="Files">
            {jobs.map((job) => (
              <BatchRow
                key={job.id}
                item={{
                  id: job.id,
                  name: job.name,
                  beforeSize: new Blob([job.svg]).size,
                  afterSize: job.result?.blob.size,
                  width: job.result?.width,
                  height: job.result?.height,
                  thumbUrl: job.result?.url ?? job.svgUrl,
                  status: job.status,
                  progress: job.progress,
                  status_line: job.result ? <span className="text-slate-700">PNG, {formatSize(job.result.blob.size)}</span> : undefined,
                  note: job.result?.note,
                  error: job.error,
                }}
                onCompare={() => setActive(job)}
                onDownload={() => downloadOne(job)}
                onRemove={() => remove(job.id)}
              />
            ))}
          </ul>
          <AdSlot slotId="svg_to_png_sidebar" minHeight="250px" />
        </div>
      </div>

      {active?.result && (
        <CompareDialog
          title={active.name}
          subtitle={`${active.result.width} × ${active.result.height} px PNG`}
          left={{ label: 'SVG', url: active.svgUrl, size: new Blob([active.svg]).size }}
          right={{ label: 'PNG', url: active.result.url, size: active.result.blob.size }}
          onClose={() => setActive(null)}
          onDownload={() => downloadOne(active)}
        />
      )}
    </>
  );
}
