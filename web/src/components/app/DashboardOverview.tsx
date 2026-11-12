'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlatformUsageEvent, WorkspaceDailySummary } from '@innkie/shared-models';
import { analyticsApi } from '@/lib/api/analytics';
import { metricsApi } from '@/lib/api/metrics';
import { GettingStarted } from './GettingStarted';
import { useLinks } from '@/lib/links-store';
import { TOOL_META } from '@/lib/tool-meta';
import { FALLBACK_FAVICON, toDateSafe } from '@/lib/utils/urls';
import { useSlideOver } from '@/lib/slide-over';
import { useWorkspace } from '@/lib/workspace';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });

type Tab = 'links' | 'platform';
const fmt = (n: number) => n.toLocaleString('en-US');
const clicks = (l: { clickCount?: unknown }) => (l.clickCount as number) || 0;
const sum = (list: WorkspaceDailySummary[], k: string) => list.reduce((a, s) => a + ((s.metrics as any)?.[k] || 0), 0);

const PLATFORM_CARDS = [
  { key: 'linksShortened', label: 'Links shortened' },
  { key: 'qrsGenerated', label: 'QR codes made' },
  { key: 'imagesCompressed', label: 'Images compressed' },
  { key: 'otherToolsUsage', label: 'Other tool uses' },
] as const;

const panel = 'rounded-lg border border-slate-200 bg-white';

export function DashboardOverview() {
  const { links, loaded: linksLoaded, error: linksError } = useLinks();
  const linksLoading = !linksLoaded && !linksError;
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

  const canCreate = active?.role !== 'viewer';
  const { open } = useSlideOver();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-600 mt-1">{active ? `Links and tool activity in ${active.name}.` : 'Your links and tool activity.'}</p>
        </div>
        <div className="inline-flex p-1 rounded-lg bg-slate-200/70 w-fit" role="tablist" aria-label="Overview section">
          {([['links', 'Links'], ['platform', 'Tool activity']] as const).map(([t, label]) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'links' && canCreate && linksLoaded && <GettingStarted links={links} totalClicks={totalClicks} onCreate={() => open()} />}

      {tab === 'links' ? (
        <dl className={`${panel} grid grid-cols-1 sm:grid-cols-3`}>
          {[
            ['Total clicks', linksLoading ? '\u2013' : fmt(totalClicks)],
            ['Links', linksLoading ? '\u2013' : fmt(totalLinks)],
            ['Average clicks per link', linksLoading ? '\u2013' : avg.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-4 border-t border-slate-200 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className={`${panel} grid grid-cols-2 lg:grid-cols-4`}>
          {PLATFORM_CARDS.map((c) => (
            <div key={c.key} className="px-5 py-4 border-slate-200 border-t first:border-t-0 [&:nth-child(2)]:border-t-0 lg:border-t-0 odd:border-l-0 even:border-l lg:border-l lg:first:border-l-0">
              <dt className="text-sm text-slate-500">{c.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{fmt(sum(summaries, c.key))}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className={`${tab === 'links' ? 'lg:col-span-8' : 'lg:col-span-12'} ${panel} p-5`} aria-label={tab === 'links' ? 'Clicks over time' : 'Tool activity over time'}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-slate-900">{tab === 'links' ? 'Clicks over time' : 'Tool activity over time'}</h2>
            <select aria-label="Period" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-primary-600">
              <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="h-[300px] relative">
            {tab === 'links' ? (
              <LineChart labels={clickSeries.map((d) => d.date)} series={[{ label: 'Clicks', data: clickSeries.map((d) => d.clicks), color: '#4f46e5' }]} />
            ) : (
              <LineChart
                legend
                labels={sorted.map((s) => s.date)}
                series={[
                  { label: 'Tool uses', data: sorted.map((s) => ((s.metrics as any)?.imagesCompressed || 0) + ((s.metrics as any)?.qrsGenerated || 0) + ((s.metrics as any)?.otherToolsUsage || 0)), color: '#059669' },
                  { label: 'Links shortened', data: sorted.map((s) => (s.metrics as any)?.linksShortened || 0), color: '#4f46e5' },
                ]}
              />
            )}
            {chartLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/80" role="status"><p className="text-sm text-slate-500">Loading…</p></div>}
            {!chartLoading && tab === 'links' && noData && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><p className="text-sm text-slate-500">No clicks in this period yet.</p></div>}
            {!chartLoading && tab === 'platform' && noPlatformData && <div className="absolute inset-0 flex items-center justify-center bg-white/90"><p className="text-sm text-slate-500">No tool activity in this period yet.</p></div>}
          </div>
        </section>

        {tab === 'links' && (
          <section className={`lg:col-span-4 ${panel} flex flex-col`} aria-label="Most clicked links">
            <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Most clicked links</h2>
            <ul className="divide-y divide-slate-200 border-t border-slate-200 flex-grow">
              {linksLoading && links.length === 0 ? [1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="px-5 py-3 animate-pulse"><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-2.5 bg-slate-100 rounded w-1/3 mt-2" /></li>
              )) : topLinks.length === 0 ? (
                <li className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-600">No links yet.</p>
                  {canCreate && <button type="button" onClick={() => open()} className="mt-2 text-sm font-semibold text-primary-700 hover:underline">Create your first link</button>}
                </li>
              ) : topLinks.map((l) => (
                <li key={l.id}>
                  <Link href={`/dashboard/details/${l.shortCode}/`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.favicon || '/favicon.ico'} alt="" onError={(e) => { const t = e.currentTarget; if (t.src.includes(FALLBACK_FAVICON)) t.style.display = 'none'; else t.src = FALLBACK_FAVICON; }} className="w-5 h-5 object-contain shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900 truncate">{l.title || l.shortCode}</span>
                      <span className="block text-xs text-slate-500">/{l.shortCode}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{fmt(clicks(l))}<span className="sr-only"> clicks</span></span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/analytics/" className="px-5 py-3 text-sm font-medium text-primary-700 hover:underline border-t border-slate-200">All analytics</Link>
          </section>
        )}
      </div>

      <section className={panel} aria-label="Recent activity">
        <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <p className="text-sm text-slate-500">Links you shortened and tools you used</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs text-slate-500"><th scope="col" className="px-5 py-2.5 font-medium">Tool</th><th scope="col" className="px-3 py-2.5 font-medium">What happened</th><th scope="col" className="px-3 py-2.5 font-medium">When</th><th scope="col" className="px-5 py-2.5"><span className="sr-only">Open</span></th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {loading && recent.length === 0 ? [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse"><td className="px-5 py-3"><div className="h-3 bg-slate-100 rounded w-28" /></td><td className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-40" /></td><td className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-20" /></td><td /></tr>
              )) : recent.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Nothing yet. Shorten a link or use a tool and it will show up here.</td></tr>
              ) : recent.map((e, i) => {
                const meta = TOOL_META[e.toolType];
                const md: any = e.metadata;
                const detail = md?.shortCode ? `/${md.shortCode}` : md?.bytesSaved ? `saved ${fmt(md.bytesSaved)} bytes` : '';
                return (
                  <tr key={e.id ?? i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-900 whitespace-nowrap">{meta?.label ?? String(e.toolType).replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3 text-slate-600"><span className="capitalize">{e.action}</span>{detail && <span className="text-slate-500"> · {detail}</span>}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{toDateSafe(e.timestamp)?.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {md?.shortCode ? <Link href={`/dashboard/details/${md.shortCode}/`} className="text-primary-700 hover:underline">Details</Link> : meta?.route ? <Link href={meta.route} className="text-primary-700 hover:underline">Open tool</Link> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
