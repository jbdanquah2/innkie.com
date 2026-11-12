'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchLinks } from '@/lib/link-search';
import { useLinks } from '@/lib/links-store';
import { env } from '@/lib/env';

export interface PaletteItem { id: string; label: string; hint?: string; icon: string; run: () => void }

/** Cmd/Ctrl+K: jump to a page, start a new link, or find any link in the workspace by title, short code, tag or destination. */
export function CommandPalette({ open, onClose, pages, onNewLink }: { open: boolean; onClose: () => void; pages: { href: string; label: string; icon: string }[]; onNewLink?: () => void }) {
  const router = useRouter();
  const { links } = useLinks();
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => { if (open) { setQ(''); setCursor(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);

  const items = useMemo<{ group: string; item: PaletteItem }[]>(() => {
    const go = (href: string) => () => { onClose(); router.push(href); };
    const term = q.trim().toLowerCase();
    const out: { group: string; item: PaletteItem }[] = [];
    if (onNewLink && (!term || 'new link create'.includes(term) || 'new link'.startsWith(term))) out.push({ group: 'Actions', item: { id: 'new', label: 'New link', icon: 'fa-plus', run: () => { onClose(); onNewLink(); } } });
    pages.filter((p) => !term || p.label.toLowerCase().includes(term)).forEach((p) => out.push({ group: 'Go to', item: { id: p.href, label: p.label, icon: p.icon, run: go(p.href) } }));
    searchLinks(links, q, term ? 8 : 5).forEach((l) => out.push({ group: term ? 'Links' : 'Recent links', item: { id: `l-${l.id}`, label: l.title || l.shortCode, hint: `${env.appUrl.replace(/^https?:\/\//, '')}/${l.shortCode}`, icon: 'fa-link', run: go(`/dashboard/details/${l.shortCode}/`) } }));
    return out;
  }, [q, links, pages, onNewLink, onClose, router]);

  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [cursor]);

  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (items.length ? (c + 1) % items.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (items.length ? (c - 1 + items.length) % items.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[cursor]?.item.run(); }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/40 flex items-start justify-center px-4 pt-[12vh]" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Search and jump to" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey} className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <i className="fas fa-magnifying-glass text-slate-400 text-sm" aria-hidden="true" />
          <input ref={input} type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={items[cursor] ? `cmdk-${items[cursor].item.id}` : undefined} aria-label="Search links and pages" autoComplete="off" spellCheck={false} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search links, or jump to a page" className="flex-1 py-3.5 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none" />
          <kbd className="hidden sm:inline text-[11px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul id="cmdk-list" ref={list} role="listbox" className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500" role="presentation">No links or pages match &ldquo;{q.trim()}&rdquo;.</li>}
          {items.map(({ group, item }, i) => {
            const head = group !== lastGroup ? group : '';
            lastGroup = group;
            return (
              <li key={item.id} role="presentation">
                {head && <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-slate-500">{head}</p>}
                <div id={`cmdk-${item.id}`} role="option" aria-selected={i === cursor} onMouseMove={() => setCursor(i)} onClick={item.run} className={`mx-2 flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm ${i === cursor ? 'bg-primary-50 text-primary-800' : 'text-slate-700'}`}>
                  <i className={`fas ${item.icon} w-4 text-center text-xs ${i === cursor ? 'text-primary-600' : 'text-slate-400'}`} aria-hidden="true" />
                  <span className="truncate font-medium">{item.label}</span>
                  {item.hint && <span className="ml-auto truncate text-xs text-slate-500">{item.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
          <span><kbd className="font-sans">↑↓</kbd> to move</span><span><kbd className="font-sans">Enter</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}
