'use client';
import { useEffect, useRef, useState } from 'react';
import { env } from '@/lib/env';
import { normalizeLink } from '@/lib/qr-payload';
import { useLinks } from '@/lib/links-store';
import { useSlideOver } from '@/lib/slide-over';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';

type ExpMode = 'never' | 'afterClicks' | 'hours' | 'days';
const EXP_MODES: ExpMode[] = ['never', 'afterClicks', 'hours', 'days'];
const URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*$/i;
const HOST = env.appUrl.replace(/^https?:\/\//, '');

const input = 'block w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const hint = 'mt-1.5 text-xs text-slate-500';

const EMPTY = { originalUrl: '', customAlias: '', tags: '', passwordProtected: false, password: '', expirationMode: 'never' as ExpMode, expirationValue: '', utmSource: '', utmMedium: '', utmCampaign: '' };

export function LinkCreateSlideOver() {
  const { isOpen, close } = useSlideOver();
  const { create } = useLinks();
  const { active } = useWorkspace();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((s) => ({ ...s, [k]: v }));

  const dest = normalizeLink(f.originalUrl).value; // adds https:// to a bare address like example.com
  const urlOk = URL_RE.test(dest);
  const urlRef = useRef<HTMLInputElement>(null);
  const pwOk = !f.passwordProtected || f.password.length >= 3;
  const expNum = Math.floor(Number(f.expirationValue));
  const expOk = f.expirationMode === 'never' || f.expirationValue === '' || expNum >= 1;
  const valid = urlOk && pwOk && expOk;

  const reset = () => { setF(EMPTY); setTouched(false); setShowSecurity(false); setShowUtm(false); setShowPw(false); };
  const closeAndReset = () => { close(); reset(); };

  // Escape closes the panel, and the address field gets focus when it opens.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => urlRef.current?.focus(), 150);
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAndReset(); };
    document.addEventListener('keydown', h);
    return () => { clearTimeout(t); document.removeEventListener('keydown', h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    try {
      // Append UTMs to the destination (also saved as `campaign` metadata)
      let url = dest;
      const utms = [['utm_source', f.utmSource], ['utm_medium', f.utmMedium], ['utm_campaign', f.utmCampaign]].filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
      if (utms.length) url += (url.includes('?') ? '&' : '?') + utms.join('&');

      const value = f.expirationValue === '' ? 1 : expNum;
      const expiration = f.expirationMode === 'afterClicks' ? { mode: 'oneTime' as const, maxClicks: value }
        : f.expirationMode === 'hours' || f.expirationMode === 'days' ? { mode: 'duration' as const, durationValue: value, durationUnit: f.expirationMode }
        : null;

      await create(url, {
        customAlias: f.customAlias.trim(),
        tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
        ...(f.passwordProtected && f.password ? { passwordProtected: true, password: f.password } : {}),
        ...(expiration ? { expiration } : {}),
        ...(f.utmSource || f.utmMedium || f.utmCampaign ? { campaign: { utmSource: f.utmSource || null, utmMedium: f.utmMedium || null, utmCampaign: f.utmCampaign || null } } : {}),
      });
      toast.success('Link created');
      closeAndReset();
    } catch (err: any) {
      console.error('Error creating link:', err);
      toast.error(err?.message && err.message !== 'Failed to shorten URL' ? err.message : 'Failed to create link. Please check if the alias is already taken.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {isOpen && <div onClick={closeAndReset} className="fixed inset-0 bg-slate-900/40 z-[60]" />}
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-labelledby="lc-title"
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-[70] transform transition-[transform,visibility] duration-300 ease-out border-l border-slate-200 ${isOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'}`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
            <div>
              <h2 id="lc-title" className="text-lg font-semibold text-slate-900">New link</h2>
              <p className="text-sm text-slate-500 mt-0.5">In {active?.name || 'your personal workspace'}</p>
            </div>
            <button type="button" aria-label="Close" onClick={closeAndReset} className="w-8 h-8 -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button>
          </div>

          <form onSubmit={submit} noValidate className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label htmlFor="lc-url" className={label}>Where should it go?</label>
                <input id="lc-url" ref={urlRef} type="text" inputMode="url" autoComplete="off" spellCheck={false} value={f.originalUrl} onChange={(e) => set('originalUrl', e.target.value)} aria-invalid={touched && !urlOk} placeholder="https://example.com/a-very-long-page" className={input} />
                {touched && !urlOk && <p className="mt-1.5 text-sm text-rose-700" role="alert">Enter a web address, such as https://example.com/page</p>}
              </div>

              <div>
                <label htmlFor="lc-alias" className={label}>Custom ending <span className="font-normal text-slate-500">(optional)</span></label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">{HOST}/</span>
                  <input id="lc-alias" type="text" autoComplete="off" spellCheck={false} value={f.customAlias} onChange={(e) => set('customAlias', e.target.value)} placeholder="summer-sale" className={`${input} rounded-l-none`} />
                </div>
              </div>

              <div>
                <label htmlFor="lc-tags" className={label}>Tags <span className="font-normal text-slate-500">(optional)</span></label>
                <input id="lc-tags" type="text" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="promo, social" className={input} />
                <p className={hint}>Separate tags with commas. You can search by tag on the Links page.</p>
              </div>

              <div className="border border-slate-200 rounded-md">
                <button type="button" aria-expanded={showSecurity} onClick={() => setShowSecurity((x) => !x)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-900">Password and expiry</span>
                  <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${showSecurity ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {showSecurity && (
                  <div className="px-4 pb-4 pt-1 space-y-5 border-t border-slate-200">
                    <div className="space-y-3 pt-3">
                      <label className="flex items-start gap-3 text-sm cursor-pointer">
                        <input type="checkbox" checked={f.passwordProtected} onChange={(e) => set('passwordProtected', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600" />
                        <span><span className="font-medium text-slate-900">Ask for a password</span><span className="block text-slate-500">Visitors must enter it before they are sent on.</span></span>
                      </label>
                      {f.passwordProtected && (
                        <div>
                          <div className="relative">
                            <input type={showPw ? 'text' : 'password'} aria-label="Link password" autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 3 characters" className={`${input} pr-16`} />
                            <button type="button" aria-pressed={showPw} onClick={() => setShowPw((x) => !x)} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{showPw ? 'Hide' : 'Show'}</button>
                          </div>
                          {touched && !pwOk && <p className="mt-1.5 text-sm text-rose-700" role="alert">The password needs at least 3 characters.</p>}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900">Stop the link working</p>
                      <div className="mt-2 inline-flex p-1 rounded-lg bg-slate-100" role="group" aria-label="Expiry">
                        {EXP_MODES.map((m) => (
                          <button key={m} type="button" aria-pressed={f.expirationMode === m} onClick={() => set('expirationMode', m)} className={`px-3 py-1 rounded-md text-sm transition-colors ${f.expirationMode === m ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{m === 'never' ? 'Never' : m === 'afterClicks' ? 'After clicks' : m === 'hours' ? 'After hours' : 'After days'}</button>
                        ))}
                      </div>
                      {f.expirationMode !== 'never' && (
                        <div className="mt-3">
                          <label htmlFor="lc-exp" className={label}>{f.expirationMode === 'afterClicks' ? 'Number of clicks' : f.expirationMode === 'hours' ? 'Number of hours' : 'Number of days'}</label>
                          <input id="lc-exp" type="number" min={1} step={1} value={f.expirationValue} onChange={(e) => set('expirationValue', e.target.value)} placeholder="e.g. 100" className={`${input} w-32`} />
                          {!expOk && <p className="mt-1.5 text-sm text-rose-700" role="alert">Enter a whole number of 1 or more.</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-md">
                <button type="button" aria-expanded={showUtm} onClick={() => setShowUtm((x) => !x)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-900">Campaign tags (UTM)</span>
                  <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${showUtm ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {showUtm && (
                  <div className="px-4 pb-4 pt-3 space-y-4 border-t border-slate-200">
                    <p className={hint + ' !mt-0'}>Added to the destination address so your analytics can tell where visitors came from.</p>
                    <div><label htmlFor="lc-src" className={label}>Source</label><input id="lc-src" type="text" value={f.utmSource} onChange={(e) => set('utmSource', e.target.value)} placeholder="newsletter" className={input} /></div>
                    <div><label htmlFor="lc-med" className={label}>Medium</label><input id="lc-med" type="text" value={f.utmMedium} onChange={(e) => set('utmMedium', e.target.value)} placeholder="email" className={input} /></div>
                    <div><label htmlFor="lc-cmp" className={label}>Campaign</label><input id="lc-cmp" type="text" value={f.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} placeholder="summer_launch" className={input} /></div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button type="button" onClick={closeAndReset} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-on-primary text-sm font-semibold transition-colors flex items-center gap-2">
                {busy && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
                {busy ? 'Creating…' : 'Create link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
