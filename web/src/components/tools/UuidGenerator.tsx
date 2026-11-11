'use client';
import { useCallback, useEffect, useState } from 'react';
import { logToolUsage } from '@/lib/metrics';
import { btn, btnGhost, card, labelCls, useCopy } from './ui';

function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function UuidGenerator() {
  const copy = useCopy();
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [raw, setRaw] = useState<string[]>([]);

  const generate = useCallback((n = count) => {
    const size = Math.min(Math.max(Math.floor(n) || 1, 1), 100);
    setRaw(Array.from({ length: size }, uuidV4));
    void logToolUsage('uuid_generator', 'generate');
  }, [count]);

  // Random values must be created on the client after hydration (the page is statically pre-rendered).
  useEffect(() => { setRaw(Array.from({ length: 5 }, uuidV4)); }, []);

  const fmt = (u: string) => {
    let v = hyphens ? u : u.replace(/-/g, '');
    if (upper) v = v.toUpperCase();
    return braces ? `{${v}}` : v;
  };
  const list = raw.map(fmt);
  const check = (on: boolean, set: (v: boolean) => void, label: string) => (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="accent-primary-600 w-4 h-4" /> {label}
    </label>
  );

  return (
    <div className={card}>
      <div className="flex flex-wrap items-end gap-6 mb-6">
        <div>
          <label htmlFor="uuid-count" className={labelCls}>How many (1–100)</label>
          <input id="uuid-count" type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-28 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary-400" />
        </div>
        <div className="flex flex-wrap gap-5 pb-3">{check(upper, setUpper, 'Uppercase')}{check(hyphens, setHyphens, 'Hyphens')}{check(braces, setBraces, 'Braces')}</div>
        <div className="flex gap-2 ml-auto">
          <button type="button" className={btn} onClick={() => generate()}><i className="fas fa-rotate mr-2" />Generate</button>
          <button type="button" className={btnGhost} onClick={() => copy(list.join('\n'), `${list.length} UUIDs copied!`)} disabled={!list.length}>Copy all</button>
        </div>
      </div>
      <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden" aria-live="polite">
        {list.map((u, i) => (
          <li key={`${i}-${u}`} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white hover:bg-slate-50">
            <code className="font-mono text-sm text-slate-700 break-all">{u}</code>
            <button type="button" className="text-slate-300 hover:text-primary-600 shrink-0" aria-label={`Copy ${u}`} onClick={() => copy(u)}><i className="far fa-copy" /></button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-slate-400 font-medium">Version 4 (random) UUIDs from your browser&apos;s cryptographic generator. Nothing is sent or stored.</p>
    </div>
  );
}
