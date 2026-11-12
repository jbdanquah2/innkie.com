'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics';
import { useWorkspace } from '@/lib/workspace';
import { themeHex } from '@/lib/theme';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });
const DonutChart = dynamic(() => import('./DonutChart'), { ssr: false, loading: () => <div className="w-40 h-40 rounded-full border-[14px] border-slate-100 mx-auto" /> });
const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> });

interface Stats { devices?: Record<string, number>; browsers?: Record<string, number>; referrers?: Record<string, number>; countries?: Record<string, number> }

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#9333ea', '#94a3b8'];
const DEVICE_COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

/** The biggest few entries, with everything else folded into "Other". */
function topWithOther(map: Record<string, number>, keep = 5): { labels: string[]; data: number[] } {
  const entries = Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, keep);
  const rest = entries.slice(keep).reduce((n, [, v]) => n + v, 0);
  if (rest > 0) top.push(['Other', rest]);
  return { labels: top.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)), data: top.map(([, v]) => v) };
}

const panel = 'rounded-lg border border-slate-200 bg-white shadow-xs';
const Loading = () => <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center" role="status"><p className="text-sm text-slate-500">Loading&hellip;</p></div>;
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

      <section className={`${panel} p-5`} aria-label="Clicks over time">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Clicks over time</h2>
          {!loading && totalClicks > 0 && <p className="text-sm text-slate-500"><span className="font-semibold text-slate-900 tabular-nums">{totalClicks.toLocaleString('en-US')}</span> in this period</p>}
        </div>
        <div className="h-[320px] relative">
          {loading && <Loading />}
          <LineChart labels={evolution.map((d) => d.date)} series={[{ label: 'Clicks', data: evolution.map((d) => d.clicks), color: themeHex(600, '#4f46e5') }]} />
          {noClicks && <div className="absolute inset-0 bg-white/90 flex items-center justify-center"><p className="text-sm text-slate-500">No clicks in this period yet.</p></div>}
        </div>
      </section>

      <section className={`${panel} overflow-hidden`} aria-label="Where visitors are">
        <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Where visitors are</h2>
        <div className="h-[420px] relative border-t border-slate-200">
          <GeoMap variant="hub" counts={countries} max={maxCountry} className="w-full h-full bg-slate-50" />
          {loading && <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center" role="status"><p className="text-sm text-slate-500">Loading&hellip;</p></div>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={`${panel} p-5 flex flex-col`} aria-label="Devices">
          <h2 className="font-semibold text-slate-900 mb-4">Devices</h2>
          <div className="h-[260px] relative flex-grow">
            {loading ? <Loading /> : deviceData.every((n) => n === 0) ? <Empty>No device data yet.</Empty> : <DonutChart labels={['Desktop', 'Mobile', 'Tablet']} data={deviceData} colors={DEVICE_COLORS} hover={DEVICE_COLORS} />}
          </div>
        </section>
        <section className={`${panel} p-5 flex flex-col`} aria-label="Browsers">
          <h2 className="font-semibold text-slate-900 mb-4">Browsers</h2>
          <div className="h-[260px] relative flex-grow">
            {loading ? <Loading /> : browsers.data.length === 0 ? <Empty>No browser data yet.</Empty> : <DonutChart labels={browsers.labels} data={browsers.data} colors={PALETTE} hover={PALETTE} />}
          </div>
        </section>
        <section className={`${panel} flex flex-col`} aria-label="Top sources">
          <h2 className="px-5 pt-5 pb-3 font-semibold text-slate-900">Where clicks come from</h2>
          <ul className="divide-y divide-slate-200 border-t border-slate-200 flex-grow overflow-y-auto min-h-[260px]">
            {loading ? [1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between animate-pulse"><div className="w-28 h-3 bg-slate-100 rounded" /><div className="w-10 h-3 bg-slate-100 rounded" /></li>
            )) : referrers.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-slate-500">No sources for this period.</li>
            ) : referrers.map((r) => (
              <li key={r.name} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-800 truncate">{r.name}</span>
                <span className="font-medium tabular-nums text-slate-900">{r.value.toLocaleString('en-US')}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
