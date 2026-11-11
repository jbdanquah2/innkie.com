'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QrTemplate, ShortUrl } from '@innkie/shared-models';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrDesignControls } from './QrDesignControls';
import { qrApi } from '@/lib/api/qr';
import { env } from '@/lib/env';
import { useLinks } from '@/lib/links-store';
import { DEFAULT_DESIGN, fromQrConfig, toQrConfig, type QrDesign } from '@/lib/qr-config';
import { useQrCode } from '@/lib/qr-preview';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';

const TABS = ['Shapes', 'Colors', 'Logo', 'Background', 'Stamper'] as const;
type Tab = (typeof TABS)[number];
type Confirm = { title: string; message: string; type: 'danger' | 'info'; text: string; run: () => Promise<void> };

/** Signed-in QR Studio: design + template library + "stamp" a design onto a link. */
export function QrStudioApp() {
  const toast = useToast();
  const { active } = useWorkspace();
  const { links, update } = useLinks();
  const [tab, setTab] = useState<Tab>('Shapes');
  const [d, setD] = useState<QrDesign>(DEFAULT_DESIGN);
  const [data, setData] = useState('https://innkie.com/branded-qr');
  const [templates, setTemplates] = useState<QrTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((s) => ({ ...s, [k]: v }));
  const { host, download } = useQrCode(d, data);
  const wsId = active?.id;

  useEffect(() => { const q = new URLSearchParams(window.location.search).get('data'); if (q) setData(q); }, []);

  const load = useCallback(async () => {
    if (!wsId) return;
    try { setTemplates(await qrApi.list(wsId)); } catch { setTemplates([]); }
  }, [wsId]);
  useEffect(() => { setEditingId(null); setName(''); void load(); }, [load]);

  const reset = () => { setEditingId(null); setName(''); setD(DEFAULT_DESIGN); };
  const apply = (t: QrTemplate) => { setEditingId(t.id); setName(t.name); setD(fromQrConfig(t.config)); };

  const save = async () => {
    if (!name.trim()) return toast.error('Please enter a template name');
    if (!wsId) return toast.error('No active workspace');
    const config = toQrConfig(d);
    const before = templates;
    const optimistic: QrTemplate = { id: editingId || `temp_${Date.now()}`, name: name.trim(), config, createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any };
    setTemplates(editingId ? templates.map((t) => (t.id === editingId ? optimistic : t)) : [optimistic, ...templates]);
    const wasEditing = editingId;
    const finalName = name.trim();
    reset();
    try {
      if (wasEditing) { await qrApi.update(wasEditing, finalName, config); toast.success('Template updated!'); }
      else { await qrApi.create(wsId, finalName, config); toast.success('Template saved!'); }
      await load();
    } catch { setTemplates(before); toast.error('Failed to save template'); }
  };

  const askDelete = (t: QrTemplate) => setConfirm({
    title: 'Delete Template', message: 'Are you sure you want to delete this QR design template? This cannot be undone.', type: 'danger', text: 'Delete Template',
    run: async () => { try { await qrApi.remove(t.id, wsId); if (editingId === t.id) reset(); await load(); } catch { toast.error('Failed to delete template'); } },
  });

  const stamp = (l: ShortUrl) => setConfirm({
    title: 'Apply Design', message: `Apply this custom QR design to "${l.title || l.shortCode}"?`, type: 'info', text: 'Apply Style',
    run: async () => { try { await update(l.shortCode, { qrConfig: toQrConfig(d) }); toast.success('Design applied to link!'); } catch { toast.error('Failed to apply design'); } },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? links.filter((l) => l.shortCode.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q) || l.originalUrl.toLowerCase().includes(q)) : links;
  }, [links, query]);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Studio</h1>
        <p className="text-slate-500 font-medium mt-1">Design your brand&apos;s unique QR style.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="card p-10 bg-white border border-slate-100 shadow-sm rounded-3xl flex flex-col items-center gap-6">
            <div ref={host} className="rounded-3xl shadow-md border border-slate-50 transition-transform duration-500 hover:scale-105 bg-white overflow-hidden flex items-center justify-center" style={{ width: 300, height: 300 }} />
            <div className="text-center space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Brand Preview</p><p className="text-sm font-bold text-slate-600">Apply this style to any link</p></div>
            <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-6 border-t border-slate-50">
              <button type="button" onClick={() => download(`branded-qr-${name || 'design'}`, 'png')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-colors group/dl"><i className="fas fa-file-image text-slate-300 group-hover/dl:text-primary-500 transition-colors mb-2" /><span className="text-[10px] font-black uppercase text-slate-500">Download PNG</span></button>
              <button type="button" onClick={() => download(`branded-qr-${name || 'design'}`, 'svg')} className="flex flex-col items-center justify-center p-4 bg-primary-50 hover:bg-primary-100 rounded-3xl transition-colors group/dl"><i className="fas fa-file-code text-primary-300 group-hover/dl:text-primary-600 transition-colors mb-2" /><span className="text-[10px] font-black uppercase text-primary-600">Download SVG</span></button>
            </div>
          </div>

          <div className="bg-primary-600 p-8 rounded-3xl text-white shadow-md border border-primary-500">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="font-black text-lg flex items-center gap-2"><i className="fas fa-bookmark text-primary-300" /> Library</h2><p className="text-[10px] text-primary-200 font-bold uppercase tracking-widest mt-1">Workspace Designs</p></div>
              <button type="button" onClick={reset} className="px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95">New Design</button>
            </div>
            {templates.length === 0 && <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10"><i className="fas fa-magic text-primary-300/20 text-4xl mb-3" /><p className="text-primary-200 text-xs font-bold italic">No saved styles yet.</p></div>}
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {templates.map((t) => (
                <div key={t.id} className={`group relative aspect-[4/3] bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all overflow-hidden ${editingId === t.id ? 'ring-2 ring-white' : ''}`}>
                  <button type="button" onClick={() => apply(t)} className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <i className="fas fa-qrcode text-2xl mb-2 opacity-40 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-tighter truncate w-full">{t.name}</span>
                  </button>
                  <button type="button" onClick={() => askDelete(t)} aria-label={`Delete ${t.name}`} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:scale-110 shadow-sm"><i className="fas fa-trash-alt text-[8px]" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {editingId && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-2">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm"><i className="fas fa-edit" /></div><div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Editing Template</p><p className="text-sm font-black text-emerald-900 mt-1">{name}</p></div></div>
              <button type="button" onClick={reset} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Discard Changes</button>
            </div>
          )}

          <div className="card bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="flex border-b border-slate-50 p-2 gap-1 bg-slate-50/30" role="tablist">
              {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/60 ${tab === t ? 'bg-white text-primary-600 shadow-sm' : ''}`}>{t}</button>)}
            </div>
            <div className="p-8">
              {tab !== 'Stamper' && <QrDesignControls tab={tab} d={d} set={set} />}
              {tab === 'Stamper' && (
                <div className="space-y-6">
                  <div className="relative"><i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" /><input type="search" aria-label="Search links" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search links to brand..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium" /></div>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {filtered.length === 0 && <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm">No matching links found.</div>}
                    {filtered.map((l) => (
                      <div key={l.id} className="p-4 bg-white border border-slate-100 hover:border-primary-200 rounded-2xl transition-all flex items-center justify-between shadow-sm">
                        <div className="min-w-0 pr-4"><p className="text-xs font-black text-slate-900 truncate">{l.title || l.shortCode}</p><p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{env.appUrl.replace(/^https?:\/\//, '')}/{l.shortCode}</p></div>
                        <button type="button" onClick={() => stamp(l)} className="shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md shadow-primary-100 transition-all active:scale-95">Stamp</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm"><i className={`fas ${editingId ? 'fa-sync-alt' : 'fa-save'}`} /></div><h3 className="text-sm font-bold text-slate-900">{editingId ? 'Update Template' : 'Finalize Template'}</h3></div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" aria-label="Template name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Promo 2026" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" />
                  <button type="button" onClick={save} disabled={!name.trim()} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-100 transition-all active:scale-95">{editingId ? 'Update Design' : 'Save to Library'}</button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">Want a quick code without an account workflow? Try the <Link href="/tools/qr-generator/" className="text-primary-600 font-bold">QR Generator</Link>.</p>
        </div>
      </div>

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
