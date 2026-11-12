'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LinkEditorDialog } from './LinkEditorDialog';
import { analyticsApi } from '@/lib/api/analytics';
import { linksApi } from '@/lib/api/links';
import { downloadBlob } from '@/lib/files';
import { env } from '@/lib/env';
import { useLinks } from '@/lib/links-store';
import { useTimeAgo } from '@/lib/time';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';
import { toDateSafe } from '@/lib/utils/urls';
import type { ShortUrl, UniqueVisitor } from '@innkie/shared-models';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });
const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false, loading: () => <div className="w-full h-[300px] bg-slate-50 animate-pulse rounded-xl" /> });

/** `/dashboard/details/<code>/` (Firebase serves one shell for every code); `?code=` works for local dev. */
function readCode(): string {
  const p = window.location.pathname.replace(/^\/dashboard\/details\/?/, '').split('/')[0];
  return decodeURIComponent(p || new URLSearchParams(window.location.search).get('code') || '');
}

const fmtDate = (v: unknown) => { const d = toDateSafe(v); return d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; };
const where = (v: UniqueVisitor) => `${v.city ?? ''}${v.country ? ` (${v.country})` : ''}`.trim() || '—';
const device = (v: UniqueVisitor) => (v.deviceType || []).join(', ');

/** CSV cell: quoted, quotes doubled, and formula-leading characters neutralised (spreadsheet injection). */
const csvCell = (x: unknown) => {
  let s = String(x ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export function LinkDetails() {
  const toast = useToast();
  const { links, loaded, remove } = useLinks();
  const { active } = useWorkspace();
  const canEdit = active?.role !== 'viewer';
  const [code, setCode] = useState('');
  const [link, setLink] = useState<ShortUrl | null>(null);
  const [missing, setMissing] = useState(false);
  const [visitors, setVisitors] = useState<UniqueVisitor[]>([]);
  const [filter, setFilter] = useState('');
  const [range, setRange] = useState(7);
  const [series, setSeries] = useState<{ date: string; clicks: number }[]>([]);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const created = useTimeAgo(link?.createdAt);
  const lastActivity = useTimeAgo(link?.lastClickedAt);

  useEffect(() => { setCode(readCode()); }, []);

  // Link: prefer the already-loaded workspace list, fall back to Firestore (deep link / other workspace).
  useEffect(() => {
    if (!code) return;
    const known = links.find((l) => l.shortCode === code);
    if (known) { setLink(known); return; }
    // Wait for the workspace's list before asking Firestore, so a refresh on this page does not bounce to /links/.
    if (!loaded) return;
    let alive = true;
    linksApi.getByCode(code).then((l) => { if (!alive) return; l ? setLink(l) : setMissing(true); }).catch(() => alive && setMissing(true));
    return () => { alive = false; };
  }, [code, links, loaded]);

  useEffect(() => { if (missing) window.location.replace('/links/'); }, [missing]);

  useEffect(() => {
    if (!code) return;
    analyticsApi.visitors(code).then((v) => setVisitors(v ?? [])).catch((e) => console.error('Error fetching visitors:', e));
  }, [code]);

  const loadSeries = useCallback(async (days: number) => {
    setRange(days);
    try { const s = await analyticsApi.clicks(code, days); if (Array.isArray(s)) setSeries(s); }
    catch (e) { console.error('Failed to load chart data', e); }
  }, [code]);
  useEffect(() => { if (code) void loadSeries(7); }, [code, loadSeries]);

  const counts = useMemo(() => {
    if (link?.topCountries && Object.keys(link.topCountries).length) return { ...(link.topCountries as Record<string, number>) };
    const c: Record<string, number> = {};
    visitors.forEach((v) => { const k = (v.country || 'Unknown').toString().trim().toUpperCase(); if (k) c[k] = (c[k] || 0) + (v.visitCount || 1); });
    return c;
  }, [link, visitors]);
  const max = Math.max(0, ...Object.values(counts));

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) => v.ipAddress?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q) || v.country?.toLowerCase().includes(q) || device(v).toLowerCase().includes(q));
  }, [visitors, filter]);

  const exportCsv = () => {
    if (!visitors.length) return;
    const rows = visitors.map((v) => [v.ipAddress, (v.deviceType || []).join('/'), v.city || 'Unknown', v.country || 'Unknown', fmtDate(v.firstVisitAt), fmtDate(v.lastVisitAt), v.visitCount]);
    const csv = [['IP Address', 'Device', 'City', 'Country', 'First Visit', 'Last Visit', 'Visit Count'], ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `analytics-${code}.csv`);
  };

  const shortHref = link ? `${env.appUrl}/${link.shortCode}` : '';
  const copy = async () => { try { await navigator.clipboard.writeText(shortHref); setCopied(true); setTimeout(() => setCopied(false), 800); } catch { toast.error('Could not copy the link'); } };
  const confirmDelete = async () => {
    setDeleting(false); setEditing(false);
    if (!link?.id) return;
    try { await remove(link.id); window.location.assign('/links/'); }
    catch (e: any) { toast.error(e?.message || 'Failed to delete link.'); }
  };

  if (!link) {
    return (
      <div className="py-24 text-center" role="status">
        <div className="w-8 h-8 mx-auto border-[3px] border-slate-200 border-t-primary-600 rounded-full animate-spin mb-4" aria-hidden="true" />
        <p className="text-slate-600">Loading link&hellip;</p>
      </div>
    );
  }

  const clicks = typeof link.clickCount === 'number' ? link.clickCount : -1;
  const unique = typeof link.uniqueClicks === 'number' ? link.uniqueClicks : 0;
  const panel = 'rounded-lg border border-slate-200 bg-white';
  const btn = 'inline-flex items-center justify-center px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50';

  return (
    <div className="relative space-y-6">
      <div>
        <a href="/links/" className="text-sm text-slate-600 hover:text-slate-900">&larr; All links</a>
        <div className="mt-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 break-words">{link.title || link.shortCode}</h1>
            <p className="mt-1.5 flex items-center gap-2 min-w-0">
              <a href={shortHref} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline truncate">{shortHref.replace(/^https?:\/\//, '')}</a>
              <button type="button" onClick={copy} aria-label={copied ? 'Copied' : 'Copy short link'} className="text-slate-500 hover:text-slate-900 shrink-0 text-sm">{copied ? 'Copied' : <i className="far fa-copy" aria-hidden="true" />}</button>
            </p>
            <p className="mt-1 text-sm text-slate-500 break-all">
              Goes to <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline">{link.originalUrl}</a>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" onClick={exportCsv} disabled={!visitors.length} className={btn}>Export visitors (CSV)</button>
            {canEdit && <button type="button" onClick={() => setEditing(true)} className={btn}>Edit</button>}
            {canEdit && <button type="button" onClick={() => setDeleting(true)} className={`${btn} text-rose-700 hover:border-rose-400`}>Delete</button>}
          </div>
        </div>
      </div>

      <dl className={`${panel} grid grid-cols-2 lg:grid-cols-4`}>
        {[
          ['Total clicks', clicks >= 0 ? clicks.toLocaleString('en-US') : '—'],
          ['Unique visitors', unique.toLocaleString('en-US')],
          ['Created', created || '—'],
          ['Last click', lastActivity || 'None yet'],
        ].map(([label, value], i) => (
          <div key={label} className={`px-5 py-4 border-slate-200 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className={`mt-1 font-semibold text-slate-900 tabular-nums ${i < 2 ? 'text-3xl' : 'text-lg pt-1.5'}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <section className={`${panel} p-5`} aria-label="Clicks over time">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Clicks over time</h2>
          <div className="inline-flex p-1 rounded-lg bg-slate-100" role="group" aria-label="Time range">
            {[7, 30, 90].map((d) => <button key={d} type="button" aria-pressed={range === d} onClick={() => void loadSeries(d)} className={`px-3 py-1 text-sm rounded-md transition-colors ${range === d ? 'bg-white text-slate-900 font-medium shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{d} days</button>)}
          </div>
        </div>
        <div className="h-64"><LineChart labels={series.map((x) => x.date)} series={[{ label: 'Clicks', data: series.map((x) => x.clicks), color: '#4f46e5' }]} /></div>
      </section>

      <section className={`${panel} p-5`} aria-label="Where visitors are">
        <h2 className="font-semibold text-slate-900 mb-4">Where visitors are</h2>
        <GeoMap counts={counts} max={max} className="w-full h-[300px] rounded-md overflow-hidden bg-slate-50 border border-slate-200" />
        {max > 0 ? (
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500"><span>0</span><div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-[#eef7fe] via-[#5aa8ed] to-[#123f9b]" /><span>{max} clicks</span></div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No location data yet.</p>
        )}
      </section>

      <section className={panel} aria-label="Visitors">
        <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Visitors</h2>
            <p className="text-sm text-slate-500">Recent visitors, including their IP address. Anyone in this workspace can see this list.</p>
          </div>
          <input type="search" aria-label="Search visitors" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search visitors" className="w-full sm:w-60 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200" />
        </div>
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs text-slate-500">{['IP address', 'Location', 'Device', 'Visits', 'Last visit'].map((h) => <th key={h} scope="col" className={`px-5 py-2.5 font-medium whitespace-nowrap ${h === 'Visits' ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((v, i) => (
                <tr key={`${v.ipAddress}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">{v.ipAddress}</td>
                  <td className="px-5 py-3 text-slate-800 whitespace-nowrap">{where(v)}</td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{device(v)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-800">{v.visitCount}</td>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmtDate(v.lastVisitAt)}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">{visitors.length ? 'No visitors match your search.' : 'No visitors yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {deleting && <ConfirmDialog type="danger" title="Delete this link?" message="The short link stops working straight away and you will no longer be able to see its analytics. This cannot be undone." confirmText="Delete link" onConfirm={confirmDelete} onCancel={() => setDeleting(false)} />}
      {editing && <LinkEditorDialog link={link} onClose={() => setEditing(false)} onSaved={(u) => setLink((l) => (l ? ({ ...l, ...u } as ShortUrl) : l))} onDelete={() => setDeleting(true)} />}
    </div>
  );
}
