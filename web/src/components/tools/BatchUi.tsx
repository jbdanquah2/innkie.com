'use client';
import { useEffect, type ReactNode } from 'react';
import { formatSize } from '@/lib/files';

export interface BatchItem {
  id: string;
  name: string;
  beforeSize: number;
  afterSize?: number;
  width?: number;
  height?: number;
  thumbUrl: string;
  status: 'pending' | 'working' | 'done' | 'error';
  progress: number;
  /** The coloured status line under the sizes (saved %, kept original, ...). */
  status_line?: ReactNode;
  note?: string;
  /** A specific reason for a failure, shown instead of the generic message. */
  error?: string;
}

const btnLight = 'px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 hover:border-slate-500';

/** One file in a batch: thumbnail, sizes, progress, status, and the actions. Shared by the image tools. */
export function BatchRow({ item, onCompare, onDownload, onRemove }: { item: BatchItem; onCompare?: () => void; onDownload: () => void; onRemove: () => void }) {
  const done = item.status === 'done';
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <button type="button" disabled={!done || !onCompare} onClick={onCompare} aria-label={`Compare ${item.name}`} className="shrink-0 h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:12px_12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 truncate">{item.name}</p>
        <p className="mt-0.5 text-sm text-slate-600">
          {formatSize(item.beforeSize)}
          {done && item.afterSize !== undefined && <> to <strong className="text-slate-900">{formatSize(item.afterSize)}</strong>{item.width && item.height ? <> · {item.width} × {item.height} px</> : null}</>}
        </p>
        {(item.status === 'working' || item.status === 'pending') && (
          <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress for ${item.name}`}>
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${item.progress}%` }} />
          </div>
        )}
        {item.status === 'error' && <p role="alert" className="mt-1 text-sm text-rose-700">{item.error ?? 'Could not be converted. The file may be damaged or too large for your browser.'}</p>}
        {done && item.status_line && <p className="mt-1 text-sm">{item.status_line}</p>}
        {done && item.note && <p className="mt-1 text-sm text-amber-800">{item.note}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {done && onCompare && <button type="button" onClick={onCompare} className={btnLight}>Compare</button>}
        {done && <button type="button" onClick={onDownload} className="px-3 py-2 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700">Download</button>}
        <button type="button" onClick={onRemove} aria-label={`Remove ${item.name}`} className="px-3 py-2 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
      </div>
    </li>
  );
}

/** Side-by-side comparison in a modal that closes with Escape. */
export function CompareDialog({ title, subtitle, left, right, onClose, onDownload }: {
  title: string;
  subtitle: string;
  left: { label: string; url: string; size: number };
  right: { label: string; url: string; size: number };
  onClose: () => void;
  onDownload: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`Compare ${title}`}>
      <div className="absolute inset-0 bg-slate-900/80" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">{title}</h2>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
          <button type="button" autoFocus onClick={onClose} aria-label="Close" className={btnLight}>Close</button>
        </div>
        <div className="flex-1 overflow-auto p-5 grid md:grid-cols-2 gap-5">
          {[left, right].map((side) => (
            <figure key={side.label} className="min-w-0">
              <figcaption className="flex justify-between text-sm mb-2"><span className="font-medium text-slate-900">{side.label}</span><span className="text-slate-600">{formatSize(side.size)}</span></figcaption>
              <div className="rounded-lg border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center min-h-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={side.url} alt={side.label} className="max-w-full max-h-[55vh] object-contain" />
              </div>
            </figure>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end">
          <button type="button" onClick={onDownload} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700">Download</button>
        </div>
      </div>
    </div>
  );
}
