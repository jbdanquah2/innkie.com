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
import { toDateSafe } from '@/lib/utils/urls';
import type { ShortUrl, UniqueVisitor } from '@innkie/shared-models';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });
const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false, loading: () => <div className="w-full h-[300px] bg-slate-50 animate-pulse rounded-xl" /> });

/** `/dashboard/details/<code>/` (Firebase serves one shell for every code); `?code=` works for local dev. */
function readCode(): string {
  const p = window.location.pathname.replace(/^\/dashboard\/details\/?/, '').split('/')[0];
  return decodeURIComponent(p || new URLSearchParams(window.location.search).get('code') || '');
}

const fmtDate = (v: unknown) => { const d = toDateSafe(v); return d ? d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—'; };
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
  const { links, remove } = useLinks();
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
    let alive = true;
    linksApi.getByCode(code).then((l) => { if (!alive) return; l ? setLink(l) : setMissing(true); }).catch(() => alive && setMissing(true));
    return () => { alive = false; };
  }, [code, links]);

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
  const copy = async () => { try { await navigator.clipboard.writeText(shortHref); setCopied(true); setTimeout(() => setCopied(false), 800); } catch { toast.error('Failed to copy URL.'); } };
  const confirmDelete = async () => {
    setDeleting(false); setEditing(false);
    if (!link?.id) return;
    try { await remove(link.id); window.location.assign('/links/'); }
    catch (e: any) { toast.error(e?.message || 'Failed to delete link.'); }
  };

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6" role="status">
        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center animate-pulse"><i className="fas fa-link text-primary-200 text-4xl" /></div>
        <div className="space-y-2"><h3 className="text-xl font-bold text-slate-800">Loading Analytics...</h3><p className="text-slate-500 max-w-xs mx-auto">We&apos;re gathering the latest performance data for your link. Just a moment.</p></div>
      </div>
    );
  }

  const clicks = typeof link.clickCount === 'number' ? link.clickCount : -1;
  const unique = typeof link.uniqueClicks === 'number' ? link.uniqueClicks : 0;

  return (
    <div className="relative">
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <a href="/links/" aria-label="Back to links" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all mr-2"><i className="fas fa-arrow-left" /></a>
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0"><i className="fas fa-chart-line text-2xl" /></div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">Link Analytics</h1>
            <p className="text-sm text-slate-500 truncate">Insights for <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{link.shortCode}</span></p>
          </div>
        </div>
        <button type="button" onClick={exportCsv} disabled={!visitors.length} className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"><i className="fas fa-file-export mr-2" /> Export</button>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center"><i className="fas fa-mouse-pointer mr-2 text-primary-500 text-sm" /> Clicks Over Time</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg" role="group" aria-label="Range">
              {[7, 30, 90].map((d) => <button key={d} type="button" aria-pressed={range === d} onClick={() => void loadSeries(d)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${range === d ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{d}D</button>)}
            </div>
          </div>
          <div className="p-6 h-64"><LineChart labels={series.map((s) => s.date)} series={[{ label: 'Clicks', data: series.map((s) => s.clicks), color: '#4a6cf7' }]} /></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Clicks</p><p className="text-2xl font-bold text-slate-900">{clicks >= 0 ? clicks : '—'}</p></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unique Users</p><p className="text-2xl font-bold text-slate-900">{unique}</p></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created</p><p className="text-sm font-bold text-slate-700 truncate">{created}</p></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Activity</p><p className="text-sm font-bold text-slate-700 truncate">{lastActivity || 'No activity yet'}</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-100">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 block mb-2">Short URL</span>
            <div className="flex items-center justify-between gap-4">
              <a href={shortHref} target="_blank" rel="noopener noreferrer" className="text-lg font-bold truncate hover:underline underline-offset-4">{shortHref}</a>
              <button type="button" onClick={copy} aria-label="Copy short URL" className="shrink-0 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"><i className={copied ? 'fas fa-check text-emerald-300' : 'far fa-copy'} /></button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-w-0 overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Destination URL</span>
            <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-slate-700 font-semibold truncate block hover:text-primary-600 transition-colors">{link.originalUrl}</a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-800 flex items-center"><i className="fas fa-globe-americas mr-2 text-primary-500 text-sm" /> Geographic Distribution</h2></div>
          <div className="p-4">
            <GeoMap counts={counts} max={max} className="w-full h-[300px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100" />
            {max > 0 && (
              <div className="mt-4 flex items-center gap-3"><span className="text-[10px] font-bold text-slate-400">0</span><div className="flex-1 h-2 rounded-full bg-gradient-to-r from-[#eef7fe] via-[#5aa8ed] to-[#123f9b]" /><span className="text-[10px] font-bold text-slate-400">{max} max</span></div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-bold text-slate-800 flex items-center"><i className="fas fa-users mr-2 text-primary-500 text-sm" /> Recent Visitors</h2>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><i className="fas fa-search text-[10px]" /></span>
              <input type="search" aria-label="Search visitors" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search visitors..." className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50/50">{['IP Address', 'Location', 'Device', 'Visits', 'Last Visit'].map((h) => <th key={h} className={`px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${h === 'Visits' ? 'text-center' : ''}`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v, i) => (
                  <tr key={`${v.ipAddress}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 whitespace-nowrap">{v.ipAddress}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">{where(v)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">{device(v)}</td>
                    <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{v.visitCount}</span></td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 whitespace-nowrap">{fmtDate(v.lastVisitAt)}</td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="text-slate-200 mb-2"><i className="fas fa-user-slash text-3xl" /></div><p className="text-slate-400 text-xs font-medium">No visitor data found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button type="button" onClick={() => setEditing(true)} className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-100"><i className="fas fa-pen mr-2 text-sm" /> Edit Settings</button>
          <button type="button" onClick={() => setDeleting(true)} className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all"><i className="fas fa-trash-alt mr-2 text-sm" /> Delete Permanently</button>
        </div>
      </div>

      {deleting && <ConfirmDialog type="danger" title="Delete Link" message="Are you sure you want to delete this link? This action cannot be undone and you will lose all analytics data." confirmText="Delete Link" onConfirm={confirmDelete} onCancel={() => setDeleting(false)} />}
      {editing && <LinkEditorDialog link={link} onClose={() => setEditing(false)} onSaved={(u) => setLink((l) => (l ? ({ ...l, ...u } as ShortUrl) : l))} onDelete={() => setDeleting(true)} />}
    </div>
  );
}
