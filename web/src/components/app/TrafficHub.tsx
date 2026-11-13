'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics';
import { useWorkspace } from '@/lib/workspace';
import { themeHex } from '@/lib/theme';
import { Ranked } from './RankedList';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });
const DonutChart = dynamic(() => import('./DonutChart'), { ssr: false, loading: () => <div className="w-40 h-40 rounded-full border-[14px] border-slate-100 mx-auto" /> });
const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> });

interface Stats { devices?: Record<string, number>; browsers?: Record<string, number>; referrers?: Record<string, number>; countries?: Record<string, number> }


/** The biggest few entries, with everything else folded into "Other". */
function topWithOther(map: Record<string, number>, keep = 5): { labels: string[]; data: number[] } {
  const entries = Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, keep);
  const rest = entries.slice(keep).reduce((n, [, v]) => n + v, 0);
  if (rest > 0) top.push(['Other', rest]);
  return { labels: top.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)), data: top.map(([, v]) => v) };
}

const panel = 'rounded-lg border border-slate-200 bg-white shadow-xs';
/** Pulsing placeholder that fills its (relative) parent, so panels keep their size while data loads. */
const Loading = () => <div className="absolute inset-0 z-20 rounded-md bg-slate-100/70 animate-pulse" role="status" aria-label="Loading" />;

const Empty = ({ children }: { children: string }) => <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-slate-500">{children}</p></div>;

export function TrafficHub() {
  const { active } = useWorkspace();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [evolution, setEvolution] = useState<{ date: string; clicks: number }[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const wsId = active?.id;

  const load = useCallback(async () => {
    if (!wsId) return;
    setLoading(true);
    try {
      const [evo, st] = await Promise.all([analyticsApi.workspaceClicks(wsId, days), analyticsApi.workspaceStats(wsId, days)]);
      setEvolution(evo ?? []);
      setStats(st ?? null);
    } catch (e) {
      console.error('Failed to load traffic stats', e);
    } finally {
      setLoading(false);
    }
  }, [wsId, days]);
  useEffect(() => { void load(); }, [load]);

  const dev = stats?.devices ?? {};
  const deviceData = [dev['desktop'] || 0, dev['mobile'] || 0, dev['tablet'] || 0];
  const browsers = topWithOther(stats?.browsers ?? {});
  const referrers = Object.entries(stats?.referrers ?? {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const countries = stats?.countries ?? {};
  const maxCountry = Math.max(0, ...Object.values(countries));
  const totalClicks = evolution.reduce((n, d) => n + d.clicks, 0);
  const palette = [themeHex(600, '#1d2127'), '#0891b2', '#059669', '#d97706', '#9333ea', '#94a3b8'];
  const deviceColors = [themeHex(600, '#1d2127'), themeHex(400, '#616468'), themeHex(200, '#c6c8c9')];
  const countryRows = Object.entries(countries).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const kpis: [string, string][] = [
    ['Clicks', totalClicks.toLocaleString('en-US')],
    ['Countries', Object.values(countries).filter((v) => v > 0).length.toLocaleString('en-US')],
    ['Top country', countryRows[0]?.name ?? '\u2013'],
    ['Top source', referrers[0]?.name ?? '\u2013'],
  ];
  const noClicks = !loading && (evolution.length === 0 || totalClicks === 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Clicks, places, devices and sources across {active ? active.name : 'your workspace'}.</p>
        </div>
        <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-fit rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200">
          {[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [180, 'Last 180 days'], [365, 'Last 365 days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <dl className={`${panel} grid grid-cols-2 lg:grid-cols-4`}>
        {kpis.map(([label, value], i) => (
          <div key={label} className={`px-5 py-4 min-w-0 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''} border-slate-200`}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-1 text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 truncate">{loading ? '\u2013' : value}</dd>
          </div>
        ))}
      </dl>

      <section className={`${panel} p-5`} aria-label="Clicks over time">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Clicks over time</h2>
        </div>
        <div className="h-[320px] relative">
          {loading && <Loading />}
          <LineChart labels={evolution.map((d) => d.date)} series={[{ label: 'Clicks', data: evolution.map((d) => d.clicks), color: themeHex(600, '#1d2127') }]} />
          {noClicks && <div className="absolute inset-0 bg-white/90 flex items-center justify-center"><p className="text-sm text-slate-500">No clicks in this period yet.</p></div>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className={`${panel} overflow-hidden lg:col-span-7`} aria-label="Where visitors are">
          <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Where visitors are</h2>
          <div className="h-[360px] relative border-t border-slate-200">
            <GeoMap variant="hub" counts={countries} max={maxCountry} className="w-full h-full bg-slate-50" />
            {loading && <div className="absolute inset-0 z-[1000] bg-slate-100/70 animate-pulse" role="status" aria-label="Loading" />}
          </div>
        </section>
        <section className={`${panel} flex flex-col lg:col-span-5`} aria-label="Top countries">
          <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Top countries</h2>
          <Ranked rows={countryRows} empty="No location data for this period." loading={loading} />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={`${panel} p-5 flex flex-col`} aria-label="Devices">
          <h2 className="font-semibold text-slate-900 mb-4">Devices</h2>
          <div className="h-[260px] relative flex-grow">
            {loading ? <Loading /> : deviceData.every((n) => n === 0) ? <Empty>No device data yet.</Empty> : <DonutChart labels={['Desktop', 'Mobile', 'Tablet']} data={deviceData} colors={deviceColors} hover={deviceColors} />}
          </div>
        </section>
        <section className={`${panel} p-5 flex flex-col`} aria-label="Browsers">
          <h2 className="font-semibold text-slate-900 mb-4">Browsers</h2>
          <div className="h-[260px] relative flex-grow">
            {loading ? <Loading /> : browsers.data.length === 0 ? <Empty>No browser data yet.</Empty> : <DonutChart labels={browsers.labels} data={browsers.data} colors={palette} hover={palette} />}
          </div>
        </section>
        <section className={`${panel} flex flex-col`} aria-label="Top sources">
          <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Where clicks come from</h2>
          <Ranked rows={referrers} empty="No sources for this period." loading={loading} />
        </section>
      </div>
    </div>
  );
}
