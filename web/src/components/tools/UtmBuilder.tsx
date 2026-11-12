'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { useAuth } from '@/lib/auth';
import { env } from '@/lib/env';
import { createShortUrl } from '@/lib/links';
import { logToolUsage } from '@/lib/metrics';
import { PRESETS, buildUtmUrl, missingFields, normalizeBaseUrl, readUtm, tidyValue, utmTips, type UtmValues } from '@/lib/utm';
import { useToast } from '@/lib/toast';

const field = 'block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-base outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1';
const hint = 'mt-1 text-xs text-slate-500';
const ALIAS_RE = /^[A-Za-z0-9_-]*$/;
const EMPTY: UtmValues = { source: '', medium: '', campaign: '', term: '', content: '' };

export function UtmBuilder() {
  const toast = useToast();
  const { user } = useAuth();
  const [baseUrl, setBaseUrl] = useState('');
  const [raw, setRaw] = useState<UtmValues>(EMPTY);
  const [tidy, setTidy] = useState(true);
  const [alias, setAlias] = useState('');
  const [short, setShort] = useState<{ url: string; code: string } | null>(null);
  const [shortening, setShortening] = useState(false);

  const set = (k: keyof UtmValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw((s) => ({ ...s, [k]: e.target.value }));
    setShort(null); // the parameters changed, so an earlier short link no longer matches
  };

  const base = useMemo(() => normalizeBaseUrl(baseUrl), [baseUrl]);
  const values = useMemo<UtmValues>(() => ({
    source: tidyValue(raw.source, tidy),
    medium: tidyValue(raw.medium, tidy),
    campaign: tidyValue(raw.campaign, tidy),
    term: tidyValue(raw.term, tidy),
    content: tidyValue(raw.content, tidy),
  }), [raw, tidy]);
  const missing = missingFields(values);
  const touched = Object.values(raw).some(Boolean);
  const ok = 'url' in base;
  const finalUrl = ok && missing.length === 0 ? buildUtmUrl(base.url, values) : '';
  const tips = useMemo(() => (tidy ? [] : utmTips(raw)), [raw, tidy]);
  const piiTip = useMemo(() => utmTips(raw).filter((t) => t.id === 'pii'), [raw]);
  const params = useMemo(() => readUtm(finalUrl), [finalUrl]);

  const lastLogged = useRef('');
  useEffect(() => {
    if (!finalUrl || lastLogged.current === finalUrl) return;
    lastLogged.current = finalUrl;
    void logToolUsage('utm_builder', 'generate');
  }, [finalUrl]);

  const copy = async (text: string, msg = 'Copied to clipboard') => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Could not copy. Select the link and copy it yourself.'); }
  };

  const aliasOk = ALIAS_RE.test(alias);
  const shorten = async () => {
    if (!finalUrl || !aliasOk) return;
    setShortening(true);
    try {
      const r = await createShortUrl(finalUrl, { customAlias: alias });
      setShort({ url: `${env.appUrl}/${r.shortCode}`, code: r.shortCode });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'The short link could not be created.');
    } finally {
      setShortening(false);
    }
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => { setRaw((s) => ({ ...s, source: p.source, medium: p.medium })); setShort(null); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div>
          <label htmlFor="utm-url" className={label}>Website address <span className="text-rose-600" aria-hidden="true">*</span></label>
          <input id="utm-url" type="text" inputMode="url" autoComplete="off" value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setShort(null); }} placeholder="https://example.com/landing-page" className={field} aria-invalid={!!baseUrl && !ok} />
          {baseUrl && !ok && 'error' in base && base.error && <p role="alert" className="mt-1.5 text-sm text-rose-700">{base.error}</p>}
          {ok && base.addedScheme && <p className={hint}>We added https:// to the start.</p>}
          {ok && base.existingUtm.length > 0 && <p className="mt-1.5 text-sm text-amber-800">This address already has {base.existingUtm.join(', ')}. The values you enter below replace {base.existingUtm.length === 1 ? 'it' : 'them'}.</p>}
        </div>

        <div>
          <p className={label}>Quick start</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => applyPreset(p)} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors">{p.label}</button>
            ))}
          </div>
          <p className={hint}>Fills in the source and medium. You still choose the campaign name.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="utm-source" className={label}>Source <span className="text-rose-600" aria-hidden="true">*</span></label>
            <input id="utm-source" value={raw.source} onChange={set('source')} placeholder="newsletter" className={field} />
            <p className={hint}>Where the visit comes from: a site, a platform, a mailing list.</p>
          </div>
          <div>
            <label htmlFor="utm-medium" className={label}>Medium <span className="text-rose-600" aria-hidden="true">*</span></label>
            <input id="utm-medium" value={raw.medium} onChange={set('medium')} placeholder="email" className={field} />
            <p className={hint}>The kind of channel: email, social, cpc, print.</p>
          </div>
        </div>
        <div>
          <label htmlFor="utm-name" className={label}>Campaign name <span className="text-rose-600" aria-hidden="true">*</span></label>
          <input id="utm-name" value={raw.campaign} onChange={set('campaign')} placeholder="spring-sale" className={field} />
          <p className={hint}>The promotion or launch this link belongs to.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="utm-term" className={label}>Term <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="utm-term" value={raw.term} onChange={set('term')} placeholder="running-shoes" className={field} />
            <p className={hint}>A paid search keyword.</p>
          </div>
          <div>
            <label htmlFor="utm-content" className={label}>Content <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="utm-content" value={raw.content} onChange={set('content')} placeholder="header-button" className={field} />
            <p className={hint}>Tells apart links in the same campaign.</p>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={tidy} onChange={(e) => { setTidy(e.target.checked); setShort(null); }} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600" />
          <span>Tidy values: lowercase, with spaces turned into hyphens. <span className="text-slate-500">Reports treat &quot;Email&quot; and &quot;email&quot; as different values, so this keeps them together.</span></span>
        </label>
        {tips.length > 0 && <ul role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1 list-disc pl-8">{tips.map((t) => <li key={t.id}>{t.message}</li>)}</ul>}
        {piiTip.length > 0 && tidy && <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{piiTip[0].message}</p>}
      </div>

      <div className="min-w-0 space-y-4 lg:sticky lg:top-24">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Your campaign link">
          <h2 className="font-semibold text-slate-900 mb-3">Your campaign link</h2>
          {finalUrl ? (
            <>
              <label htmlFor="utm-result" className="sr-only">Campaign link</label>
              <textarea id="utm-result" readOnly value={finalUrl} rows={4} onFocus={(e) => e.currentTarget.select()} className="block w-full p-3 rounded-lg border border-slate-300 bg-slate-50 font-mono text-sm text-slate-900 break-all resize-none" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => copy(finalUrl)} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors">Copy link</button>
                <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors">Test it</a>
                <Link href={`/tools/qr-generator/?data=${encodeURIComponent(short?.url ?? finalUrl)}`} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors">Make a QR code</Link>
              </div>
              <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm">
                {params.map((p) => (
                  <div key={p.key} className="py-2 flex justify-between gap-4"><dt className="font-mono text-slate-500">{p.key}</dt><dd className="font-mono text-slate-900 break-all text-right">{p.value}</dd></div>
                ))}
              </dl>
              {finalUrl.length > 2000 && <p className="mt-3 text-sm text-amber-800">This link is {finalUrl.length.toLocaleString('en-US')} characters. Some systems cut links off at about 2,000, so consider shortening it.</p>}
            </>
          ) : (
            <p className="text-sm text-slate-500" role="status">
              {touched && ok && missing.length > 0
                ? `Still needed: ${missing.join(', ')}.`
                : 'Enter the website address and the three required fields, and your link appears here.'}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Shorten the link">
          <h2 className="font-semibold text-slate-900">Shorten it</h2>
          <p className="mt-1 text-sm text-slate-600">A short link keeps all the tags, and is neater for social posts and print.</p>
          {short ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-xs font-medium text-emerald-800">Your short link</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <a href={short.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 truncate hover:underline">{short.url}</a>
                <button type="button" onClick={() => copy(short.url, 'Short link copied')} className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500">Copy</button>
              </div>
              {user
                ? <Link href={`/dashboard/details/${short.code}/`} className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline">Manage this link →</Link>
                : <p className="mt-3 text-sm text-slate-600">Want to see its clicks? <Link href="/login/?signUp=true" className="font-semibold text-primary-700 hover:underline">Create a free account</Link>.</p>}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="utm-alias" className="block text-sm font-medium text-slate-700 mb-1">Custom ending <span className="font-normal text-slate-500">(optional)</span></label>
                <div className="flex">
                  <span className="inline-flex shrink-0 items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">innkie.com/</span>
                  <input id="utm-alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="spring-sale" aria-invalid={!aliasOk} className="flex-1 min-w-0 px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200" />
                </div>
                {!aliasOk && <p role="alert" className="mt-1 text-xs text-rose-700">Use only letters, numbers, - and _.</p>}
              </div>
              <button type="button" disabled={!finalUrl || shortening || !aliasOk} onClick={shorten} className="w-full px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {shortening ? 'Shortening…' : 'Shorten this link'}
              </button>
            </div>
          )}
        </section>

        <AdSlot slotId="utm_builder_sidebar" minHeight="250px" />
      </div>
    </div>
  );
}
