'use client';
import { useEffect, useMemo, useState } from 'react';
import { EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup, updatePassword } from 'firebase/auth';
import type { Workspace, WorkspaceRole } from '@innkie/shared-models';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/lib/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useTimeAgo } from '@/lib/time';
import { useToast } from '@/lib/toast';
import { applyTheme } from '@/lib/theme';
import { useWorkspace } from '@/lib/workspace';

const USERNAME_RE = /^[a-z0-9.-]{3,30}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_COLOR = '#1d2127'; // same as the app's built-in accent (lib/theme.ts)

const card = 'rounded-lg border border-slate-200 bg-white shadow-xs';
const text = 'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const select = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const lbl = 'block text-sm font-medium text-slate-700 mb-1.5';
const hint = 'mt-1.5 text-xs text-slate-500';
const errCls = 'mt-1.5 text-sm text-rose-700';
const btn = 'px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50';
const primary = 'px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-on-primary text-sm font-semibold transition-colors';

const ROLE_HELP: Record<string, string> = {
  viewer: 'Can see links and analytics, but cannot change anything.',
  editor: 'Can also create, edit and delete links.',
  admin: 'Can also manage members, the API key and branding.',
};

type Confirm = { title: string; message: string; type: 'danger' | 'warning'; text: string; run: () => Promise<void> };
type TabId = 'profile' | 'security' | 'workspaces' | 'members' | 'branding';

function Panel({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div><h2 className="text-lg font-semibold text-slate-900">{title}</h2>{blurb && <p className="text-sm text-slate-600 mt-1">{blurb}</p>}</div>
      {children}
    </div>
  );
}

