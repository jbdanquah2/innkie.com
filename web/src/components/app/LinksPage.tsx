'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { QrTemplate, ShortUrl } from '@innkie/shared-models';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LinkEditorDialog } from './LinkEditorDialog';
import { LinkQrDialog } from './LinkQrDialog';
import { qrApi } from '@/lib/api/qr';
import { env } from '@/lib/env';
import { useLinks } from '@/lib/links-store';
import { useSlideOver } from '@/lib/slide-over';
import { timeAgo } from '@/lib/time';
import { useToast } from '@/lib/toast';
import { FALLBACK_FAVICON, toDateSafe } from '@/lib/utils/urls';
import { useWorkspace } from '@/lib/workspace';

type Sort = 'newest' | 'oldest' | 'mostClicks' | 'leastClicks';
type Status = 'all' | 'active' | 'inactive';
const PAGE = 20;
/** Instant tooltip for icon buttons (native `title` tooltips lag and cover the neighbouring row). */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">{label}</span>
    </span>
  );
}

const clicks = (l: ShortUrl) => (l.clickCount as number) || 0;

export function LinksPage() {
  const toast = useToast();
  const { links, loaded, error, reload, remove, update } = useLinks();
  // `loaded` is false until the first fetch for this workspace has finished (`loading` is also false before it starts).
  const loading = !loaded && !error;
  const { active } = useWorkspace();
  const { open } = useSlideOver();
  const canEdit = active?.role !== 'viewer';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShortUrl | null>(null);
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);
  const [templates, setTemplates] = useState<QrTemplate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState('');
  const [pending, setPending] = useState<Set<string>>(new Set()); // links whose on/off switch is being saved
  const [bulkDelete, setBulkDelete] = useState(false);

  // New workspace / new filter: start from the first page and drop the selection
  useEffect(() => { setShown(PAGE); }, [query, status, sort, tag, active?.id]);
  useEffect(() => { setSelected(new Set()); setTag(''); }, [active?.id]);

  const tags = useMemo(() => {
    const n = new Map<string, number>();
    links.forEach((l) => l.tags?.forEach((t) => n.set(t, (n.get(t) || 0) + 1)));
    return [...n.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [links]);
  const tagSelected = tags.some(([t]) => t === tag) ? tag : ''; // a tag that no longer exists filters nothing

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = links.filter((l) => {
      if (status === 'active' && !l.isActive) return false;
      if (status === 'inactive' && l.isActive) return false;
      if (tagSelected && !l.tags?.includes(tagSelected)) return false;
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
  }, [links, query, status, sort, tagSelected]);

  const visible = filtered.slice(0, shown);
  const totalClicks = links.reduce((n, l) => n + clicks(l), 0);
  const activeCount = links.filter((l) => l.isActive).length;
  const allSelected = visible.length > 0 && visible.every((l) => selected.has(l.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((l) => l.id)));

  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success('Short link copied'); } catch { toast.error('Could not copy the link'); } };

  const confirmDelete = async () => {
    const id = toDelete;
    setToDelete(null);
    if (!id) return;
    try { await remove(id); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); toast.success('Link deleted'); }
    catch (e: any) { toast.error(e?.message || 'Failed to delete link.'); }
  };

  const setActiveFor = async (targets: ShortUrl[], isActive: boolean) => {
    const ids = targets.map((l) => l.id);
    setPending((p) => new Set([...p, ...ids]));
    let failed = 0;
    for (const l of targets) { try { await update(l.shortCode, { isActive }); } catch { failed++; } }
    setPending((p) => { const n = new Set(p); ids.forEach((i) => n.delete(i)); return n; });
    if (failed) toast.error(failed === targets.length ? 'Could not save the change.' : `${failed} of ${targets.length} links could not be changed.`);
    else toast.success(targets.length === 1 ? (isActive ? 'Link turned on' : 'Link turned off') : `${targets.length} links turned ${isActive ? 'on' : 'off'}`);
  };

  const deleteSelected = async () => {
    setBulkDelete(false);
    const targets = links.filter((l) => selected.has(l.id));
    setBusy(true);
    let failed = 0;
    for (const l of targets) { try { await remove(l.id || l.shortCode); } catch { failed++; } }
    setBusy(false);
    setSelected(new Set());
    if (failed) toast.error(`${targets.length - failed} deleted, ${failed} could not be deleted.`);
    else toast.success(`${targets.length} ${targets.length === 1 ? 'link' : 'links'} deleted`);
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

  useEffect(() => {
    if (!templates) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setTemplates(null); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [templates]);

  const full = (l: ShortUrl) => `${env.appUrl}/${l.shortCode}`;
  const expired = (l: ShortUrl) => { const d = toDateSafe(l.expiration?.expiryDate); return !!d && d.getTime() < Date.now(); };
  const state = (l: ShortUrl) => (!l.isActive ? 'Inactive' : expired(l) ? 'Expired' : 'Active');
  const stateCls = (st: string) => (st === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200');
  const field = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
  const cols = canEdit ? 'grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2rem_minmax(0,1fr)_7.5rem_5rem_7rem_auto]' : 'grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_7.5rem_5rem_7rem_auto]';
  const first = canEdit ? 'col-start-2 md:col-start-auto' : '';
  const iconBtn = 'inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary-600 transition-colors';

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Links</h1>
          <p className="text-slate-600 mt-1">
            {loading ? '\u00a0' : links.length === 0 ? 'No links yet.' : `${links.length.toLocaleString('en-US')} ${links.length === 1 ? 'link' : 'links'}, ${activeCount.toLocaleString('en-US')} active, ${totalClicks.toLocaleString('en-US')} ${totalClicks === 1 ? 'click' : 'clicks'} in total.`}
          </p>
        </div>
        {canEdit && <button type="button" onClick={() => open()} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-on-primary text-sm font-semibold transition-colors w-fit"><i className="fas fa-plus text-xs" aria-hidden="true" /> New link</button>}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input type="search" aria-label="Search links" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, short code, tag or destination" className={`${field} flex-1`} />
        <div className="grid grid-cols-2 md:flex gap-3">
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className={field}>
            <option value="all">All links</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          {tags.length > 0 && (
            <select aria-label="Filter by tag" value={tagSelected} onChange={(e) => setTag(e.target.value)} className={field}>
              <option value="">All tags</option>
              {tags.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}
            </select>
          )}
          <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={field}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="mostClicks">Most clicks</option><option value="leastClicks">Fewest clicks</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-sm text-rose-900 flex items-center justify-between gap-3" role="alert">
          <span>{error}</span><button type="button" onClick={() => void reload()} className="font-semibold underline">Try again</button>
        </div>
      )}

      <div className="pb-20 min-h-[300px]">
        {loading && links.length === 0 ? (
          <ul className="rounded-lg border border-slate-200 bg-white shadow-xs divide-y divide-slate-200" role="status" aria-label="Loading links">
            {[1, 2, 3, 4, 5].map((i) => <li key={i} className="px-4 py-4 animate-pulse"><div className="h-3.5 bg-slate-100 rounded w-1/3" /><div className="h-3 bg-slate-100 rounded w-1/2 mt-2.5" /></li>)}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
            {links.length === 0 ? (
              <>
                <h2 className="font-semibold text-slate-900">No links in this workspace yet</h2>
                <p className="mt-1 text-sm text-slate-600">Paste a long address and get a short link you can track.</p>
                {canEdit && <button type="button" onClick={() => open()} className="mt-4 px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-on-primary text-sm font-semibold transition-colors">Create a link</button>}
              </>
            ) : (
              <>
                <h2 className="font-semibold text-slate-900">No links match</h2>
                <p className="mt-1 text-sm text-slate-600">Try a different search or filter.</p>
                <button type="button" onClick={() => { setQuery(''); setStatus('all'); setTag(''); }} className="mt-3 text-sm font-medium text-primary-700 hover:underline">Clear search and filters</button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
            <div className={`hidden md:grid ${cols} items-center gap-4 px-4 py-2.5 border-b border-slate-200 text-xs text-slate-500 rounded-t-lg`}>
              {canEdit && <span><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all links on this page" className="h-4 w-4 rounded border-slate-300 accent-primary-600" /></span>}
              <span>Link</span><span>Status</span><span className="text-right">Clicks</span><span>Created</span><span className="w-[9.5rem]"><span className="sr-only">Actions</span></span>
            </div>
            <ul className="divide-y divide-slate-200">
              {visible.map((l) => {
                const st = state(l);
                return (
                  <li key={l.id} className={`grid ${cols} items-start md:items-center gap-x-4 gap-y-2 px-4 py-3 ${selected.has(l.id) ? 'bg-primary-50/60' : 'hover:bg-slate-50'} last:rounded-b-lg transition-colors`}>
                    {canEdit && <span className="pt-1 md:pt-0"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.title || l.shortCode}`} className="h-4 w-4 rounded border-slate-300 accent-primary-600" /></span>}
                    <div className="min-w-0 flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.favicon || '/favicon.ico'} alt="" onError={(e) => { const t = e.currentTarget; if (t.src.includes(FALLBACK_FAVICON)) t.style.display = 'none'; else t.src = FALLBACK_FAVICON; }} className="w-5 h-5 object-contain mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 min-w-0">
                          <Link href={`/dashboard/details/${l.shortCode}/`} className="font-medium text-slate-900 hover:text-primary-700 truncate">{l.title || l.shortCode}</Link>
                          {l.passwordProtected && <Tip label="Password protected"><i className="fas fa-lock text-[10px] text-slate-500" role="img" aria-label="Password protected" /></Tip>}
                          {l.source === 'api' && <span className="text-[11px] text-slate-500 border border-slate-200 rounded px-1">API</span>}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm min-w-0">
                          <a href={full(l)} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline truncate">{full(l).replace(/^https?:\/\//, '')}</a>
                          <Tip label="Copy link"><button type="button" onClick={() => copy(full(l))} className="text-slate-400 hover:text-slate-900 shrink-0 p-1 -m-1" aria-label={`Copy ${full(l)}`}><i className="far fa-copy text-xs" aria-hidden="true" /></button></Tip>
                        </p>
                        <p className="text-xs text-slate-500 truncate">{l.originalUrl}</p>
                      </div>
                    </div>
                    <div className={`${first} flex md:block items-center gap-3 text-sm`}>
                      {canEdit ? (
                        <span className="inline-flex items-center gap-2">
                          <button type="button" role="switch" aria-checked={l.isActive} disabled={pending.has(l.id)} aria-label={`${l.title || l.shortCode} is ${l.isActive ? 'on' : 'off'}`} onClick={() => void setActiveFor([l], !l.isActive)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${l.isActive ? 'bg-primary-600' : 'bg-slate-300'}`}>
                            <span aria-hidden="true" className={`absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${l.isActive ? 'translate-x-4' : ''}`} />
                          </button>
                          <span className={`text-xs ${st === 'Active' ? 'text-emerald-700' : st === 'Expired' ? 'text-amber-700' : 'text-slate-500'}`}>{st}</span>
                        </span>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-xs ${stateCls(st)}`}>{st}</span>
                      )}
                      <span className="md:hidden text-slate-600 tabular-nums">{clicks(l).toLocaleString('en-US')} clicks · {timeAgo(l.createdAt)}</span>
                    </div>
                    <span className="hidden md:block text-right font-medium tabular-nums text-slate-900">{clicks(l).toLocaleString('en-US')}</span>
                    <span className="hidden md:block text-sm text-slate-500">{timeAgo(l.createdAt)}</span>
                    <div className={`${first} flex items-center gap-0.5 md:justify-end md:w-[9.5rem]`}>
                      <Tip label="Analytics"><Link href={`/dashboard/details/${l.shortCode}/`} className={iconBtn} aria-label={`Analytics for ${l.title || l.shortCode}`}><i className="fas fa-chart-simple text-sm" aria-hidden="true" /></Link></Tip>
                      <Tip label="QR code"><button type="button" onClick={() => setQrFor(l)} className={iconBtn} aria-label={`QR code for ${l.title || l.shortCode}`}><i className="fas fa-qrcode text-sm" aria-hidden="true" /></button></Tip>
                      {canEdit && <Tip label="Edit"><button type="button" onClick={() => setEditing(l)} className={iconBtn} aria-label={`Edit ${l.title || l.shortCode}`}><i className="fas fa-pen text-sm" aria-hidden="true" /></button></Tip>}
                      {canEdit && <Tip label="Delete"><button type="button" onClick={() => setToDelete(l.id || l.shortCode)} className={`${iconBtn} hover:text-rose-700 hover:bg-rose-50`} aria-label={`Delete ${l.title || l.shortCode}`}><i className="fas fa-trash text-sm" aria-hidden="true" /></button></Tip>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {filtered.length > shown && (
          <div className="flex justify-center pt-6">
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="px-5 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors">
              Show more <span className="text-slate-500">({filtered.length - shown} left)</span>
            </button>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl bg-white border border-slate-300 shadow-lg rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2" role="region" aria-label="Selected links">
          <span className="text-sm font-medium text-slate-900">{selected.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void setActiveFor(links.filter((l) => selected.has(l.id)), true)} disabled={busy} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-60 transition-colors">Turn on</button>
            <button type="button" onClick={() => void setActiveFor(links.filter((l) => selected.has(l.id)), false)} disabled={busy} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-60 transition-colors">Turn off</button>
            <button type="button" onClick={openTemplatePicker} disabled={busy} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-60 transition-colors">Apply QR design</button>
            <button type="button" onClick={() => setBulkDelete(true)} disabled={busy} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-rose-700 hover:border-rose-400 disabled:opacity-60 transition-colors">Delete</button>
            <button type="button" onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Clear</button>
          </div>
        </div>
      )}

      {qrFor && <LinkQrDialog link={qrFor} onClose={() => setQrFor(null)} />}
      {editing && <LinkEditorDialog link={editing} onClose={() => setEditing(null)} onDelete={(id) => { setEditing(null); setToDelete(id); }} />}

      {bulkDelete && <ConfirmDialog type="danger" title={`Delete ${selected.size} ${selected.size === 1 ? 'link' : 'links'}?`} message="These short links stop working straight away and their analytics can no longer be seen. This cannot be undone." confirmText="Delete links" onConfirm={() => void deleteSelected()} onCancel={() => setBulkDelete(false)} />}
      {toDelete && <ConfirmDialog type="danger" title="Delete this link?" message="The short link stops working straight away and you will no longer be able to see its analytics. This cannot be undone." confirmText="Delete link" onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}

      {templates && (
        <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tpl-title" onClick={() => setTemplates(null)}>
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
              <div><h2 id="tpl-title" className="font-semibold text-slate-900">Choose a QR design</h2><p className="text-sm text-slate-500 mt-0.5">It will be applied to {selected.size} {selected.size === 1 ? 'link' : 'links'}.</p></div>
              <button type="button" aria-label="Close" onClick={() => setTemplates(null)} className="w-8 h-8 -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button>
            </div>
            <div className="p-6">
              {templates.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-6">You have no saved designs yet. Make one in <Link href="/qr-studio/" className="text-primary-700 font-medium hover:underline">QR codes</Link> first.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button type="button" disabled={busy} onClick={() => applyTemplate(t)} className="w-full p-4 rounded-md border border-slate-300 hover:border-primary-600 hover:bg-primary-50 text-left text-sm font-medium text-slate-900 transition-colors disabled:opacity-60">{t.name}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
