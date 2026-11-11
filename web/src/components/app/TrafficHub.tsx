'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/analytics';
import { useWorkspace } from '@/lib/workspace';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" /> });
const DonutChart = dynamic(() => import('./DonutChart'), { ssr: false, loading: () => <div className="w-48 h-48 rounded-full border-[16px] border-slate-50 mx-auto" /> });
const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-50 animate-pulse" /> });

interface Stats { devices?: Record<string, number>; browsers?: Record<string, number>; referrers?: Record<string, number>; countries?: Record<string, number> }

const Spinner = () => <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />;
const donutSkeleton = (
  <div className="w-48 h-48 rounded-full border-[16px] border-slate-50 mx-auto animate-pulse flex items-center justify-center mt-4"><div className="w-24 h-24 rounded-full border-[16px] border-slate-100/50" /></div>
);

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
  const br = stats?.browsers ?? {};
  const known = ['chrome', 'safari', 'firefox'];
  const browserData = [br['Chrome'] || br['chrome'] || 0, br['Safari'] || br['safari'] || 0, br['Firefox'] || br['firefox'] || 0, Object.entries(br).reduce((a, [k, v]) => (known.includes(k.toLowerCase()) ? a : a + v), 0)];
  const referrers = Object.entries(stats?.referrers ?? {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const countries = stats?.countries ?? {};
  const maxCountry = Math.max(0, ...Object.values(countries));

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Traffic Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Deep-dive insights across all your workspace channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-bold border border-primary-100 items-center gap-2 shadow-sm mr-2"><span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" /> Real-time Sources</div>
          <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-white border-slate-200 border rounded-xl text-xs font-bold text-slate-500 px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer shadow-sm">
            {[[7, 'Last 7 Days'], [30, 'Last 30 Days'], [90, 'Last 90 Days'], [180, 'Last 180 Days'], [365, 'Last 365 Days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="card bg-white p-8 border border-slate-100 shadow-sm rounded-3xl">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-xl font-black text-slate-900 tracking-tight">Click Evolution</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total workspace traffic trend</p></div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fas fa-chart-line" /></div>
        </div>
        <div className="h-[350px] relative">
          {loading && <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center" role="status"><Spinner /></div>}
          <LineChart
            labels={evolution.map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
            series={[{ label: 'Total Clicks', data: evolution.map((d) => d.clicks), color: '#4a6cf7' }]}
          />
        </div>
      </div>

      <div className="card bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div><h2 className="text-xl font-black text-slate-900 tracking-tight">Geographic Hotspots</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global engagement heatmap</p></div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-400 shadow-sm">Visitor Origin</div>
        </div>
        <div className="h-[500px] z-10 relative">
          <GeoMap variant="hub" counts={countries} max={maxCountry} className="w-full h-full bg-slate-50" />
          {loading && <div className="absolute inset-0 bg-white/90 z-[1000] flex items-center justify-center" role="status"><div className="flex flex-col items-center gap-4"><Spinner /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Updating Heatmap...</p></div></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card bg-white p-8 border border-slate-100 shadow-sm rounded-2xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-10"><h2 className="text-lg font-black text-slate-900 tracking-tight">Device Mix</h2><i className="fas fa-mobile-alt text-slate-200 text-xl" /></div>
          <div className="h-[280px] relative flex-grow">
            {loading ? donutSkeleton : <DonutChart labels={['Desktop', 'Mobile', 'Tablet']} data={[dev['desktop'] || 0, dev['mobile'] || 0, dev['tablet'] || 0]} colors={['#4f46e5', '#10b981', '#f59e0b']} hover={['#4338ca', '#059669', '#d97706']} />}
          </div>
        </div>
        <div className="card bg-white p-8 border border-slate-100 shadow-sm rounded-2xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-10"><h2 className="text-lg font-black text-slate-900 tracking-tight">Browser Usage</h2><i className="fas fa-compass text-slate-200 text-xl" /></div>
          <div className="h-[280px] relative flex-grow">
            {loading ? donutSkeleton : <DonutChart labels={['Chrome', 'Safari', 'Firefox', 'Other']} data={browserData} colors={['#3b82f6', '#f43f5e', '#f59e0b', '#94a3b8']} hover={['#2563eb', '#e11d48', '#d97706', '#64748b']} />}
          </div>
        </div>
        <div className="card bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30"><h2 className="text-lg font-black text-slate-900 tracking-tight">Top Sources</h2><i className="fas fa-external-link-alt text-slate-200 text-xl" /></div>
          <div className="divide-y divide-slate-50 flex-grow overflow-y-auto min-h-[300px]">
            {loading ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-8 py-5 flex items-center justify-between animate-pulse"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100" /><div className="w-24 h-3 bg-slate-50 rounded" /></div><div className="w-12 h-4 bg-slate-100 rounded" /></div>
            )) : referrers.length === 0 ? (
              <div className="p-12 text-center text-slate-300 italic text-sm font-medium">No sources found for this period.</div>
            ) : referrers.map((r) => (
              <div key={r.name} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-sm group-hover:bg-primary-600 group-hover:text-white transition-colors"><i className="fas fa-globe" /></div><span className="font-black text-sm text-slate-800">{r.name}</span></div>
                <div className="text-right"><span className="text-sm font-black text-slate-900">{r.value.toLocaleString('en-US')}</span><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Visits</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