/** A label on the left, the current state under it, and one action on the right. */
function Row({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-medium text-slate-900">{title}</p>{children && <div className="text-sm text-slate-600 mt-0.5">{children}</div>}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function WorkspacePicker({ id }: { id: string }) {
  const { workspaces, active, setActive } = useWorkspace();
  if (workspaces.length < 2) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="text-slate-600">Workspace</label>
      <select id={id} value={active?.id ?? ''} onChange={(e) => { const w = workspaces.find((x) => x.id === e.target.value); if (w) setActive(w); }} className={select}>
        {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
    </div>
  );
}

function MemberRow({ m, me, canManage, busy, onRole, onRemove }: { m: Workspace['members'][number]; me?: string; canManage: boolean; busy: boolean; onRole: (role: WorkspaceRole) => void; onRemove: () => void }) {
  const joined = useTimeAgo(m.joinedAt);
  const manageable = canManage && m.uid !== me && m.role !== 'owner';
  return (
    <li className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{m.email}{m.uid === me && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p>
        <p className="text-xs text-slate-500">Joined {joined}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {manageable ? (
          <select aria-label={`Role for ${m.email}`} value={m.role} onChange={(e) => onRole(e.target.value as WorkspaceRole)} disabled={busy} className={`${select} py-1.5`}>
            <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
          </select>
        ) : (
          <span className="text-sm text-slate-600 capitalize">{m.role}</span>
        )}
        {manageable && <button type="button" onClick={onRemove} className="text-sm font-medium text-rose-700 hover:underline">Remove</button>}
      </div>
    </li>
  );
}

export function SettingsPage() {
  const toast = useToast();
  const { user, profile, profileReady, patchProfile } = useAuth();
  const ws = useWorkspace();
  const { workspaces, active } = ws;
  const memberSince = useTimeAgo(profile?.createdAt);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  // Profile
  const [form, setForm] = useState({ userName: '', displayName: '' });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  // Re-sync once the Firestore profile has loaded (the first profile is only a quick one built from the auth user).
  useEffect(() => { if (profile && profileReady) setForm({ userName: profile.userName || '', displayName: profile.displayName || '' }); }, [profile?.uid, profileReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !!profile && (form.userName !== (profile.userName || '') || form.displayName !== (profile.displayName || ''));
  const userNameErr = !form.userName ? 'Enter a username' : !USERNAME_RE.test(form.userName) ? 'Use 3 to 30 lowercase letters, numbers, dots or hyphens.' : '';
  const displayErr = !form.displayName.trim() ? 'Enter your name' : '';

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (userNameErr || displayErr) return;
    setSaving(true);
    try { await patchProfile({ userName: form.userName, displayName: form.displayName.trim() }); setTouched(false); toast.success('Profile saved'); }
    catch { toast.error('Could not save your profile. Try again.'); }
    finally { setSaving(false); }
  };

  // Workspaces
  const [newWs, setNewWs] = useState('');
  const [creating, setCreating] = useState(false);
  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWs.trim()) return;
    setCreating(true);
    try { await ws.create(newWs.trim()); setNewWs(''); toast.success('Workspace created and selected'); }
    catch { toast.error('Could not create the workspace.'); }
    finally { setCreating(false); }
  };
  const askDeleteWs = (w: Workspace) => setConfirm({
    title: `Delete "${w.name}"?`, message: 'This is permanent. Its links stop working and their analytics can no longer be seen.', type: 'danger', text: 'Delete workspace',
    run: async () => { try { await ws.remove(w.id); toast.success('Workspace deleted'); } catch { toast.error('Could not delete the workspace.'); } },
  });
  const setHome = async (id: string) => { try { await ws.setDefault(id); toast.success('That workspace will open when you sign in'); } catch { toast.error('Could not change the default workspace.'); } };

  // Members
  const me = user?.uid;
  const myRole = active?.members.find((m) => m.uid === me)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const emailOk = EMAIL_RE.test(email.trim());
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    if (!emailOk) return void toast.warn('Enter a valid email address.');
    if (active.members.some((m) => m.email?.toLowerCase() === email.trim().toLowerCase())) return void toast.info('That person is already a member.');
    setInviting(true);
    try { await ws.addMember(active.id, email.trim(), role); setEmail(''); toast.success('Member added'); }
    catch (err: any) { toast.error(err?.message || 'Could not add that member.'); }
    finally { setInviting(false); }
  };
  const changeRole = async (uid: string, r: WorkspaceRole) => {
    if (!active) return;
    setRoleBusy(true);
    try { await ws.updateMemberRole(active.id, uid, r); toast.success('Role updated'); } catch (e: any) { toast.error(e?.message || 'Could not change the role.'); } finally { setRoleBusy(false); }
  };
  const askRemove = (m: Workspace['members'][number]) => active && setConfirm({
    title: `Remove ${m.email}?`, message: 'They will lose access to this workspace and its links.', type: 'danger', text: 'Remove member',
    run: async () => { try { await ws.removeMember(active.id, m.uid); toast.success('Member removed'); } catch (e: any) { toast.error(e?.message || 'Could not remove the member.'); } },
  });

  // Branding
  const saved = useMemo(() => {
    const b = active?.branding;
    return { brandName: b?.brandName || active?.name || 'iNNkie', brandColor: b?.brandColor || DEFAULT_COLOR, logoUrl: b?.logoUrl || '' };
  }, [active?.name, active?.branding?.brandName, active?.branding?.brandColor, active?.branding?.logoUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  const [brand, setBrand] = useState(saved);
  const [savingBrand, setSavingBrand] = useState(false);
  useEffect(() => { setBrand(saved); }, [active?.id, saved]);
  const brandDirty = brand.brandName !== saved.brandName || brand.brandColor.toLowerCase() !== saved.brandColor.toLowerCase() || brand.logoUrl !== saved.logoUrl;
  const logoOk = !brand.logoUrl || /^https:\/\//i.test(brand.logoUrl);
  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !logoOk || !HEX_RE.test(brand.brandColor)) return;
    setSavingBrand(true);
    try { await ws.update(active.id, { branding: { ...active.branding, ...brand } }); applyTheme(brand.brandColor); toast.success('Branding saved'); }
    catch { toast.error('Could not save branding.'); }
    finally { setSavingBrand(false); }
  };

  // Security
  const providers = profile?.providerIds || user?.providerData.map((p) => p.providerId) || [];
  const hasPassword = providers.includes('password');
  const hasGoogle = providers.includes('google.com');
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ a: '', b: '' });
  const [showPw, setShowPw] = useState({ a: false, b: false });
  const [pwBusy, setPwBusy] = useState(false);
  const pwErr = pw.a.length < 8 ? 'Use at least 8 characters.' : pw.a !== pw.b && pw.b ? 'The two passwords do not match.' : '';
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getFirebaseAuth().currentUser;
    if (!u?.email || pwErr || !pw.b) return;
    setPwBusy(true);
    try {
      if (hasPassword) await updatePassword(u, pw.a);
      else { await linkWithCredential(u, EmailAuthProvider.credential(u.email, pw.a)); await patchProfile({ providerIds: Array.from(new Set([...providers, 'password'])) as any }); }
      toast.success(hasPassword ? 'Password changed' : 'Password added');
      setPwOpen(false); setPw({ a: '', b: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.code === 'auth/requires-recent-login' ? 'For security, sign out and sign back in, then try again.' : err?.code === 'auth/weak-password' ? 'That password is too weak.' : err?.code === 'auth/provider-already-linked' ? 'A password is already set on this account.' : 'Could not change the password.');
    } finally { setPwBusy(false); }
  };
  const connectGoogle = async () => {
    const u = getFirebaseAuth().currentUser;
    if (!u) return;
    try { await linkWithPopup(u, new GoogleAuthProvider()); await patchProfile({ providerIds: Array.from(new Set([...providers, 'google.com'])) as any }); toast.success('Google account connected'); }
    catch (err: any) { toast.error(err?.code === 'auth/credential-already-in-use' ? 'That Google account is already used by another iNNkie account.' : err?.code === 'auth/popup-closed-by-user' ? 'The sign-in window was closed.' : 'Could not connect your Google account.'); }
  };

  const isPersonal = (id: string) => id.startsWith('personal_');

  // Tabs (kept in the address as #members etc. so a refresh or a shared link lands in the same place)
  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Sign-in and security' },
    { id: 'workspaces', label: 'Workspaces' },
    { id: 'members', label: 'Members' },
    ...(canManage ? [{ id: 'branding' as TabId, label: 'Branding' }] : []),
  ];
  const [tabState, setTabState] = useState<TabId>('profile');
  useEffect(() => {
    const read = () => { const h = window.location.hash.slice(1) as TabId; if (['profile', 'security', 'workspaces', 'members', 'branding'].includes(h)) setTabState(h); };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const tab: TabId = tabs.some((t) => t.id === tabState) ? tabState : 'profile';
  // On a phone the tab bar scrolls sideways; keep the current tab in view.
  useEffect(() => { document.querySelector('nav[aria-label="Settings sections"] [aria-current="page"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }, [tab]);
  const go = (id: TabId) => { setTabState(id); window.history.replaceState(null, '', `#${id}`); };

  const showVerified = !!profile?.emailVerified;
  return (
    <div className="max-w-5xl pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Your account, your workspaces and who can use them.</p>
      </div>

      <div className="grid md:grid-cols-[13rem_minmax(0,1fr)] gap-x-10 gap-y-6">
        <nav aria-label="Settings sections" className="flex md:flex-col gap-1 overflow-x-auto border-b border-slate-200 md:border-b-0 -mx-4 px-4 md:mx-0 md:px-0 self-start md:sticky md:top-4">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined} className={`shrink-0 text-left px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${tab === t.id ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </nav>

        <div className="min-w-0 max-w-2xl">
          {tab === 'profile' && (
            <Panel title="Profile" blurb="How you appear to the people you share workspaces with.">
              <form onSubmit={saveProfile} noValidate className={`${card} p-5 space-y-4`}>
                <div>
                  <label htmlFor="st-display" className={lbl}>Name</label>
                  <input id="st-display" type="text" autoComplete="name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your name" aria-invalid={touched && !!displayErr} className={text} />
                  {touched && displayErr && <p className={errCls} role="alert">{displayErr}</p>}
                </div>
                <div>
                  <label htmlFor="st-user" className={lbl}>Username</label>
                  <input id="st-user" type="text" autoComplete="username" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value.toLowerCase() })} placeholder="johndoe1" aria-invalid={touched && !!userNameErr} className={text} />
                  {touched && userNameErr ? <p className={errCls} role="alert">{userNameErr}</p> : <p className={hint}>Lowercase letters, numbers, dots and hyphens, 3 to 30 characters.</p>}
                </div>
                <div className="flex items-center justify-end gap-3">
                  {dirty && <button type="button" onClick={() => { setForm({ userName: profile?.userName || '', displayName: profile?.displayName || '' }); setTouched(false); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">Undo changes</button>}
                  <button type="submit" disabled={!dirty || saving} className={primary}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
              <dl className={`${card} divide-y divide-slate-200 text-sm`}>
                <div className="px-5 py-3 flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900 truncate">{profile?.email || user?.email}{showVerified && <span className="ml-2 text-xs font-normal text-emerald-700">verified</span>}</dd></div>
                <div className="px-5 py-3 flex justify-between gap-4"><dt className="text-slate-500">Member since</dt><dd className="font-medium text-slate-900">{memberSince || '—'}</dd></div>
              </dl>
            </Panel>
          )}

          {tab === 'security' && (
            <Panel title="Sign-in and security" blurb="How you get into your account.">
              <div className={`${card} divide-y divide-slate-200`}>
                <Row title="Password" action={!pwOpen && <button type="button" onClick={() => setPwOpen(true)} className={btn}>{hasPassword ? 'Change password' : 'Add a password'}</button>}>
                  {hasPassword ? 'You can sign in with your email and password.' : 'Not set. Add one so you can also sign in with your email address.'}
                </Row>
                {pwOpen && (
                  <form onSubmit={savePassword} noValidate className="px-5 py-4 space-y-4 bg-slate-50/60">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {(['a', 'b'] as const).map((k) => (
                        <div key={k}>
                          <label htmlFor={`pw-${k}`} className={lbl}>{k === 'a' ? 'New password' : 'Confirm password'}</label>
                          <div className="relative">
                            <input id={`pw-${k}`} type={showPw[k] ? 'text' : 'password'} autoComplete="new-password" autoFocus={k === 'a'} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} placeholder={k === 'a' ? 'At least 8 characters' : 'Repeat the password'} aria-invalid={!!pw.b && !!pwErr} className={`${text} pr-16`} />
                            <button type="button" aria-pressed={showPw[k]} onClick={() => setShowPw({ ...showPw, [k]: !showPw[k] })} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{showPw[k] ? 'Hide' : 'Show'}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className={`min-h-5 text-sm ${pw.a && pwErr ? 'text-rose-700' : 'text-slate-500'}`} role={pw.a && pwErr ? 'alert' : undefined}>{pw.a && pwErr ? pwErr : 'Use at least 8 characters.'}</p>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setPwOpen(false); setPw({ a: '', b: '' }); }} className={btn}>Cancel</button>
                      <button type="submit" disabled={!!pwErr || !pw.b || pwBusy} className={primary}>{pwBusy ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}</button>
                    </div>
                  </form>
                )}
                <Row title="Google" action={!hasGoogle && <button type="button" onClick={connectGoogle} className={btn}>Connect Google</button>}>
                  {hasGoogle ? <>Connected. You can sign in with one click.{!hasPassword && <span className="block text-xs text-slate-500 mt-1">Add a password too, so you can still get in if you lose access to your Google account.</span>}</> : 'Not connected. Connect it to sign in with one click.'}
                </Row>
              </div>
            </Panel>
          )}

          {tab === 'workspaces' && (
            <Panel title="Workspaces" blurb="A workspace holds links and lets you share them with a team. The one marked “In use” is what the rest of the app shows.">
              <ul className={`${card} divide-y divide-slate-200`}>
                {workspaces.map((w) => (
                  <li key={w.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{w.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isPersonal(w.id) ? 'Personal' : `${w.members.length} ${w.members.length === 1 ? 'member' : 'members'}`}
                        {active?.id === w.id && <span className="ml-2 font-medium text-primary-700">· In use</span>}
                        {profile?.defaultWorkspaceId === w.id && <span className="ml-2 font-medium text-emerald-700">· Opens when you sign in</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {active?.id !== w.id && <button type="button" onClick={() => ws.setActive(w)} className={btn}>Use this</button>}
                      {profile?.defaultWorkspaceId !== w.id && <button type="button" onClick={() => setHome(w.id)} className={btn}>Open on sign-in</button>}
                      {w.ownerId === me && !isPersonal(w.id) && <button type="button" onClick={() => askDeleteWs(w)} className={`${btn} text-rose-700 hover:border-rose-400`}>Delete</button>}
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={createWs} className={`${card} p-5`}>
                <label htmlFor="st-newws" className={lbl}>Create a workspace</label>
                <div className="flex gap-2">
                  <input id="st-newws" type="text" value={newWs} onChange={(e) => setNewWs(e.target.value)} placeholder="Team or project name" maxLength={60} className={text} />
                  <button type="submit" disabled={!newWs.trim() || creating} className={`${primary} shrink-0`}>{creating ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </Panel>
          )}

          {tab === 'members' && active && (
            <Panel title="Members" blurb={canManage ? `Who can use ${active.name}, and what they can do.` : `Who can use ${active.name}. Only the owner and admins can change this.`}>
              <WorkspacePicker id="members-ws" />
              {canManage && (
                <form onSubmit={invite} className={`${card} p-5`}>
                  <label htmlFor="st-invite" className={lbl}>Add someone</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input id="st-invite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className={text} />
                    <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} className={select}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select>
                    <button type="submit" disabled={!emailOk || inviting} className={`${primary} shrink-0`}>{inviting ? 'Adding…' : 'Add'}</button>
                  </div>
                  <p className={hint}>{ROLE_HELP[role]} They need an iNNkie account already; use the email address they signed up with.</p>
                </form>
              )}
              <ul className={`${card} divide-y divide-slate-200`}>{active.members.map((m) => <MemberRow key={m.uid} m={m} me={me} canManage={canManage} busy={roleBusy} onRole={(r) => changeRole(m.uid, r)} onRemove={() => askRemove(m)} />)}</ul>
            </Panel>
          )}

          {tab === 'branding' && active && canManage && (
            <Panel title="Branding" blurb={`Name, accent colour and logo for ${active.name}. The colour changes the accent colour across the app for everyone in this workspace.`}>
              <WorkspacePicker id="branding-ws" />
              <form onSubmit={saveBranding} className={`${card} p-5 space-y-5`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label htmlFor="br-name" className={lbl}>Brand name</label><input id="br-name" type="text" value={brand.brandName} onChange={(e) => setBrand({ ...brand, brandName: e.target.value })} className={text} /></div>
                  <div>
                    <label htmlFor="br-color" className={lbl}>Accent colour</label>
                    <div className="flex items-center gap-3">
                      <input id="br-color" type="color" value={brand.brandColor} onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })} className="h-10 w-14 rounded-md border border-slate-300 bg-white p-1 cursor-pointer" />
                      <span className="font-mono text-sm text-slate-600 uppercase">{brand.brandColor}</span>
                      {brand.brandColor.toLowerCase() !== DEFAULT_COLOR && <button type="button" onClick={() => setBrand({ ...brand, brandColor: DEFAULT_COLOR })} className="text-sm font-medium text-slate-600 hover:text-slate-900">Use default</button>}
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="br-logo" className={lbl}>Logo address</label>
                  <div className="flex items-center gap-3">
                    <input id="br-logo" type="url" value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" aria-invalid={!logoOk} className={text} />
                    {brand.logoUrl && logoOk && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={brand.logoUrl} alt="Logo preview" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 object-contain rounded border border-slate-200 bg-white p-1" />)}
                  </div>
                  {!logoOk ? <p className={errCls} role="alert">The logo address must start with https://</p> : <p className={hint}>The image is loaded from this address, so the site hosting it can see who views it.</p>}
                </div>
                <div className="flex items-center justify-end gap-3">
                  {brandDirty && <button type="button" onClick={() => setBrand(saved)} className="text-sm font-medium text-slate-600 hover:text-slate-900">Undo changes</button>}
                  <button type="submit" disabled={!brandDirty || savingBrand || !logoOk} className={primary}>{savingBrand ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            </Panel>
          )}
        </div>
      </div>

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
