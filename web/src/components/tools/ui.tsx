'use client';
import { useToast } from '@/lib/toast';

export const card = 'bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm';
export const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2';
export const areaCls = 'w-full p-4 font-mono text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary-400 resize-y leading-relaxed';
export const btn = 'px-5 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-30';
export const btnGhost = 'px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-all disabled:opacity-30';

export function useCopy() {
  const toast = useToast();
  return async (text: string, msg = 'Copied to clipboard!') => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Copy failed'); }
  };
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200" role="group">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${value === o.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{o.label}</button>
      ))}
    </div>
  );
}
