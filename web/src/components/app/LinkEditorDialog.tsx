'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ShortUrl } from '@innkie/shared-models';
import { linksApi } from '@/lib/api/links';
import { legacyHashPassword } from '@/lib/links';
import { useLinks } from '@/lib/links-store';
import { useToast } from '@/lib/toast';
import { APP_PATHS } from '@/lib/utils/urls';

type ExpMode = 'never' | 'afterClicks' | 'hours' | 'days';
const EXP_MODES: ExpMode[] = ['never', 'afterClicks', 'hours', 'days'];
const ALIAS_RE = /^[a-zA-Z0-9_-]{6,20}$/;
const RESERVED = new Set(APP_PATHS.map((p) => p.toLowerCase()));

const field = 'w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium text-sm shadow-sm outline-none';
const label = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';
const err = 'text-[10px] font-bold text-rose-500 uppercase tracking-widest';
const Section = ({ n, title }: { n: string; title: string }) => (
  <div className="flex items-center gap-2 mb-6"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{n}. {title}</span><div className="flex-1 h-px bg-slate-100" /></div>
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
        if (remote) { setAliasTaken(true); toast.error('Custom alias already exists'); setBusy(false); return; }
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
      if (f.passwordProtected && f.password) Object.assign(updates, await legacyHashPassword(f.password, link.shortCode));

      await update(link.shortCode, updates);
      toast.success('Link updated successfully!');
      onSaved?.(updates);
      onClose();
    } catch (e: any) {
      console.error('Update failed', e);
      toast.error(e?.message || 'Failed to update link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Edit link" onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm"><i className="fas fa-pen text-xl" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Edit Link</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{link.shortCode}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{(link.clickCount as number) || 0} clicks</span>
              </div>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><i className="fas fa-times text-xl" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={save} noValidate className="p-8 space-y-10 pb-12">
            <section>
              <Section n="01" title="Core Configuration" />
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="le-title" className={label}>Link Title</label>
                  <input id="le-title" type="text" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="My Campaign Landing Page" className={field} />
                  <div className="flex justify-between items-center px-1">{touched && titleErr ? <p className={err} role="alert">{titleErr}</p> : <span />}<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">{f.title.length}/200</p></div>
                </div>
                <div className="space-y-1.5 opacity-60">
                  <span className={label}>Original URL (Read-only)</span>
                  <div className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-slate-500 font-medium text-sm truncate flex items-center gap-2"><i className="fas fa-lock text-xs" /> {link.originalUrl}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="le-alias" className={label}>Custom Alias</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 font-bold text-sm">innkie.com/</span>
                      <input id="le-alias" type="text" value={f.customAlias} onChange={(e) => { set('customAlias', e.target.value); setAliasTaken(false); }} placeholder="vanity-url" className={`${field} pl-[92px]`} />
                    </div>
                    <div className="px-1">{(touched || f.customAlias) && aliasErr ? <p className={err} role="alert">{aliasErr}</p> : <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Optional vanity path</p>}</div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="le-tags" className={label}>Tags</label>
                    <input id="le-tags" type="text" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g. promo, social, 2024" className={field} />
                    <p className="text-[10px] font-medium text-slate-400 px-1 uppercase tracking-widest mt-1">Comma separated</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <Section n="02" title="Campaign Tracking (UTM)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 space-y-1.5"><label htmlFor="le-cmp" className={label}>Campaign Name</label><input id="le-cmp" type="text" value={f.utmCampaign} onChange={(e) => set('utmCampaign', e.target.value)} placeholder="e.g. summer_sale_2024" className={field} /></div>
                <div className="space-y-1.5"><label htmlFor="le-src" className={label}>Source</label><input id="le-src" type="text" value={f.utmSource} onChange={(e) => set('utmSource', e.target.value)} placeholder="e.g. twitter, email" className={field} /></div>
                <div className="space-y-1.5"><label htmlFor="le-med" className={label}>Medium</label><input id="le-med" type="text" value={f.utmMedium} onChange={(e) => set('utmMedium', e.target.value)} placeholder="social, ads" className={field} /></div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3"><i className="fas fa-magic text-slate-400 text-lg" /><p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest">iNNkie will automatically append these parameters to your destination URL during redirection for advanced tracking.</p></div>
            </section>

            <section>
              <Section n="03" title="Security & Expiration" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 text-left">
                  <span className={label}>Link Expiration</span>
                  <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {EXP_MODES.map((m) => <button key={m} type="button" aria-pressed={f.expMode === m} onClick={() => set('expMode', m)} className={`flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all capitalize ${f.expMode === m ? 'bg-white shadow-md text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}>{m === 'afterClicks' ? 'Clicks' : m}</button>)}
                  </div>
                  {f.expMode !== 'never' && (
                    <div className="space-y-1.5">
                      <label htmlFor="le-exp" className={label}>Value</label>
                      <input id="le-exp" type="number" min={1} step={1} value={f.expValue} onChange={(e) => set('expValue', e.target.value)} className={field} />
                      {touched && expErr && <p className={err} role="alert">{expErr}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-left">
                  <span className={label}>Password Protection</span>
                  <div className="flex items-center gap-6 px-1">
                    {([false, true] as const).map((v) => (
                      <label key={String(v)} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="le-pw" checked={f.passwordProtected === v} onChange={() => set('passwordProtected', v)} className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500" />
                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-widest transition-colors">{v ? 'Protected' : 'None'}</span>
                      </label>
                    ))}
                  </div>
                  {f.passwordProtected && (
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600"><i className="fas fa-lock" /></span>
                        <input type={hide ? 'password' : 'text'} aria-label="New password" autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder={link.passwordProtected ? 'Set new password (optional)' : 'Set password'} className={`${field} pl-11 pr-12`} />
                        <button type="button" aria-label={hide ? 'Show password' : 'Hide password'} onClick={() => setHide((h) => !h)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"><i className={`fas ${hide ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
                      </div>
                      <div className="flex justify-between items-center px-1">{touched && pwErr ? <p className={err} role="alert">{pwErr}</p> : <span />}<p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter ml-auto leading-tight text-right">Existing passwords remain encrypted and hidden.</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <Section n="04" title="Additional Controls" />
              <div className="space-y-6">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="le-desc" className={label}>Internal Description</label>
                  <textarea id="le-desc" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe this link for your team..." className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-all text-slate-900 font-medium text-sm shadow-sm resize-none outline-none" />
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600"><i className="fas fa-eye" /></div>
                    <div><p className="text-sm font-black text-slate-900 leading-none mb-1">Status</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{f.isActive ? 'Link is public & active' : 'Link is disabled'}</p></div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" aria-label="Link active" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner" />
                  </label>
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          {onDelete ? <button type="button" onClick={() => onDelete(link.id)} className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest active:scale-95"><i className="far fa-trash-alt" /> Delete Link</button> : <span />}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-6 py-3.5 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all active:scale-95">Cancel</button>
            <button type="button" onClick={() => void save()} disabled={busy || (touched && !valid)} className="flex-1 sm:flex-none px-10 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <i className={`fas ${busy ? 'fa-circle-notch animate-spin' : 'fa-check-circle'}`} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
