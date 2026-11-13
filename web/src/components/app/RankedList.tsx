'use client';

/** A ranked list with a proportional bar behind each row, so the biggest entries read at a glance. */
export function Ranked({ rows, empty, loading }: { rows: { name: string; value: number }[]; empty: string; loading: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="divide-y divide-slate-100 border-t border-slate-200 flex-grow overflow-y-auto min-h-[260px]">
      {loading ? [1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="px-5 py-3 flex items-center justify-between animate-pulse"><div className="w-28 h-3 bg-slate-100 rounded" /><div className="w-10 h-3 bg-slate-100 rounded" /></li>
      )) : rows.length === 0 ? (
        <li className="px-5 py-10 text-center text-sm text-slate-500">{empty}</li>
      ) : rows.map((r) => (
        <li key={r.name} className="relative px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
          <span aria-hidden="true" className="absolute inset-y-1 left-3 rounded bg-primary-50" style={{ width: `calc((100% - 1.5rem) * ${r.value / max})` }} />
          <span className="relative text-slate-800 truncate">{r.name}</span>
          <span className="relative font-medium tabular-nums text-slate-900">{r.value.toLocaleString('en-US')}</span>
        </li>
      ))}
    </ul>
  );
}

