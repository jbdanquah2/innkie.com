'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { ShortUrl } from '@innkie/shared-models';
import { env } from '@/lib/env';
import { useTimeAgo } from '@/lib/time';
import { FALLBACK_FAVICON, toDateSafe } from '@/lib/utils/urls';

interface Props {
  link: ShortUrl;
  selected?: boolean;
  isGuest?: boolean;
  onToggleSelect?: () => void;
  onCopy: (text: string) => void;
  onEdit?: (l: ShortUrl) => void;
  onQr?: (l: ShortUrl) => void;
  onDelete: (id: string) => void;
}

const iconBtn = 'p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all';

export function LinkCard({ link, selected = false, isGuest = false, onToggleSelect, onCopy, onEdit, onQr, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState(false);
  const created = useTimeAgo(link.createdAt);
  const lastClick = useTimeAgo(link.lastClickedAt);
  const full = link.shortCode ? `${env.appUrl}/${link.shortCode}` : '';
  const active = link.isActive;
  const detailsHref = `/dashboard/details/${link.shortCode}/`;

  const copy = () => { onCopy(full); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const share = () => {
    if (navigator.share) navigator.share({ title: link.title || 'Check out this link', text: link.description || 'Shortened with iNNkie', url: full }).catch(() => {});
    else copy();
  };

  return (
    <div className={`relative group rounded-xl border transition-all duration-200 p-4 ${!active ? 'opacity-60 bg-slate-50' : ''} ${selected ? 'bg-white border-primary-500 ring-2 ring-primary-500/10 shadow-lg shadow-primary-100' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200'}`}>
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-xl transition-colors duration-200 ${active ? 'bg-primary-500' : 'bg-slate-300'}`} aria-hidden="true" />
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {!isGuest && (
          <div className="shrink-0 flex items-center pr-2">
            <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label="Select link" className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer transition-all" />
          </div>
        )}

        <div className="shrink-0 w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={link.favicon || '/favicon.ico'} alt="Site icon" onError={(e) => { const t = e.currentTarget; if (t.src.includes(FALLBACK_FAVICON)) t.style.display = 'none'; else t.src = FALLBACK_FAVICON; }} className={`w-6 h-6 object-contain transition-all duration-300 ${active ? '' : 'grayscale'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-slate-900 truncate" title={link.title}>{link.title || 'Untitled Link'}</h4>
            {link.passwordProtected && <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1"><i className="fas fa-lock text-[8px]" /> Locked</span>}
            {link.source === 'api' && <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100 flex items-center gap-1" title="Created via API"><i className="fas fa-code text-[8px]" /> API</span>}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <a href={full} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-semibold text-sm hover:underline truncate">{full}</a>
            <button type="button" onClick={copy} className="text-slate-400 hover:text-primary-600 transition-colors p-1" aria-label={copied ? 'Copied' : 'Copy short URL'} title={copied ? 'Copied!' : 'Copy'}>
              <i className={copied ? 'fas fa-check text-emerald-500 text-xs' : 'far fa-copy text-xs'} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate max-w-[200px] md:max-w-md flex items-center gap-1.5"><i className="fas fa-arrow-right opacity-40 text-[10px]" /><span className="truncate">{link.originalUrl}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-6 px-4 border-l border-slate-100 md:h-12">
          {isGuest ? (
            <div className="flex flex-col items-center opacity-40"><span className="text-lg font-bold text-slate-900">{(link.clickCount as number) || 0}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clicks</span></div>
          ) : (
            <Link href={detailsHref} className="flex flex-col items-center group/stat focus:outline-none" aria-label="View analytics">
              <span className="text-lg font-bold text-slate-900 group-hover/stat:text-primary-600 transition-colors">{(link.clickCount as number) || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clicks</span>
            </Link>
          )}
          <div className="hidden sm:flex flex-col items-center"><span className="text-sm font-semibold text-slate-700">{created}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</span></div>
        </div>

        <div className="flex items-center gap-1 md:ml-2">
          {!isGuest && <Link href={detailsHref} className={iconBtn} aria-label="Analytics" title="Analytics"><i className="fas fa-chart-bar" /></Link>}
          {onQr && <button type="button" onClick={() => onQr(link)} className={iconBtn} aria-label="QR Code" title="QR Code"><i className="fas fa-qrcode" /></button>}
          <button type="button" onClick={share} className={iconBtn} aria-label="Share" title="Share"><i className="fas fa-share-alt" /></button>
          {!isGuest && onEdit && <button type="button" onClick={() => onEdit(link)} className={iconBtn} aria-label="Edit" title="Edit"><i className="fas fa-edit" /></button>}
          <button type="button" onClick={() => onDelete(link.id || link.shortCode)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" aria-label="Delete link" title="Delete"><i className="fas fa-trash-alt" /></button>
          <button type="button" onClick={() => setDetails((d) => !d)} aria-expanded={details} aria-label="Toggle details" title="More info" className={`${iconBtn} ${details ? 'bg-primary-50 text-primary-600' : ''}`}><i className="fas fa-info-circle" /></button>
        </div>
      </div>

      {details && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {link.description && <div className="col-span-1 md:col-span-2"><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span><p className="text-slate-700 leading-relaxed">{link.description}</p></div>}
            <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</span><p className="text-slate-700 font-medium">{toDateSafe(link.createdAt)?.toLocaleString() ?? ''}</p></div>
            {link.lastClickedAt && <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Activity</span><p className="text-slate-700 font-medium">{lastClick}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
