'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { QrTemplate, ShortUrl } from '@innkie/shared-models';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LinkCard } from './LinkCard';
import { LinkEditorDialog } from './LinkEditorDialog';
import { LinkQrDialog } from './LinkQrDialog';
import { qrApi } from '@/lib/api/qr';
import { env } from '@/lib/env';
import { useLinks } from '@/lib/links-store';
import { timeAgo } from '@/lib/time';
import { useToast } from '@/lib/toast';
import { FALLBACK_FAVICON, toDateSafe } from '@/lib/utils/urls';
import { useWorkspace } from '@/lib/workspace';

type Sort = 'newest' | 'oldest' | 'mostClicks' | 'leastClicks';
type Status = 'all' | 'active' | 'inactive';
type View = 'cards' | 'table';
const PAGE = 20;
const clicks = (l: ShortUrl) => (l.clickCount as number) || 0;
const VIEW_KEY = 'links_view_mode';

export function LinksPage() {
  const toast = useToast();
  const { links, loading, error, reload, remove, update } = useLinks();
  const { active } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<View>('cards');
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShortUrl | null>(null);
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);
  const [templates, setTemplates] = useState<QrTemplate[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { try { const v = localStorage.getItem(VIEW_KEY); if (v === 'table' || v === 'cards') setView(v); } catch {} }, []);
  const changeView = (v: View) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch {} };
  // New workspace / new filter: start from the first page and drop the selection
  useEffect(() => { setShown(PAGE); }, [query, status, sort, active?.id]);
  useEffect(() => { setSelected(new Set()); }, [active?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = links.filter((l) => {
      if (status === 'active' && !l.isActive) return false;
      if (status === 'inactive' && l.isActive) return false;
      if (!q) return true;
      return [l.customAlias, l.originalUrl, l.description, l.title, l.shortCode].some((v) => v?.toLowerCase().includes(q)) || !!l.tags?.some((t) => t.toLowerCase().includes(q));
    });
    return list.sort((a, b) => {
      if (sort === 'mostClicks') return clicks(b) - clicks(a);
      if (sort === 'leastClicks') return clicks(a) - clicks(b);
      const ta = toDateSafe(a.createdAt)?.getTime() ?? 0;
      const tb = toDateSafe(b.createdAt)?.getTime() ?? 0;
      return sort === 'newest' ? tb - ta : ta - tb;
    });
  }, [links, query, status, sort]);

  const visible = filtered.slice(0, shown);
  const totalClicks = links.reduce((n, l) => n + clicks(l), 0);
  const activeCount = links.filter((l) => l.isActive).length;
  const topCampaigns = useMemo(() => {
    const m: Record<string, number> = {};
    visible.forEach((l) => { const n = l.campaign?.utmCampaign; if (n) m[n] = (m[n] || 0) + clicks(l); });
    return Object.entries(m).map(([name, c]) => ({ name, clicks: c })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }, [visible]);

  const allSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((l) => l.id)));

  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success('Short URL copied to clipboard!'); } catch { toast.error('Failed to copy URL.'); } };

  const confirmDelete = async () => {
    const id = toDelete;
    setToDelete(null);
    if (!id) return;
    try { await remove(id); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); toast.success('Link deleted.'); }
    catch (e: any) { toast.error(e?.message || 'Failed to delete link.'); }
  };

  const openTemplatePicker = async () => {
    if (!active) return;
    try { setTemplates(await qrApi.list(active.id)); } catch { toast.error('Could not load templates.'); }
  };
  const applyTemplate = async (t: QrTemplate) => {
    const targets = links.filter((l) => selected.has(l.id));
    setBusy(true);
    try {
      // Send only the field being changed (the Angular version PUT the whole link back).
      for (const l of targets) await update(l.shortCode, { qrConfig: t.config });
      toast.success(`Applied "${t.name}" to ${targets.length} links.`);
      setSelected(new Set());
      setTemplates(null);
    } catch { toast.error('Bulk application failed'); }
    finally { setBusy(false); }
  };

  const full = (l: ShortUrl) => `${env.appUrl}/${l.shortCode}`;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Links Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and optimize your workspace URLs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {topCampaigns.length > 0 && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl shadow-lg border border-slate-800">
              <div className="flex flex-col border-r border-slate-800 pr-3"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-tight">Growth</span><span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-tight">Trending</span></div>
              <div className="flex items-center gap-4">{topCampaigns.map((c) => <div key={c.name} className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[80px] leading-tight">{c.name}</span><span className="text-xs font-black text-white leading-tight">{c.clicks}</span></div>)}</div>
            </div>
          )}
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
            <div className="text-center px-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p><p className="text-sm font-black text-slate-800">{links.length}</p></div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center px-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</p><p className="text-sm font-black text-emerald-600">{activeCount}</p></div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center px-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clicks</p><p className="text-sm font-black text-primary-600">{totalClicks}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <label className="flex items-center gap-3 pr-4 border-r border-slate-100 h-10 cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all links" className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select All</span>
          </label>
          <div className="relative flex-grow w-full lg:w-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><i className="fas fa-search text-xs" /></div>
            <input type="search" aria-label="Search links" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, alias, tags or original URL..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="flex-1 lg:flex-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer">
              <option value="all">All Status</option><option value="active">Active Only</option><option value="inactive">Inactive Only</option>
            </select>
            <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="flex-1 lg:flex-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer">
              <option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="mostClicks">Most Clicks</option><option value="leastClicks">Least Clicks</option>
            </select>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200" role="group" aria-label="View mode">
              {(['cards', 'table'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => changeView(v)} title={v === 'cards' ? 'Card View' : 'Table View'} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>
                  <i className={`fas ${v === 'cards' ? 'fa-th-large' : 'fa-table-list'}`} /><span className="hidden sm:inline">{v === 'cards' ? 'Cards' : 'Table'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-24 relative min-h-[400px]">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-bold text-rose-600 flex items-center justify-between" role="alert">
            <span>{error}</span><button type="button" onClick={() => void reload()} className="underline">Retry</button>
          </div>
        )}

        {loading && links.length === 0 ? (
          <div className="grid grid-cols-1 gap-4" role="status" aria-label="Loading links">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-slate-100" />
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="shrink-0 w-5 h-5 bg-slate-100 rounded-lg" /><div className="shrink-0 w-12 h-12 bg-slate-50 rounded-lg" />
                  <div className="flex-1 min-w-0 space-y-2"><div className="h-4 bg-slate-100 rounded w-1/3" /><div className="h-3 bg-slate-50 rounded w-1/2" /><div className="h-2 bg-slate-50 rounded w-1/4" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <i className="fas fa-link text-slate-100 text-7xl mb-6" />
            <h3 className="text-xl font-bold text-slate-800">No links found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your filters or create a new link to get started.</p>
          </div>
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 gap-4">
            {visible.map((l) => <LinkCard key={l.id} link={l} selected={selected.has(l.id)} onToggleSelect={() => toggle(l.id)} onCopy={copy} onEdit={setEditing} onQr={setQrFor} onDelete={setToDelete} />)}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-4 w-12 text-center"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all links" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer" /></th>
                    <th className="py-4 px-4">Link &amp; Vanity Alias</th>
                    <th className="py-4 px-4 hidden md:table-cell">Destination</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-right">Clicks</th>
                    <th className="py-4 px-4 hidden lg:table-cell">Created</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {visible.map((l) => (
                    <tr key={l.id} className={`hover:bg-slate-50/70 transition-colors ${selected.has(l.id) ? 'bg-primary-50' : ''}`}>
                      <td className="py-3 px-4 text-center"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label="Select link" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer" /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={l.favicon || '/favicon.ico'} alt="" onError={(e) => { const t = e.currentTarget; if (t.src.includes(FALLBACK_FAVICON)) t.style.display = 'none'; else t.src = FALLBACK_FAVICON; }} className="w-4 h-4 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2"><span className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs block" title={l.title}>{l.title || l.shortCode}</span>{l.passwordProtected && <i className="fas fa-lock text-[10px] text-amber-500" title="Password Protected" />}</div>
                            <div className="flex items-center gap-2">
                              <a href={full(l)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary-600 hover:underline">{full(l)}</a>
                              <button type="button" onClick={() => copy(full(l))} className="text-slate-400 hover:text-primary-600 transition-colors text-xs" title="Copy Link" aria-label="Copy link"><i className="far fa-copy" /></button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell"><span className="text-xs text-slate-500 truncate max-w-[220px] block" title={l.originalUrl}>{l.originalUrl}</span></td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${l.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{l.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="py-3 px-4 text-right"><span className="font-black text-slate-900 text-sm">{clicks(l)}</span></td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-medium hidden lg:table-cell">{timeAgo(l.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/details/${l.shortCode}/`} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Analytics" aria-label="Analytics"><i className="fas fa-chart-bar text-xs" /></Link>
                          <button type="button" onClick={() => setQrFor(l)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="QR Code" aria-label="QR code"><i className="fas fa-qrcode text-xs" /></button>
                          <button type="button" onClick={() => setEditing(l)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Edit" aria-label="Edit link"><i className="fas fa-edit text-xs" /></button>
                          <button type="button" onClick={() => setToDelete(l.id || l.shortCode)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete" aria-label="Delete link"><i className="fas fa-trash-alt text-xs" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length > shown && (
          <div className="flex justify-center pt-8">
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="px-10 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              Load More Links <span className="text-slate-400 font-medium ml-1">({filtered.length - shown} more)</span>
            </button>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white px-8 py-4 rounded-3xl shadow-xl z-50 flex items-center gap-8">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-black">{selected.size}</div><span className="text-sm font-bold tracking-tight">Links Selected</span></div>
          <div className="h-6 w-px bg-slate-700 mx-2" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={openTemplatePicker} disabled={busy} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"><i className="fas fa-magic" /> Apply Template</button>
            <button type="button" onClick={() => setSelected(new Set())} className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {qrFor && <LinkQrDialog link={qrFor} onClose={() => setQrFor(null)} />}
      {editing && <LinkEditorDialog link={editing} onClose={() => setEditing(null)} onDelete={(id) => { setEditing(null); setToDelete(id); }} />}

      {toDelete && <ConfirmDialog type="danger" title="Delete Link" message="Are you sure you want to delete this link? This action cannot be undone and you will lose all analytics data." confirmText="Delete Link" onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}

      {templates && (
        <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Choose brand design" onClick={() => setTemplates(null)}>
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div><h3 className="text-xl font-black text-slate-900 tracking-tight">Choose Brand Design</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Applying to {selected.size} links</p></div>
              <button type="button" aria-label="Close" onClick={() => setTemplates(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><i className="fas fa-times text-slate-400" /></button>
            </div>
            <div className="p-8">
              {templates.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100"><p className="text-slate-400 text-sm font-medium">No brand templates found.<br />Create one in the <Link href="/qr-studio/" className="text-primary-600 font-bold">QR Studio</Link> first.</p></div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                  {templates.map((t) => (
                    <button key={t.id} type="button" disabled={busy} onClick={() => applyTemplate(t)} className="p-6 bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 rounded-3xl text-left transition-all group disabled:opacity-60">
                      <i className="fas fa-qrcode text-2xl text-slate-300 group-hover:text-primary-600 transition-colors mb-3" />
                      <p className="text-sm font-black text-slate-800">{t.name}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Style</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
