'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ShortUrl } from '@innkie/shared-models';
import { linksApi } from '@/lib/api/links';
import { useLinks } from '@/lib/links-store';
import { useToast } from '@/lib/toast';
import { APP_PATHS } from '@/lib/utils/urls';

type ExpMode = 'never' | 'afterClicks' | 'hours' | 'days';
const EXP_MODES: ExpMode[] = ['never', 'afterClicks', 'hours', 'days'];
const ALIAS_RE = /^[a-zA-Z0-9_-]{6,20}$/;
const RESERVED = new Set(APP_PATHS.map((p) => p.toLowerCase()));

const field = 'block w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const err = 'mt-1.5 text-sm text-rose-700';
const hint = 'mt-1.5 text-xs text-slate-500';
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="pt-6 first:pt-0 border-t first:border-t-0 border-slate-200">
    <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
    {children}
  </section>
);

function initialExp(d: ShortUrl): { mode: ExpMode; value: string } {
  const e: any = d.expiration;
  if (e?.mode === 'oneTime') return { mode: 'afterClicks', value: String(e.maxClicks ?? 1) };
  if (e?.mode === 'duration' && (e.durationUnit === 'hours' || e.durationUnit === 'days')) return { mode: e.durationUnit, value: String(e.durationValue ?? 1) };
  return { mode: 'never', value: '' };
}

interface Props {
  link: ShortUrl;
  onClose: () => void;
  /** Called after a successful save with the fields that changed. */
  onSaved?: (updates: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export function LinkEditorDialog({ link, onClose, onSaved, onDelete }: Props) {
  const toast = useToast();
  const { links, update } = useLinks();
  const exp0 = useMemo(() => initialExp(link), [link]);
  const [f, setF] = useState({
    title: link.title ?? '',
    customAlias: link.customAlias ?? '',
    tags: (link.tags || []).join(', '),
    utmSource: link.campaign?.utmSource ?? '',
    utmMedium: link.campaign?.utmMedium ?? '',
    utmCampaign: link.campaign?.utmCampaign ?? '',
    expMode: exp0.mode,
    expValue: exp0.value,
    passwordProtected: !!link.passwordProtected,
    password: '',
    description: link.description ?? '',
    isActive: link.isActive ?? true,
  });
  const [touched, setTouched] = useState(false);
  const [hide, setHide] = useState(true);
  const [busy, setBusy] = useState(false);
  const [aliasTaken, setAliasTaken] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, busy]);

