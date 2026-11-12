'use client';
import { useEffect, useState } from 'react';
import type { ShortUrl } from '@innkie/shared-models';
import { env } from '@/lib/env';
import { useToast } from '@/lib/toast';

const COPIED_KEY = 'innkie.started.copied';
const DISMISSED_KEY = 'innkie.started.dismissed';
const read = (k: string) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const write = (k: string) => { try { localStorage.setItem(k, '1'); } catch { /* private mode: the step just stays open */ } };

const Tick = ({ done }: { done: boolean }) => (
  <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${done ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
    <i className="fas fa-check" />
  </span>
);

/** First-run checklist on the Overview. It goes away by itself once the workspace has had its first click. */
export function GettingStarted({ links, totalClicks, onCreate }: { links: ShortUrl[]; totalClicks: number; onCreate: () => void }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until localStorage has been read, so it never flashes in and out
  useEffect(() => { setCopied(read(COPIED_KEY)); setDismissed(read(DISMISSED_KEY)); }, []);

  if (dismissed || totalClicks > 0) return null;

  const latest = [...links].sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0))[0] ?? links[0];
  const url = latest ? `${env.appUrl}/${latest.shortCode}` : '';
  const hasLink = links.length > 0;
  const steps = [hasLink, hasLink && copied, false];
  const doneCount = steps.filter(Boolean).length;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); write(COPIED_KEY); toast.success('Short link copied'); }
    catch { toast.error('Could not copy the link'); }
  };
  const dismiss = () => { setDismissed(true); write(DISMISSED_KEY); };

  return (
    <section aria-labelledby="gs-title" className="rounded-lg border border-slate-200 bg-white">
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-slate-200">
        <div>
          <h2 id="gs-title" className="font-semibold text-slate-900">Get your first click</h2>
          <p className="text-sm text-slate-600 mt-0.5">{doneCount} of 3 done. This goes away after your first click.</p>
        </div>
        <button type="button" onClick={dismiss} className="text-sm font-medium text-slate-500 hover:text-slate-900 shrink-0">Dismiss</button>
      </div>
      <ol className="divide-y divide-slate-200">
        <li className="px-5 py-4 flex gap-3">
          <Tick done={hasLink} />
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="text-sm font-medium text-slate-900">Create a short link</p><p className="text-sm text-slate-600">Paste a long address and get a short one you can track.</p></div>
            {!hasLink && <button type="button" onClick={onCreate} className="shrink-0 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition-colors">Create a link</button>}
          </div>
        </li>
        <li className={`px-5 py-4 flex gap-3 ${hasLink ? '' : 'opacity-60'}`}>
          <Tick done={hasLink && copied} />
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-medium text-slate-900">Copy it and share it</p><p className="text-sm text-slate-600 truncate">{hasLink ? url.replace(/^https?:\/\//, '') : 'Your short link will appear here.'}</p></div>
            {hasLink && <button type="button" onClick={copy} className="shrink-0 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors">{copied ? 'Copy again' : 'Copy link'}</button>}
          </div>
        </li>
        <li className={`px-5 py-4 flex gap-3 ${hasLink ? '' : 'opacity-60'}`}>
          <Tick done={false} />
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="text-sm font-medium text-slate-900">See the first click arrive</p><p className="text-sm text-slate-600">Send the link to someone, or open it yourself to test. Your own visit counts as a click.</p></div>
            {hasLink && <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors">Open the link</a>}
          </div>
        </li>
      </ol>
    </section>
  );
}
