'use client';
import { useEffect, useState } from 'react';
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

const card = 'rounded-lg border border-slate-200 bg-white';
const text = 'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const lbl = 'block text-sm font-medium text-slate-700 mb-1.5';
const hint = 'mt-1.5 text-xs text-slate-500';
const errCls = 'mt-1.5 text-sm text-rose-700';
const btn = 'px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50';
const primary = 'px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors';

type Confirm = { title: string; message: string; type: 'danger' | 'warning'; text: string; run: () => Promise<void> };

function Section({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section className={card} aria-label={title}>
      <div className="px-5 pt-5 pb-3"><h2 className="font-semibold text-slate-900">{title}</h2>{blurb && <p className="text-sm text-slate-500 mt-0.5">{blurb}</p>}</div>
      <div className="px-5 pb-5 pt-4 border-t border-slate-200">{children}</div>
    </section>
  );
}

function MemberRow({ m, me, canManage, busy, onRole, onRemove }: { m: Workspace['members'][number]; me?: string; canManage: boolean; busy: boolean; onRole: (role: WorkspaceRole) => void; onRemove: () => void }) {
  const joined = useTimeAgo(m.joinedAt);
  const manageable = canManage && m.uid !== me && m.role !== 'owner';
  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{m.email}{m.uid === me && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p>
        <p className="text-xs text-slate-500">Joined {joined}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {manageable ? (
          <select aria-label={`Role for ${m.email}`} value={m.role} onChange={(e) => onRole(e.target.value as WorkspaceRole)} disabled={busy} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-primary-600">
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
  const userNameErr = !form.userName ? 'Required' : !USERNAME_RE.test(form.userName) ? 'Invalid format (3-30 chars: a-z, 0-9, dot, hyphen)' : '';
  const displayErr = !form.displayName.trim() ? 'Required' : '';

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (userNameErr || displayErr) return;
    setSaving(true);
    try { await patchProfile({ userName: form.userName, displayName: form.displayName.trim() }); toast.success('Profile updated successfully!'); }
    catch { toast.error('Profile update failed. Try again later.'); }
    finally { setSaving(false); }
  };

  // Workspaces
  const [newWs, setNewWs] = useState('');
  const [creating, setCreating] = useState(false);
  const createWs = async () => {
    if (!newWs.trim()) return;
    setCreating(true);
    try { await ws.create(newWs.trim()); setNewWs(''); toast.success('Your new workspace is ready to use.'); }
    catch { toast.error('Failed to create workspace.'); }
    finally { setCreating(false); }
  };
  const askDeleteWs = (w: Workspace) => setConfirm({
    title: `Delete "${w.name}"?`, message: 'This is permanent. Its links stop working and their analytics can no longer be seen.', type: 'danger', text: 'Delete workspace',
    run: async () => { try { await ws.remove(w.id); toast.success('Workspace deleted successfully!'); } catch { toast.error('Failed to delete workspace.'); } },
  });
  const setHome = async (id: string) => { try { await ws.setDefault(id); toast.success('Home workspace updated!'); } catch { toast.error('Failed to update default workspace.'); } };

  // Members
  const me = user?.uid;
  const myRole = active?.members.find((m) => m.uid === me)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const invite = async () => {
    if (!active || !EMAIL_RE.test(email.trim())) return toast.warn('Enter a valid email address.');
    setInviting(true);
    try { await ws.addMember(active.id, email.trim(), role); setEmail(''); toast.success('Member added successfully!'); }
    catch (e: any) { toast.info(e?.message || 'Failed to add member.'); }
    finally { setInviting(false); }
  };
  const changeRole = async (uid: string, r: WorkspaceRole) => {
    if (!active) return;
    setRoleBusy(true);
    try { await ws.updateMemberRole(active.id, uid, r); toast.success('Member role updated!'); } catch (e: any) { toast.error(e?.message || 'Failed to update member role.'); } finally { setRoleBusy(false); }
  };
  const askRemove = (m: Workspace['members'][number]) => active && setConfirm({
    title: `Remove ${m.email}?`, message: 'They will lose access to this workspace and its links.', type: 'danger', text: 'Remove member',
    run: async () => { try { await ws.removeMember(active.id, m.uid); toast.success('Member removed successfully!'); } catch (e: any) { toast.error(e?.message || 'Failed to remove member.'); } },
  });

  // Branding
  const [brand, setBrand] = useState({ brandName: '', brandColor: '#6366f1', logoUrl: '' });
  const [savingBrand, setSavingBrand] = useState(false);
  useEffect(() => {
    const b = active?.branding;
    setBrand({ brandName: b?.brandName || active?.name || 'iNNkie', brandColor: b?.brandColor || '#6366f1', logoUrl: b?.logoUrl || '' });
  }, [active?.id, active?.branding?.brandName, active?.branding?.brandColor, active?.branding?.logoUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  const logoOk = !brand.logoUrl || /^https:\/\//i.test(brand.logoUrl);
  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !logoOk || !HEX_RE.test(brand.brandColor)) return;
    setSavingBrand(true);
    try { await ws.update(active.id, { branding: { ...active.branding, ...brand } }); applyTheme(brand.brandColor); toast.success('Branding updated successfully!'); }
    catch { toast.error('Failed to update branding.'); }
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
  const pwErr = pw.a.length < 8 ? 'Password must be at least 8 characters.' : pw.a !== pw.b && pw.b ? 'Passwords do not match.' : '';
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = getFirebaseAuth().currentUser;
    if (!u?.email || pwErr || !pw.b) return;
    setPwBusy(true);
    try {
      if (hasPassword) await updatePassword(u, pw.a);
      else { await linkWithCredential(u, EmailAuthProvider.credential(u.email, pw.a)); await patchProfile({ providerIds: Array.from(new Set([...providers, 'password'])) as any }); }
      toast.success(hasPassword ? 'Password updated successfully!' : 'Password added successfully!');
      setPwOpen(false); setPw({ a: '', b: '' });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.code === 'auth/requires-recent-login' ? 'For security, please sign out and sign back in, then try again.' : err?.code === 'auth/weak-password' ? 'Password is too weak.' : err?.code === 'auth/provider-already-linked' ? 'A password is already set on this account.' : 'Failed to update password.');
    } finally { setPwBusy(false); }
  };
  const connectGoogle = async () => {
    const u = getFirebaseAuth().currentUser;
    if (!u) return;
    try { await linkWithPopup(u, new GoogleAuthProvider()); await patchProfile({ providerIds: Array.from(new Set([...providers, 'google.com'])) as any }); toast.success('Google account connected.'); }
    catch (err: any) { toast.error(err?.code === 'auth/credential-already-in-use' ? 'That Google account is already used by another iNNkie account.' : err?.code === 'auth/popup-closed-by-user' ? 'Sign-in window was closed.' : 'Failed to connect Google account.'); }
  };

  const isPersonal = (id: string) => id.startsWith('personal_');

  const showName = !!profile?.emailVerified;
  return (
    <div className="max-w-3xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Your account, your workspaces and who can use them.</p>
      </div>

      <Section title="Account">
        <dl className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="min-w-0"><dt className="text-slate-500">Email</dt><dd className="mt-0.5 font-medium text-slate-900 truncate">{profile?.email || user?.email}{showName && <span className="ml-2 text-xs font-normal text-emerald-700">verified</span>}</dd></div>
          <div><dt className="text-slate-500">Member since</dt><dd className="mt-0.5 font-medium text-slate-900">{memberSince || '—'}</dd></div>
          <div><dt className="text-slate-500">Sign-in methods</dt><dd className="mt-0.5 font-medium text-slate-900">{providers.map((p) => (p === 'google.com' ? 'Google' : p === 'password' ? 'Email and password' : null)).filter(Boolean).join(', ') || '—'}</dd></div>
        </dl>
      </Section>

      <Section title="Profile">
        <form onSubmit={saveProfile} noValidate className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="st-user" className={lbl}>Username</label>
            <input id="st-user" type="text" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} placeholder="johndoe1" aria-invalid={touched && !!userNameErr} className={text} />
            {touched && userNameErr ? <p className={errCls} role="alert">{userNameErr}</p> : <p className={hint}>Lowercase letters, numbers, dots and hyphens, 3 to 30 characters.</p>}
          </div>
          <div>
            <label htmlFor="st-display" className={lbl}>Display name</label>
            <input id="st-display" type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your name" aria-invalid={touched && !!displayErr} className={text} />
            {touched && displayErr && <p className={errCls} role="alert">{displayErr}</p>}
          </div>
          <div className="sm:col-span-2 flex justify-end"><button type="submit" disabled={!dirty || saving} className={primary}>{saving ? 'Saving…' : 'Save profile'}</button></div>
        </form>
      </Section>

      <Section title="Workspaces" blurb="Workspaces group links and let you share them with a team.">
        <div className="flex gap-2 mb-5">
          <input type="text" aria-label="New workspace name" value={newWs} onChange={(e) => setNewWs(e.target.value)} placeholder="New workspace name" className={text} />
          <button type="button" onClick={createWs} disabled={!newWs.trim() || creating} className={`${primary} shrink-0`}>{creating ? 'Creating…' : 'Create'}</button>
        </div>
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {workspaces.map((w) => (
            <li key={w.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{w.name}
                  {isPersonal(w.id) && <span className="ml-2 text-xs font-normal text-slate-500">personal</span>}
                  {active?.id === w.id && <span className="ml-2 text-xs font-normal text-primary-700">in use</span>}
                  {profile?.defaultWorkspaceId === w.id && <span className="ml-2 text-xs font-normal text-emerald-700">opens on login</span>}
                </p>
                <p className="text-xs text-slate-500">{w.members.length} {w.members.length === 1 ? 'member' : 'members'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {active?.id !== w.id && <button type="button" onClick={() => ws.setActive(w)} className={btn}>Switch to this</button>}
                {profile?.defaultWorkspaceId !== w.id && <button type="button" onClick={() => setHome(w.id)} className={btn} title="This workspace opens automatically when you log in.">Open on login</button>}
                {w.ownerId === me && !isPersonal(w.id) && <button type="button" onClick={() => askDeleteWs(w)} className={`${btn} text-rose-700 hover:border-rose-400`}>Delete</button>}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {active && (
        <Section title={`Members of ${active.name}`} blurb={canManage ? 'Add people by email and choose what they can do.' : 'Only the owner and admins can change who has access.'}>
          {canManage && (
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input type="email" aria-label="Member email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className={text} />
              <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-600"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select>
              <button type="button" onClick={invite} disabled={!email.trim() || inviting} className={`${primary} shrink-0`}>{inviting ? 'Adding…' : 'Add member'}</button>
            </div>
          )}
          <ul className="divide-y divide-slate-200 border-y border-slate-200">{active.members.map((m) => <MemberRow key={m.uid} m={m} me={me} canManage={canManage} busy={roleBusy} onRole={(r) => changeRole(m.uid, r)} onRemove={() => askRemove(m)} />)}</ul>
          <p className={hint}>Viewers can look but not change anything. Editors can create and edit links. Admins can also manage members, the API key and branding.</p>
        </Section>
      )}

      {active && canManage && (
        <Section title="Branding" blurb={`Colour and logo for ${active.name}. The colour changes the accent colour across this workspace.`}>
          <form onSubmit={saveBranding} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label htmlFor="br-name" className={lbl}>Brand name</label><input id="br-name" type="text" value={brand.brandName} onChange={(e) => setBrand({ ...brand, brandName: e.target.value })} className={text} /></div>
              <div>
                <label htmlFor="br-color" className={lbl}>Accent colour</label>
                <div className="flex items-center gap-3"><input id="br-color" type="color" value={brand.brandColor} onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })} className="h-10 w-14 rounded-md border border-slate-300 bg-white p-1 cursor-pointer" /><span className="font-mono text-sm text-slate-600 uppercase">{brand.brandColor}</span></div>
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
            <div className="flex justify-end"><button type="submit" disabled={savingBrand || !logoOk} className={primary}>{savingBrand ? 'Saving…' : 'Save branding'}</button></div>
          </form>
        </Section>
      )}

      <Section title="Password">
        {!pwOpen ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-600">{hasPassword ? 'You can sign in with your email and password.' : 'You sign in with a connected account. Add a password so you can also sign in with your email.'}</p>
            <button type="button" onClick={() => setPwOpen(true)} className={`${btn} shrink-0`}>{hasPassword ? 'Change password' : 'Add a password'}</button>
          </div>
        ) : (
          <form onSubmit={savePassword} noValidate className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {(['a', 'b'] as const).map((k) => (
                <div key={k}>
                  <label htmlFor={`pw-${k}`} className={lbl}>{k === 'a' ? 'New password' : 'Confirm password'}</label>
                  <div className="relative">
                    <input id={`pw-${k}`} type={showPw[k] ? 'text' : 'password'} autoComplete="new-password" value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} placeholder={k === 'a' ? 'At least 8 characters' : 'Repeat the password'} className={`${text} pr-16`} />
                    <button type="button" aria-pressed={showPw[k]} onClick={() => setShowPw({ ...showPw, [k]: !showPw[k] })} className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-slate-600 hover:text-slate-900">{showPw[k] ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
              ))}
            </div>
            {(pw.a || pw.b) && pwErr && <p className={errCls} role="alert">{pwErr}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setPwOpen(false); setPw({ a: '', b: '' }); }} className={btn}>Cancel</button>
              <button type="submit" disabled={!!pwErr || !pw.b || pwBusy} className={primary}>{pwBusy ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}</button>
            </div>
          </form>
        )}
      </Section>

      <Section title="Connected accounts">
        {hasGoogle ? (
          <div>
            <p className="flex items-center gap-2 text-sm text-slate-900">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/google-logo.svg" alt="" className="w-4 h-4" />Google is connected.</p>
            {!hasPassword && <p className={hint}>Add a password above so you can still sign in if you lose access to your Google account.</p>}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Connect Google to sign in with one click.</p>
            <button type="button" onClick={connectGoogle} className={`${btn} shrink-0`}>Connect Google</button>
          </div>
        )}
      </Section>

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
