'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { useAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { createShortUrl } from '@/lib/links';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

const labelCls = 'block text-xs font-black text-slate-400 uppercase tracking-widest mb-3';
const inputCls = 'w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700';

export function UtmBuilder() {
  const toast = useToast();
  const { user } = useAuth();
  const [f, setF] = useState({ baseUrl: '', source: '', medium: '', name: '', term: '', content: '' });
  const [customAlias, setCustomAlias] = useState('');
  const [short, setShort] = useState<{ url: string; code: string } | null>(null);
  const [isShortening, setIsShortening] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((s) => ({ ...s, [k]: e.target.value }));
    setShort(null); // parameters changed: previous short link no longer matches
  };

  const finalUrl = useMemo(() => {
    if (!f.baseUrl.trim() || !f.source.trim() || !f.medium.trim() || !f.name.trim()) return '';
    try {
      const url = new URL(f.baseUrl.startsWith('http') ? f.baseUrl : `https://${f.baseUrl}`);
      url.searchParams.set('utm_source', f.source);
      url.searchParams.set('utm_medium', f.medium);
      url.searchParams.set('utm_campaign', f.name);
      if (f.term) url.searchParams.set('utm_term', f.term);
      if (f.content) url.searchParams.set('utm_content', f.content);
      return url.toString();
    } catch {
      return '';
    }
  }, [f]);

  const lastLogged = useRef('');
  useEffect(() => {
    if (!finalUrl || lastLogged.current === finalUrl) return;
    lastLogged.current = finalUrl;
    void logToolUsage('utm_builder', 'generate');
  }, [finalUrl]);

  const copy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shorten = async () => {
    if (!finalUrl) return;
    setIsShortening(true);
    try {
      const r = await createShortUrl(finalUrl, { customAlias });
      setShort({ url: `${env.appUrl}/${r.shortCode}`, code: r.shortCode });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save URL. Please try again.');
    } finally {
      setIsShortening(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label htmlFor="utm-url" className={labelCls}>Website URL *</label>
          <input id="utm-url" value={f.baseUrl} onChange={set('baseUrl')} placeholder="https://example.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="utm-source" className={labelCls}>Campaign Source *</label>
            <input id="utm-source" value={f.source} onChange={set('source')} placeholder="google, newsletter" className={inputCls} />
          </div>
          <div>
            <label htmlFor="utm-medium" className={labelCls}>Campaign Medium *</label>
            <input id="utm-medium" value={f.medium} onChange={set('medium')} placeholder="cpc, email, social" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="utm-name" className={labelCls}>Campaign Name *</label>
          <input id="utm-name" value={f.name} onChange={set('name')} placeholder="spring_sale" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="utm-term" className={labelCls}>Campaign Term</label>
            <input id="utm-term" value={f.term} onChange={set('term')} placeholder="running_shoes" className={inputCls} />
          </div>
          <div>
            <label htmlFor="utm-content" className={labelCls}>Campaign Content</label>
            <input id="utm-content" value={f.content} onChange={set('content')} placeholder="logolink" className={inputCls} />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Required fields</p>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="w-full text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Generated Campaign URL</span>
          <div className="w-full p-6 bg-slate-900 rounded-3xl shadow-inner mb-8 overflow-hidden">
            <p className="text-emerald-400 font-mono text-sm break-all leading-relaxed h-24 overflow-y-auto">{finalUrl || 'URL will appear here...'}</p>
          </div>

          {short && (
            <div className="w-full mb-8 p-5 bg-primary-50 border border-primary-100 rounded-2xl">
              <span className="block text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Short Link Ready</span>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-slate-900 truncate">{short.url}</p>
                <button type="button" aria-label="Copy short link" onClick={() => copy(short.url)} className="shrink-0 w-8 h-8 bg-white border border-primary-200 text-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-copy text-xs" />
                </button>
              </div>
            </div>
          )}

          {!short && (
            <div className="w-full mb-6 space-y-2">
              <label htmlFor="utm-alias" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Custom Alias (Optional)</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">innkie.com/</span>
                <input id="utm-alias" type="text" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} placeholder="campaign-slug" className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-slate-700 text-sm" />
              </div>
            </div>
          )}

          <div className="w-full grid grid-cols-1 gap-3">
            <button type="button" disabled={!finalUrl} onClick={() => copy(finalUrl)} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none">
              <i className="fas fa-copy" /> Copy to Clipboard
            </button>

            {!short && (
              <button type="button" disabled={!finalUrl || isShortening} onClick={shorten} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none">
                <i className={`fas ${isShortening ? 'fa-circle-notch animate-spin' : 'fa-compress-arrows-alt'}`} />
                {isShortening ? 'Shortening...' : 'Shorten this Link'}
              </button>
            )}

            {short && user && (
              <Link href={`/dashboard/details/${short.code}/`} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
                <i className="fas fa-cog" /> Manage Link
              </Link>
            )}

            {short && !user && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Want to track this link?</p>
                <Link href="/login/?signUp=true" className="text-xs font-black text-amber-600 hover:text-amber-800 underline decoration-2 underline-offset-4">Create a Free Account</Link>
              </div>
            )}
          </div>
        </div>

        <AdSlot slotId="utm_builder_sidebar" minHeight="250px" />
      </div>
    </div>
  );
}
