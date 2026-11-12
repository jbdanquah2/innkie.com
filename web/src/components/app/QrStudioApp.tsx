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
    title: 'Delete this design?', message: 'Links that already use it keep their QR code. This cannot be undone.', type: 'danger', text: 'Delete design',
    run: async () => { try { await qrApi.remove(t.id, wsId); if (editingId === t.id) reset(); await load(); } catch { toast.error('Failed to delete template'); } },
  });

  const stamp = (l: ShortUrl) => setConfirm({
    title: 'Apply this design?', message: `The QR code for "${l.title || l.shortCode}" will use the design shown in the preview.`, type: 'info', text: 'Apply design',
    run: async () => { try { await update(l.shortCode, { qrConfig: toQrConfig(d) }); toast.success('Design applied to link!'); } catch { toast.error('Failed to apply design'); } },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? links.filter((l) => l.shortCode.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q) || l.originalUrl.toLowerCase().includes(q)) : links;
  }, [links, query]);

  const canEdit = active?.role !== 'viewer';
  const panel = 'rounded-lg border border-slate-200 bg-white shadow-xs';
  const btn = 'px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">QR codes</h1>
        <p className="text-slate-600 mt-1">Design a QR style, save it for your workspace, and put it on your links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <section className={`${panel} p-5`} aria-label="Preview">
            <div className="mx-auto" style={{ width: 300, height: 300, maxWidth: '100%' }}>
              <div ref={host} className="rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center" style={{ width: 300, height: 300 }} role="img" aria-label="QR code preview" />
            </div>
            <p className="mt-3 text-sm text-slate-500 text-center">A sample code. Saved designs are applied to your own links.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <button type="button" onClick={() => download(`branded-qr-${name || 'design'}`, 'png')} className={btn}>Download PNG</button>
              <button type="button" onClick={() => download(`branded-qr-${name || 'design'}`, 'svg')} className={btn}>Download SVG</button>
            </div>
          </section>

          <section className={panel} aria-label="Saved designs">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Saved designs</h2>
              {canEdit && <button type="button" onClick={reset} className="text-sm font-medium text-primary-700 hover:underline">New design</button>}
            </div>
            {templates.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">No saved designs yet. Style a code and save it below.</p>
            ) : (
              <ul className="border-t border-slate-200 divide-y divide-slate-200 max-h-[360px] overflow-y-auto">
                {templates.map((t) => (
                  <li key={t.id} className={`flex items-center justify-between gap-2 pl-5 pr-2 ${editingId === t.id ? 'bg-primary-50' : ''}`}>
                    <button type="button" onClick={() => apply(t)} aria-pressed={editingId === t.id} className="flex-1 min-w-0 py-3 text-left text-sm font-medium text-slate-900 truncate hover:text-primary-700">{t.name}</button>
                    {canEdit && <button type="button" onClick={() => askDelete(t)} aria-label={`Delete ${t.name}`} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50"><i className="fas fa-trash text-sm" aria-hidden="true" /></button>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {editingId && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-primary-200 bg-primary-50 text-sm">
              <p className="text-primary-900">Editing <span className="font-semibold">{name}</span></p>
              <button type="button" onClick={reset} className="font-medium text-slate-600 hover:text-slate-900">Discard changes</button>
            </div>
          )}

          <section className={`${panel} p-5`} aria-label="Design">
            <div className="inline-flex flex-wrap p-1 rounded-lg bg-slate-100 mb-5" role="tablist" aria-label="Design options">
              {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${tab === t ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{t === 'Stamper' ? 'Apply to a link' : t}</button>)}
            </div>

            {tab !== 'Stamper' && <QrDesignControls tab={tab} d={d} set={set} />}
            {tab === 'Stamper' && (
              <div className="space-y-4">
                <input type="search" aria-label="Search links" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your links" className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200" />
                {filtered.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No matching links.</p> : (
                  <ul className="divide-y divide-slate-200 border-y border-slate-200 max-h-96 overflow-y-auto">
                    {filtered.map((l) => (
                      <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{l.title || l.shortCode}</p><p className="text-xs text-slate-500 truncate">{env.appUrl.replace(/^https?:\/\//, '')}/{l.shortCode}</p></div>
                        {canEdit && <button type="button" onClick={() => stamp(l)} className={`${btn} shrink-0`}>Apply design</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {canEdit && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <label htmlFor="qr-tpl-name" className="block text-sm font-medium text-slate-700 mb-1.5">{editingId ? 'Update this design' : 'Save this design'}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input id="qr-tpl-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer promo" className="block flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200" />
                  <button type="button" onClick={save} disabled={!name.trim()} className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-on-primary text-sm font-semibold transition-colors">{editingId ? 'Update design' : 'Save design'}</button>
                </div>
              </div>
            )}
          </section>
          <p className="text-sm text-slate-500">Need a one-off code for Wi-Fi, email or a phone number? Use the <Link href="/tools/qr-generator/" className="text-primary-700 hover:underline">QR code generator</Link>.</p>
        </div>
      </div>

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
