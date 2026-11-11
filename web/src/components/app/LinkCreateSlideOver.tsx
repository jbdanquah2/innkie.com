'use client';
import { useState } from 'react';
import { useLinks } from '@/lib/links-store';
import { useSlideOver } from '@/lib/slide-over';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';

type ExpMode = 'never' | 'afterClicks' | 'hours' | 'days';
const EXP_MODES: ExpMode[] = ['never', 'afterClicks', 'hours', 'days'];
const URL_RE = /https?:\/\/.+/;

const input = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm';
const small = 'w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 outline-none text-sm transition-all';
const smallLabel = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1';

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

  const urlOk = URL_RE.test(f.originalUrl.trim());
  const pwOk = !f.passwordProtected || f.password.length >= 3;
  const expNum = Math.floor(Number(f.expirationValue));
  const expOk = f.expirationMode === 'never' || f.expirationValue === '' || expNum >= 1;
  const valid = urlOk && pwOk && expOk;

  const reset = () => { setF(EMPTY); setTouched(false); setShowSecurity(false); setShowUtm(false); setShowPw(false); };
  const closeAndReset = () => { close(); reset(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    try {
      // Append UTMs to the destination (also saved as `campaign` metadata)
      let url = f.originalUrl.trim();
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
      toast.success('Link created successfully!');
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
        aria-label="Create new link"
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Link</h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Workspace: {active?.name || 'Personal'}</p>
            </div>
            <button type="button" aria-label="Close" onClick={closeAndReset} className="p-2 hover:bg-slate-200 rounded-full transition-all group"><i className="fas fa-times text-slate-400 group-hover:text-slate-600" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <form onSubmit={submit} noValidate className="space-y-6">
              <div>
                <label htmlFor="lc-url" className="block text-sm font-bold text-slate-700 mb-2">Destination URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i className="fas fa-link text-xs" /></div>
                  <input id="lc-url" type="text" value={f.originalUrl} onChange={(e) => set('originalUrl', e.target.value)} placeholder="https://example.com/very-long-page-url" className={`${input} pl-9`} />
                </div>
                {touched && !urlOk && <p className="mt-2 text-xs font-bold text-rose-500" role="alert">Please enter a valid URL (including http/https)</p>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="lc-alias" className="block text-sm font-bold text-slate-700 mb-2">Custom Alias (Optional)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold">innkie.com/</span>
                    <input id="lc-alias" type="text" value={f.customAlias} onChange={(e) => set('customAlias', e.target.value)} placeholder="summer-sale" className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="lc-tags" className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                  <input id="lc-tags" type="text" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="promo, social, summer-2026" className={input} />
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Separate tags with commas</p>
                </div>
              </div>

              {/* Security & expiration */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button type="button" aria-expanded={showSecurity} onClick={() => setShowSecurity((s) => !s)} className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3"><div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><i className="fas fa-shield-alt text-xs" /></div><span className="text-sm font-bold text-slate-800">Security &amp; Expiration</span></div>
                  <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300 ${showSecurity ? 'rotate-180' : ''}`} />
                </button>
                {showSecurity && (
                  <div className="p-6 bg-white space-y-6 border-t border-slate-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div><span className="text-xs font-bold text-slate-700">Password Protection</span><p className="text-[10px] text-slate-400 font-medium">Require a secret password to access link</p></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" aria-label="Password protection" checked={f.passwordProtected} onChange={(e) => set('passwordProtected', e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                        </label>
                      </div>
                      {f.passwordProtected && (
                        <>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i className="fas fa-lock text-xs" /></div>
                            <input type={showPw ? 'text' : 'password'} aria-label="Link password" autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="Enter password (min 3 characters)" className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary-500 outline-none text-sm transition-all font-medium" />
                            <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"><i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
                          </div>
                          {touched && !pwOk && <p className="text-xs font-bold text-rose-500" role="alert">Password must be at least 3 characters</p>}
                        </>
                      )}
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-3">
                      <div><span className="text-xs font-bold text-slate-700">Link Expiration</span><p className="text-[10px] text-slate-400 font-medium">Deactivate link after duration or clicks</p></div>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
                        {EXP_MODES.map((m) => (
                          <button key={m} type="button" aria-pressed={f.expirationMode === m} onClick={() => set('expirationMode', m)} className={`py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${f.expirationMode === m ? 'bg-white shadow-sm text-primary-600 font-black' : 'text-slate-500'}`}>{m === 'afterClicks' ? 'Clicks' : m}</button>
                        ))}
                      </div>
                      {f.expirationMode !== 'never' && (
                        <div>
                          <label htmlFor="lc-exp" className={smallLabel}>{f.expirationMode === 'afterClicks' ? 'Maximum Clicks' : `Limit (${f.expirationMode})`}</label>
                          <input id="lc-exp" type="number" min={1} step={1} value={f.expirationValue} onChange={(e) => set('expirationValue', e.target.value)} placeholder="e.g. 100" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary-500 outline-none text-sm font-bold" />
                          {!expOk && <p className="mt-1 text-xs font-bold text-rose-500" role="alert">Enter a whole number of 1 or more</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* UTM */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button type="button" aria-expanded={showUtm} onClick={() => setShowUtm((s) => !s)} className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3"><div className="p-2 bg-primary-100 text-primary-600 rounded-lg"><i className="fas fa-bullseye text-xs" /></div><span className="text-sm font-bold text-slate-800">UTM Builder</span></div>
                  <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300 ${showUtm ? 'rotate-180' : ''}`} />
                </button>
                {showUtm && (
                  <div className="p-6 bg-white space-y-4 border-t border-slate-50">
                    <div><label htmlFor="lc-src" className={smallLabel}>Source</label><input id="lc-src" type="text" value={f.utmSource} onChange={(e) => set('utmSource', e.target.value)} placeholder="twitter, newsletter, etc." className={small} /></div>
                    <div><label htmlFor="lc-med" className={smallLabel}>Medium</label><input id="lc-med" type="text" value={f.utmMedium} onChange={(e) => set('utmMedium', e.target.value)} placeholder="cpc, social, email, etc." className={small} /></div>
                    <div><label htmlFor="lc-cmp" className={smallLabel}>Campaign Name</label><input id="lc-cmp" type="text" value={f.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} placeholder="summer_launch" className={small} /></div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                <button type="button" onClick={closeAndReset} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" disabled={busy || (touched && !valid)} className="flex-[2] py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <i className={`fas ${busy ? 'fa-circle-notch animate-spin' : 'fa-magic'}`} /> {busy ? 'Creating...' : 'Shorten Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
