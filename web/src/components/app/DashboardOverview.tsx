'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlatformUsageEvent, WorkspaceDailySummary } from '@innkie/shared-models';
import { AdSlot } from '@/components/AdSlot';
import { analyticsApi } from '@/lib/api/analytics';
import { metricsApi } from '@/lib/api/metrics';
import { useLinks } from '@/lib/links-store';
import { TOOL_META } from '@/lib/tool-meta';
import { FALLBACK_FAVICON, toDateSafe } from '@/lib/utils/urls';
import { useWorkspace } from '@/lib/workspace';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });

type Tab = 'links' | 'platform';
const fmt = (n: number) => n.toLocaleString('en-US');
const clicks = (l: { clickCount?: unknown }) => (l.clickCount as number) || 0;
const sum = (list: WorkspaceDailySummary[], k: string) => list.reduce((a, s) => a + ((s.metrics as any)?.[k] || 0), 0);

function Stat({ tone, label, value, caption, icon, dark }: { tone: string; label: string; value: string; caption: string; icon: string; dark?: boolean }) {
  return (
    <div className={`card p-8 ${tone} rounded-[2.5rem] relative overflow-hidden group`}>
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full group-hover:scale-110 transition-transform ${dark ? 'bg-white/10' : 'bg-slate-50'}`} />
      <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${dark ? 'opacity-70' : 'text-slate-400'}`}>{label}</p>
      <div className="flex items-end justify-between relative z-10">
        <div><h3 className="text-4xl font-black tracking-tighter">{value}</h3><p className={`text-xs font-bold mt-1 ${dark ? 'opacity-70' : 'text-slate-500'}`}>{caption}</p></div>
        <i className={`fas ${icon} text-3xl opacity-20`} />
      </div>
    </div>
  );
}

const PLATFORM_CARDS = [
  { key: 'linksShortened', label: 'Smart Links', caption: 'URLs Shortened', icon: 'fa-link', box: 'bg-primary-50 text-primary-600', blob: 'bg-primary-50' },
  { key: 'qrsGenerated', label: 'QR Studio', caption: 'QRs Generated', icon: 'fa-qrcode', box: 'bg-emerald-50 text-emerald-600', blob: 'bg-emerald-50' },
  { key: 'imagesCompressed', label: 'Media Hub', caption: 'Images Processed', icon: 'fa-image', box: 'bg-blue-50 text-blue-600', blob: 'bg-blue-50' },
  { key: 'otherToolsUsage', label: 'Dev Tools', caption: 'Utility Actions', icon: 'fa-code', box: 'bg-amber-50 text-amber-600', blob: 'bg-amber-50' },
] as const;