  const alias = f.customAlias.toLowerCase().trim();
  const aliasChanged = alias !== (link.customAlias ?? '');
  const titleErr = !f.title.trim() ? 'Title is required' : f.title.length > 200 ? 'Max 200 characters' : '';
  const aliasErr = !alias || !aliasChanged && !!link.customAlias && ALIAS_RE.test(alias) ? '' : alias.length < 6 ? 'Min 6 characters' : !ALIAS_RE.test(alias) ? 'Letters, numbers, underscores, dashes only' : RESERVED.has(alias) ? 'This alias is reserved' : aliasTaken ? 'This alias is already taken' : '';
  const needsNewPw = f.passwordProtected && !link.password && !link.passwordProtected;
  const pwErr = f.passwordProtected && (needsNewPw || f.password) && f.password.length < 3 ? 'Min 3 characters' : '';
  const expNum = Math.floor(Number(f.expValue));
  const expErr = f.expMode !== 'never' && !(expNum >= 1) ? 'Enter a whole number of 1 or more' : '';
  const valid = !titleErr && !aliasErr && !pwErr && !expErr;

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    try {
      // Alias uniqueness: own workspace links first, then Firestore when it can answer.
      if (alias && aliasChanged) {
        const mine = links.some((l) => l.id !== link.id && (l.customAlias?.toLowerCase() === alias || l.shortCode.toLowerCase() === alias));
        const remote = mine ? true : await linksApi.aliasExists(alias);
        if (remote) { setAliasTaken(true); toast.error('That custom ending is already taken'); setBusy(false); return; }
      }

      // Only editable fields are sent (the Angular dialog PUT the whole document back, incl. counters and hashes).
      const updates: Record<string, unknown> = {
        title: f.title.trim(),
        customAlias: alias,
        description: f.description,
        isActive: f.isActive,
        tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
        campaign: { utmSource: f.utmSource || null, utmMedium: f.utmMedium || null, utmCampaign: f.utmCampaign || null },
        expiration: f.expMode === 'never' ? { mode: 'never' }
          : f.expMode === 'afterClicks' ? { mode: 'oneTime', maxClicks: expNum }
          : { mode: 'duration', durationValue: expNum, durationUnit: f.expMode },
        passwordProtected: f.passwordProtected,
      };
      if (f.passwordProtected && f.password) updates['password'] = f.password; // hashed server-side

      await update(link.shortCode, updates);
      toast.success('Changes saved');
      const { password: _pw, ...local } = updates;
      onSaved?.(local);
      onClose();
    } catch (e: any) {
      console.error('Update failed', e);
      toast.error(e?.message || 'Failed to update link.');
    } finally {
      setBusy(false);
    }
  };

  const showTitleErr = touched && !!titleErr;
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="le-heading" onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 id="le-heading" className="text-lg font-semibold text-slate-900">Edit link</h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate">/{link.shortCode} · {((link.clickCount as number) || 0).toLocaleString('en-US')} clicks</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={save} noValidate className="p-6 space-y-6">
            <Section title="Details">
              <div className="space-y-4">
                <div>
                  <label htmlFor="le-title" className={label}>Title</label>
                  <input id="le-title" type="text" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Spring sale landing page" aria-invalid={showTitleErr} className={field} />
                  <div className="flex justify-between gap-3">{showTitleErr ? <p className={err} role="alert">{titleErr}</p> : <span />}<p className={hint + ' ml-auto'}>{f.title.length}/200</p></div>
                </div>
                <div>
                  <span className={label}>Destination</span>
                  <p className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-600 break-all">{link.originalUrl}</p>
                  <p className={hint}>A link&apos;s destination can&apos;t be changed. Create a new link if the address has changed.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="le-alias" className={label}>Custom ending</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">innkie.com/</span>
                      <input id="le-alias" type="text" value={f.customAlias} onChange={(e) => { set('customAlias', e.target.value); setAliasTaken(false); }} placeholder="summer-sale" className={`${field} rounded-l-none min-w-0`} />
                    </div>
                    {(touched || f.customAlias) && aliasErr ? <p className={err} role="alert">{aliasErr}</p> : <p className={hint}>6 to 20 letters, numbers, dashes or underscores.</p>}
                  </div>
                  <div>
                    <label htmlFor="le-tags" className={label}>Tags</label>
                    <input id="le-tags" type="text" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="promo, social" className={field} />
                    <p className={hint}>Separate with commas.</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="le-desc" className={label}>Notes</label>
                  <textarea id="le-desc" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this link for?" className={`${field} resize-y`} />
                </div>
              </div>
            </Section>

            <Section title="Campaign tags (UTM)">
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label htmlFor="le-src" className={label}>Source</label><input id="le-src" type="text" value={f.utmSource} onChange={(e) => set('utmSource', e.target.value)} placeholder="newsletter" className={field} /></div>
                <div><label htmlFor="le-med" className={label}>Medium</label><input id="le-med" type="text" value={f.utmMedium} onChange={(e) => set('utmMedium', e.target.value)} placeholder="email" className={field} /></div>
                <div><label htmlFor="le-cmp" className={label}>Campaign</label><input id="le-cmp" type="text" value={f.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} placeholder="summer_launch" className={field} /></div>
              </div>
              <p className={hint}>These are added to the destination address whenever someone follows the link.</p>
            </Section>

            <Section title="Access">
              <div className="space-y-5">
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600" />
                  <span><span className="font-medium text-slate-900">Link is active</span><span className="block text-slate-500">{f.isActive ? 'Anyone with the link can use it.' : 'Turned off: visitors see an expired-link page.'}</span></span>
                </label>

                <div>
                  <label className="flex items-start gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={f.passwordProtected} onChange={(e) => set('passwordProtected', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600" />
                    <span><span className="font-medium text-slate-900">Ask for a password</span><span className="block text-slate-500">Visitors must enter it before they are sent on.</span></span>
                  </label>
                  {f.passwordProtected && (
                    <div className="mt-3 max-w-sm">
                      <div className="relative">
                        <input type={hide ? 'password' : 'text'} aria-label="New password" autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder={link.passwordProtected ? 'New password (leave empty to keep)' : 'Choose a password'} className={`${field} pr-16`} />
                        <button type="button" aria-pressed={!hide} onClick={() => setHide((h) => !h)} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{hide ? 'Show' : 'Hide'}</button>
                      </div>
                      {touched && pwErr ? <p className={err} role="alert">{pwErr}</p> : link.passwordProtected ? <p className={hint}>The current password is stored securely and can&apos;t be shown.</p> : null}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Stop the link working</p>
                  <div className="inline-flex flex-wrap p-1 rounded-lg bg-slate-100" role="group" aria-label="Expiry">
                    {EXP_MODES.map((m) => <button key={m} type="button" aria-pressed={f.expMode === m} onClick={() => set('expMode', m)} className={`px-3 py-1 rounded-md text-sm transition-colors ${f.expMode === m ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{m === 'never' ? 'Never' : m === 'afterClicks' ? 'After clicks' : m === 'hours' ? 'After hours' : 'After days'}</button>)}
                  </div>
                  {f.expMode !== 'never' && (
                    <div className="mt-3">
                      <label htmlFor="le-exp" className={label}>{f.expMode === 'afterClicks' ? 'Number of clicks' : f.expMode === 'hours' ? 'Number of hours' : 'Number of days'}</label>
                      <input id="le-exp" type="number" min={1} step={1} value={f.expValue} onChange={(e) => set('expValue', e.target.value)} className={`${field} w-32`} />
                      {touched && expErr && <p className={err} role="alert">{expErr}</p>}
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          {onDelete ? <button type="button" onClick={() => onDelete(link.id)} className="px-3 py-2 rounded-md text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors">Delete link</button> : <span />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors">Cancel</button>
            <button type="button" onClick={() => void save()} disabled={busy} className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
              {busy && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
