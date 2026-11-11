'use client';
import { useEffect, useMemo, useState } from 'react';
import { btnGhost, card, labelCls, useCopy } from './ui';

/** Heuristic: epoch values with 12+ digits are milliseconds, otherwise seconds. */
export function parseEpoch(raw: string): Date | null {
  const s = raw.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  const ms = Math.abs(n) >= 1e11 ? n : n * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

export function relative(from: Date, now: Date): string {
  const diff = Math.round((from.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
  for (const [secs, unit] of units) if (abs >= secs || unit === 'second') return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(diff / secs), unit);
  return '';
}

export function TimestampConverter() {
  const copy = useCopy();
  const [now, setNow] = useState<Date | null>(null);
  const [epoch, setEpoch] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const parsed = useMemo(() => (epoch.trim() ? parseEpoch(epoch) : null), [epoch]);
  const fromDate = useMemo(() => { if (!dateStr.trim()) return null; const d = new Date(dateStr); return isNaN(d.getTime()) ? null : d; }, [dateStr]);

  const rows = (d: Date) => [
    ['UTC', d.toUTCString()],
    ['ISO 8601', d.toISOString()],
    [`Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`, d.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })],
    ['Relative', relative(d, now ?? new Date())],
    ['Seconds', String(Math.floor(d.getTime() / 1000))],
    ['Milliseconds', String(d.getTime())],
  ];
  const table = (d: Date) => (
    <dl className="mt-4 divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
      {rows(d).map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white">
          <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{k}</dt>
          <dd className="flex items-center gap-3 min-w-0"><code className="font-mono text-xs text-slate-700 break-all text-right">{v}</code>
            <button type="button" aria-label={`Copy ${k}`} className="text-slate-300 hover:text-primary-600" onClick={() => copy(v)}><i className="far fa-copy" /></button></dd>
        </div>
      ))}
    </dl>
  );
  const input = 'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-primary-400';

  return (
    <div className="space-y-6">
      <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <span className={labelCls}>Current Unix time</span>
          <div className="text-3xl font-black text-slate-900 tabular-nums" aria-live="off">{now ? Math.floor(now.getTime() / 1000) : '—'}</div>
          <div className="text-xs text-slate-400 font-mono mt-1">{now ? `${now.getTime()} ms · ${now.toISOString()}` : ''}</div>
        </div>
        <button type="button" className={btnGhost} disabled={!now} onClick={() => now && copy(String(Math.floor(now.getTime() / 1000)))}>Copy seconds</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={card}>
          <label htmlFor="ts-epoch" className={labelCls}>Epoch → date</label>
          <input id="ts-epoch" className={input} inputMode="numeric" placeholder="e.g. 1767225600 or 1767225600000" value={epoch} onChange={(e) => setEpoch(e.target.value)} />
          <div className="flex gap-2 mt-3"><button type="button" className={btnGhost} onClick={() => setEpoch(String(Math.floor(Date.now() / 1000)))}>Use now</button><button type="button" className={btnGhost} onClick={() => setEpoch('')} disabled={!epoch}>Clear</button></div>
          {epoch.trim() && !parsed && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">Enter a number of seconds or milliseconds since 1970-01-01 UTC.</p>}
          {parsed && table(parsed)}
        </div>
        <div className={card}>
          <label htmlFor="ts-date" className={labelCls}>Date → epoch</label>
          <input id="ts-date" className={input} placeholder="e.g. 2026-01-01T00:00:00Z or Jan 1 2026 09:30" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          <div className="flex gap-2 mt-3"><button type="button" className={btnGhost} onClick={() => setDateStr(new Date().toISOString())}>Use now</button><button type="button" className={btnGhost} onClick={() => setDateStr('')} disabled={!dateStr}>Clear</button></div>
          {dateStr.trim() && !fromDate && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">Could not read that date. Try an ISO format like 2026-01-01T00:00:00Z.</p>}
          {fromDate && table(fromDate)}
          <p className="mt-4 text-[11px] text-slate-400 font-medium">Dates without a timezone are read in your local timezone. Add <code>Z</code> for UTC.</p>
        </div>
      </div>
    </div>
  );
}