export function DashboardOverview() {
  const { links, loading: linksLoading } = useLinks();
  const { active } = useWorkspace();
  const [tab, setTab] = useState<Tab>('links');
  const [period, setPeriod] = useState(30);
  const [summaries, setSummaries] = useState<WorkspaceDailySummary[]>([]);
  const [recent, setRecent] = useState<PlatformUsageEvent[]>([]);
  const [clickSeries, setClickSeries] = useState<{ date: string; clicks: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const wsId = active?.id;

  const load = useCallback(async () => {
    if (!wsId) return;
    setChartLoading(true);
    const [s, c] = await Promise.all([
      metricsApi.summary(wsId, period),
      analyticsApi.workspaceClicks(wsId, period).catch(() => []),
    ]);
    setSummaries(s);
    setClickSeries(c);
    setChartLoading(false);
  }, [wsId, period]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!wsId) return;
    setMetricsLoading(true);
    metricsApi.recent(wsId, 10).then(setRecent).finally(() => setMetricsLoading(false));
  }, [wsId]);

  const totalClicks = links.reduce((a, l) => a + clicks(l), 0);
  const totalLinks = links.length;
  const avg = totalLinks ? totalClicks / totalLinks : 0;
  const topLinks = useMemo(() => [...links].sort((a, b) => clicks(b) - clicks(a)).slice(0, 5), [links]);

  const sorted = useMemo(() => [...summaries].sort((a, b) => a.date.localeCompare(b.date)), [summaries]);
  const noData = clickSeries.length === 0 || clickSeries.every((d) => d.clicks === 0);
  const noPlatformData = summaries.every((s) => ['linksShortened', 'imagesCompressed', 'qrsGenerated', 'otherToolsUsage'].every((k) => !(s.metrics as any)?.[k]));

  const loading = linksLoading || metricsLoading;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-slate-500 font-medium mt-1">Strategic overview of your workspace performance.</p>
        </div>
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl shadow-sm border border-slate-200" role="tablist">
          {([['links', 'Link Center'], ['platform', 'Platform Utilities']] as const).map(([t, label]) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      <AdSlot slotId="dashboard_top_subtle" format="horizontal" minHeight="90px" />

      {tab === 'links' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Stat dark tone="bg-primary-600 text-white shadow-xl shadow-primary-500/10" label="Total Engagement" value={fmt(totalClicks)} caption="Click Interactions" icon="fa-mouse-pointer" />
          <Stat tone="bg-white border border-slate-100 shadow-sm text-slate-900" label="Link Volume" value={fmt(totalLinks)} caption="Shortened Links" icon="fa-link" />
          <Stat dark tone="bg-amber-500 text-white shadow-xl shadow-amber-500/10" label="Effectiveness" value={avg.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} caption="Avg. Clicks Per Link" icon="fa-chart-line" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORM_CARDS.map((c) => (
            <div key={c.key} className="card p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${c.blob} rounded-full group-hover:scale-110 transition-transform`} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 ${c.box} rounded-xl flex items-center justify-center shadow-sm`}><i className={`fas ${c.icon}`} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{c.label}</p>
              </div>
              <div className="relative z-10 mt-6"><h3 className="text-3xl font-black tracking-tighter text-slate-900">{fmt(sum(summaries, c.key))}</h3><p className="text-xs font-bold text-slate-500 mt-1">{c.caption}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${tab === 'links' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[450px]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{tab === 'links' ? 'Traffic Trajectory' : 'Platform Activity'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{tab === 'links' ? 'Click volume over time' : 'Multitool usage metrics'}</p>
              </div>
              <select aria-label="Period" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer">
                <option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
              </select>
            </div>
            <div className="h-[320px] relative">
              {tab === 'links' ? (
                <LineChart labels={clickSeries.map((d) => d.date)} series={[{ label: 'Workspace Clicks', data: clickSeries.map((d) => d.clicks), color: '#4f46e5' }]} />
              ) : (
                <LineChart
                  legend
                  labels={sorted.map((s) => s.date)}
                  series={[
                    { label: 'Tool Actions', data: sorted.map((s) => ((s.metrics as any)?.imagesCompressed || 0) + ((s.metrics as any)?.qrsGenerated || 0) + ((s.metrics as any)?.otherToolsUsage || 0)), color: '#10b981' },
                    { label: 'Links Shortened', data: sorted.map((s) => (s.metrics as any)?.linksShortened || 0), color: '#3b82f6' },
                  ]}
                />
              )}
              {chartLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]" role="status"><div className="text-center"><div className="w-8 h-8 mx-auto mb-3 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tab === 'links' ? 'Analyzing Traffic...' : 'Compiling Activity...'}</p></div></div>}
              {!chartLoading && tab === 'links' && noData && <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]"><div className="text-center"><i className="fas fa-chart-line text-slate-100 text-7xl mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest text-sm">No traffic data yet</p></div></div>}
              {!chartLoading && tab === 'platform' && noPlatformData && <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]"><div className="text-center"><i className="fas fa-rocket text-slate-100 text-7xl mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest text-sm">No tool activity yet</p></div></div>}
            </div>
          </div>
        </div>

        {tab === 'links' && (
          <div className="lg:col-span-4">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between"><h3 className="font-black text-slate-900 tracking-tight">Top Performers</h3><i className="fas fa-crown text-amber-400" /></div>
              <div className="divide-y divide-slate-50 flex-grow">
                {linksLoading && links.length === 0 ? [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="px-8 py-5 animate-pulse"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-2 bg-slate-50 rounded w-1/2" /></div></div></div>
                )) : topLinks.length === 0 ? (
                  <div className="p-12 text-center text-slate-300 italic text-sm font-medium">No performance data.</div>
                ) : topLinks.map((l) => (
                  <Link key={l.id} href={`/dashboard/details/${l.shortCode}/`} className="block px-8 py-5 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.favicon || '/favicon.ico'} alt="" onError={(e) => { const t = e.currentTarget; if (t.src.includes(FALLBACK_FAVICON)) t.style.display = 'none'; else t.src = FALLBACK_FAVICON; }} className="w-5 h-5 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-800 truncate leading-none">{l.title || l.shortCode}</p><p className="text-[10px] font-bold text-primary-600 mt-1.5 uppercase tracking-tighter">/{l.shortCode}</p></div>
                      <div className="text-right"><p className="text-sm font-black text-slate-900 leading-none">{fmt(clicks(l))}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Clicks</p></div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/analytics/" className="px-8 py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 text-center transition-colors border-t border-slate-50">View Detailed Analytics</Link>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div><h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest workspace activity across all tools</p></div>
          <Link href="/analytics/" className="text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">View All Insights</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"><th className="px-10 py-4">Context</th><th className="px-6 py-4">Action / Identifier</th><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4 text-center">Outcome</th><th className="px-10 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading && recent.length === 0 ? [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse"><td className="px-10 py-5"><div className="h-3 bg-slate-100 rounded w-32" /></td><td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-48" /></td><td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-20" /></td><td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td><td className="px-10 py-5"><div className="h-8 bg-slate-100 rounded w-20 ml-auto" /></td></tr>
              )) : recent.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-12 text-center text-slate-300 font-medium italic">No workspace activity detected.</td></tr>
              ) : recent.map((e, i) => {
                const meta = TOOL_META[e.toolType];
                const md: any = e.metadata;
                return (
                  <tr key={e.id ?? i} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 ${meta?.tone ?? 'bg-slate-100 text-slate-600'}`}><i className={`fas ${meta?.icon ?? 'fa-wrench'}`} /></div>
                        <div className="min-w-0"><p className="text-sm font-black text-slate-800 truncate max-w-[200px] capitalize">{meta?.label ?? String(e.toolType).replace(/_/g, ' ')}</p><p className="text-[10px] text-slate-400 font-medium truncate max-w-[250px] mt-0.5">Workspace Activity</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 capitalize">{e.action}</span>
                        {md?.shortCode ? <span className="text-[10px] font-black text-primary-600 uppercase mt-0.5">/{md.shortCode}</span> : md?.bytesSaved ? <span className="text-[10px] font-black text-emerald-600 uppercase mt-0.5">Saved {fmt(md.bytesSaved)} bytes</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-5"><span className="text-xs font-bold text-slate-500">{toDateSafe(e.timestamp)?.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></td>
                    <td className="px-6 py-5 text-center"><span className="inline-flex px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">SUCCESS</span></td>
                    <td className="px-10 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {md?.shortCode && <Link href={`/dashboard/details/${md.shortCode}/`} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="View Details" aria-label="View details"><i className="fas fa-chart-line" /></Link>}
                        {meta?.route && <Link href={meta.route} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title={`Launch ${meta.label}`} aria-label={`Launch ${meta.label}`}><i className={`fas ${meta.icon}`} /></Link>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
