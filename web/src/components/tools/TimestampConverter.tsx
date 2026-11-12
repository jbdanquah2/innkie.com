'use client';
import { useEffect, useMemo, useState } from 'react';
import { UNIT_LABEL, formatInZone, parseDateInput, parseEpochInput, relative, type EpochUnit, type Zone } from '@/lib/timestamp';
import { useCopy } from './ui';

const field = 'block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const select = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const card = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5';
const lbl = 'block text-sm font-medium text-slate-700 mb-1.5';
const small = 'px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors';

export function TimestampConverter() {
  const copy = useCopy();
  const [now, setNow] = useState<Date | null>(null);
  const [epoch, setEpoch] = useState('');
  const [unit, setUnit] = useState<EpochUnit>('auto');
  const [dateStr, setDateStr] = useState('');
  const [zone, setZone] = useState<Zone>('local');
  const [extraZone, setExtraZone] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [localZone, setLocalZone] = useState('');

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    setLocalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try { setZones((Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone')); } catch { setZones([]); }
    return () => clearInterval(t);
  }, []);

  const fromEpoch = useMemo(() => (epoch.trim() ? parseEpochInput(epoch, unit) : null), [epoch, unit]);
  const fromDate = useMemo(() => (dateStr.trim() ? parseDateInput(dateStr, zone) : null), [dateStr, zone]);

  const rows = (d: Date): [string, string][] => {
    const base: [string, string][] = [
      ['UTC', d.toUTCString()],
      ['ISO 8601', d.toISOString()],
      [localZone ? `Local (${localZone})` : 'Local', d.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })],
    ];
    if (extraZone) {
      const f = formatInZone(d, extraZone);
      if (f) base.push([extraZone, f]);
    }
    return [...base, ['Relative', relative(d, now ?? new Date())], ['Seconds', String(Math.floor(d.getTime() / 1000))], ['Milliseconds', String(d.getTime())]];
  };

  const table = (d: Date) => (
    <dl className="mt-4 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
      {rows(d).map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white">
          <dt className="text-sm text-slate-500 shrink-0">{k}</dt>
          <dd className="flex items-center gap-3 min-w-0">
            <code className="font-mono text-sm text-slate-900 break-all text-right">{v}</code>
            <button type="button" aria-label={`Copy ${k}`} className="text-sm font-medium text-primary-700 hover:underline shrink-0" onClick={() => copy(v)}>Copy</button>
          </dd>
        </div>
      ))}
    </dl>
  );

  const tzPicker = (
    <div className="mt-4">
      <label htmlFor="ts-zone" className={lbl}>Also show in another time zone <span className="font-normal text-slate-500">(optional)</span></label>
      <select id="ts-zone" value={extraZone} onChange={(e) => setExtraZone(e.target.value)} className={select}>
        <option value="">None</option>
        {zones.map((z) => <option key={z} value={z}>{z}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-sm text-slate-500">Current Unix time</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums" aria-live="off">{now ? Math.floor(now.getTime() / 1000) : '—'}</p>
          <p className="mt-1 text-xs font-mono text-slate-500">{now ? `${now.getTime()} ms · ${now.toISOString()}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={small} disabled={!now} onClick={() => now && copy(String(Math.floor(now.getTime() / 1000)))}>Copy seconds</button>
          <button type="button" className={small} disabled={!now} onClick={() => now && copy(String(now.getTime()))}>Copy milliseconds</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <section className={card} aria-label="Epoch to date">
          <h2 className="font-semibold text-slate-900 mb-3">Epoch to date</h2>
          <div className="grid sm:grid-cols-[1fr_170px] gap-3">
            <div>
              <label htmlFor="ts-epoch" className={lbl}>Epoch value</label>
              <input id="ts-epoch" className={field} inputMode="decimal" autoComplete="off" placeholder="1767225600" value={epoch} onChange={(e) => setEpoch(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ts-unit" className={lbl}>Unit</label>
              <select id="ts-unit" value={unit} onChange={(e) => setUnit(e.target.value as EpochUnit)} className={select}>
                <option value="auto">Detect automatically</option>
                <option value="s">Seconds</option>
                <option value="ms">Milliseconds</option>
                <option value="us">Microseconds</option>
                <option value="ns">Nanoseconds</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={small} onClick={() => setEpoch(String(Math.floor(Date.now() / 1000)))}>Use now</button>
            <button type="button" className={small} onClick={() => setEpoch('')}>Clear</button>
          </div>
          {fromEpoch && <p className="mt-3 text-xs text-slate-500" role="status">Read as {UNIT_LABEL[fromEpoch.unit]}{unit === 'auto' ? ' (detected from the number of digits)' : ''}.</p>}
          {epoch.trim() && !fromEpoch && <p role="alert" className="mt-3 text-sm text-rose-700">Enter a whole or decimal number of seconds, milliseconds, microseconds or nanoseconds since 1970-01-01 UTC, within the range dates can represent.</p>}
          {fromEpoch && table(fromEpoch.date)}
          {tzPicker}
        </section>

        <section className={card} aria-label="Date to epoch">
          <h2 className="font-semibold text-slate-900 mb-3">Date to epoch</h2>
          <div className="grid sm:grid-cols-[1fr_170px] gap-3">
            <div>
              <label htmlFor="ts-date" className={lbl}>Date and time</label>
              <input id="ts-date" className={field} autoComplete="off" placeholder="2026-01-01T09:30:00" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ts-readas" className={lbl}>If no zone is given</label>
              <select id="ts-readas" value={zone} onChange={(e) => setZone(e.target.value as Zone)} className={select}>
                <option value="local">Local time</option>
                <option value="utc">UTC</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={small} onClick={() => setDateStr(new Date().toISOString())}>Use now</button>
            <button type="button" className={small} onClick={() => setDateStr('')}>Clear</button>
          </div>
          {fromDate && (
            <p className="mt-3 text-xs text-slate-500" role="status">
              {fromDate.byBrowser
                ? 'Not an ISO 8601 date, so your browser interpreted it. Other browsers may read it differently; ISO format (2026-01-01T09:30:00Z) is unambiguous.'
                : fromDate.hadOffset ? 'Read using the zone written in the text.' : `Read as ${zone === 'utc' ? 'UTC' : `local time${localZone ? ` (${localZone})` : ''}`}.`}
            </p>
          )}
          {dateStr.trim() && !fromDate && <p role="alert" className="mt-3 text-sm text-rose-700">Could not read that date. Use a format like 2026-01-01T09:30:00Z, and check that the month, day and time exist.</p>}
          {fromDate && table(fromDate.date)}
          {tzPicker}
        </section>
      </div>
    </div>
  );
}
