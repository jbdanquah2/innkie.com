'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { downloadBlob } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { generateV7Batch, inspectUuid, joinUuids, styleUuid, uuidV4, type UuidFormat } from '@/lib/uuid';
import { useCopy } from './ui';

type Version = 'v4' | 'v7';
const MAX = 1000;

const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const check = 'h-4 w-4 rounded border-slate-300 accent-primary-600';
const card = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5';

function generate(version: Version, n: number): string[] {
  return version === 'v7' ? generateV7Batch(n) : Array.from({ length: n }, uuidV4);
}

export function UuidGenerator() {
  const copy = useCopy();
  const [version, setVersion] = useState<Version>('v4');
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [format, setFormat] = useState<UuidFormat>('lines');
  const [raw, setRaw] = useState<string[]>([]);
  const [probe, setProbe] = useState('');

  const size = Math.min(Math.max(Math.floor(count) || 1, 1), MAX);

  const run = useCallback((v: Version = version, n: number = size) => {
    setRaw(generate(v, n));
    void logToolUsage('uuid_generator', 'generate');
  }, [version, size]);

  // Random values must be created on the client after hydration (the page is statically pre-rendered).
  useEffect(() => { setRaw(generate('v4', 5)); }, []);

  const list = useMemo(() => raw.map((u) => styleUuid(u, { upper, hyphens, braces })), [raw, upper, hyphens, braces]);
  const info = probe.trim() ? inspectUuid(probe) : null;

  const switchVersion = (v: Version) => { setVersion(v); run(v); };

  const vtab = (v: Version, label: string) => (
    <button type="button" role="tab" aria-selected={version === v} onClick={() => switchVersion(v)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${version === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <section className={card} aria-label="Generate UUIDs">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">Version</p>
            <div role="tablist" aria-label="UUID version" className="flex p-1 rounded-lg bg-slate-100 w-fit">
              {vtab('v4', 'v4 random')}
              {vtab('v7', 'v7 time-ordered')}
            </div>
          </div>
          <div className="w-28">
            <label htmlFor="uuid-count" className="block text-sm font-medium text-slate-700 mb-1.5">How many</label>
            <input id="uuid-count" type="number" min={1} max={MAX} value={count} onChange={(e) => setCount(Number(e.target.value))} className={field} />
          </div>
          <div className="w-44">
            <label htmlFor="uuid-format" className="block text-sm font-medium text-slate-700 mb-1.5">List format</label>
            <select id="uuid-format" value={format} onChange={(e) => setFormat(e.target.value as UuidFormat)} className={field}>
              <option value="lines">One per line</option>
              <option value="commas">Comma separated</option>
              <option value="json">JSON array</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pb-2">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className={check} />Uppercase</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} className={check} />Hyphens</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={braces} onChange={(e) => setBraces(e.target.checked)} className={check} />Braces</label>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => run()} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors">Generate {size > 1 ? `${size.toLocaleString('en-US')} UUIDs` : 'a UUID'}</button>
          <button type="button" onClick={() => copy(joinUuids(list, format), `${list.length} UUID${list.length === 1 ? '' : 's'} copied`)} disabled={!list.length} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors disabled:opacity-40">Copy all</button>
          <button type="button" onClick={() => downloadBlob(new Blob([joinUuids(list, format)], { type: format === 'json' ? 'application/json' : 'text/plain' }), `uuids.${format === 'json' ? 'json' : 'txt'}`)} disabled={!list.length} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors disabled:opacity-40">Download</button>
          <p className="text-sm text-slate-500" role="status">{list.length ? `${list.length.toLocaleString('en-US')} generated` : ''}{count > MAX ? ` (limited to ${MAX.toLocaleString('en-US')})` : ''}</p>
        </div>
        {version === 'v7' && <p className="mt-3 text-xs text-slate-500">v7 UUIDs start with the current time, so ones generated later sort later, which suits database keys. They also reveal when they were created.</p>}
      </section>

      <ul className="max-h-[420px] overflow-auto divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white" aria-label="Generated UUIDs">
        {list.map((u, i) => (
          <li key={`${i}-${u}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50">
            <code className="font-mono text-sm text-slate-800 break-all">{u}</code>
            <button type="button" className="text-sm font-medium text-primary-700 hover:underline shrink-0" aria-label={`Copy ${u}`} onClick={() => copy(u)}>Copy</button>
          </li>
        ))}
      </ul>

      <section className={card} aria-label="Check a UUID">
        <h2 className="font-semibold text-slate-900">Check a UUID</h2>
        <p className="mt-1 text-sm text-slate-600">Paste one to see its version and variant, and when it was created if it contains a time.</p>
        <label htmlFor="uuid-probe" className="sr-only">UUID to check</label>
        <input id="uuid-probe" type="text" spellCheck={false} autoComplete="off" value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="550e8400-e29b-41d4-a716-446655440000" className={`${field} mt-3 font-mono`} />
        {info && (
          <div role="status" className={`mt-3 rounded-lg border px-3 py-2 text-sm ${info.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
            {!info.valid && 'This is not a valid UUID. It needs 32 hexadecimal digits, usually grouped 8-4-4-4-12.'}
            {info.valid && info.nil && 'Valid: the nil UUID (all zeros).'}
            {info.valid && info.max && 'Valid: the max UUID (all ones).'}
            {info.valid && !info.nil && !info.max && (
              <>Valid. Version {info.version}, variant {info.variant}.{info.time && <> Created {info.time.toLocaleString()} ({info.time.toISOString()}).</>}</>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
