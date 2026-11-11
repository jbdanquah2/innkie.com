'use client';
import Link from 'next/link';
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

const card = 'bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden';
const head = 'px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3';
const text = 'block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all duration-200';
const lbl = 'block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1';

type Confirm = { title: string; message: string; type: 'danger' | 'warning'; text: string; run: () => Promise<void> };

function MemberRow({ m, me, canManage, busy, onRole, onRemove }: { m: Workspace['members'][number]; me?: string; canManage: boolean; busy: boolean; onRole: (role: WorkspaceRole) => void; onRemove: () => void }) {
  const joined = useTimeAgo(m.joinedAt);
  const manageable = canManage && m.uid !== me && m.role !== 'owner';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-50 rounded-2xl hover:border-purple-100 hover:shadow-sm transition-all gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200">{m.email.charAt(0).toUpperCase()}</div>
        <div><h4 className="font-bold text-slate-900 text-sm tracking-tight">{m.email}</h4><p className="text-[10px] font-medium text-slate-400">Joined {joined}</p></div>
      </div>
      <div className="flex items-center gap-3">
        {manageable ? (
          <select aria-label={`Role for ${m.email}`} value={m.role} onChange={(e) => onRole(e.target.value as WorkspaceRole)} disabled={busy} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none">
            <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
          </select>
        ) : (
          <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">{m.role}</span>
        )}
        {manageable && <button type="button" onClick={onRemove} aria-label={`Remove ${m.email}`} title="Remove Member" className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><i className="fas fa-user-minus text-xs" /></button>}
        {m.uid === me && <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-tighter">You</span>}
      </div>
    </div>
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
    title: 'Delete Workspace', message: `Are you sure you want to delete workspace "${w.name}"? This action is permanent and all associated links and analytics will be lost.`, type: 'danger', text: 'Delete Workspace',
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
    title: 'Remove Team Member', message: `Are you sure you want to remove ${m.email} from this workspace? They will lose access to all workspace resources.`, type: 'danger', text: 'Remove Member',
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 text-slate-900">
      <div className="mb-12">
        <Link href="/dashboard/" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all mb-4 text-sm group"><i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1" /> Dashboard</Link>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your profile, security, and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        <section className={card}>
          <div className={head}><div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center"><i className="fas fa-user-circle text-xl" /></div><h2 className="text-xl font-bold">Account Overview</h2></div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</span><div className="flex flex-col"><span className="font-bold text-slate-700 truncate">{profile?.email || user?.email}</span>{profile?.emailVerified && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1"><i className="fas fa-check-circle" /> Verified</span>}</div></div>
              <div className="space-y-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member Since</span><p className="font-bold text-slate-700">{memberSince}</p></div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Authentication Methods</span>
              <div className="flex flex-wrap gap-3">
                {providers.map((p) => (
                  <div key={p} className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    {p === 'google.com' ? (<>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/google-logo.svg" alt="" className="w-4 h-4" /><span className="text-sm font-bold text-slate-700">Google Account</span></>) : p === 'password' ? (<><i className="fas fa-envelope text-primary-500 text-sm" /><span className="text-sm font-bold text-slate-700">Email &amp; Password</span></>) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={card}>
          <div className={head}><div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><i className="fas fa-id-card text-xl" /></div><h2 className="text-xl font-bold">Profile Settings</h2></div>
          <form onSubmit={saveProfile} noValidate className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="st-user" className={lbl}>Username</label>
              <input id="st-user" type="text" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} placeholder="johndoe1" className={`${text} ${touched && userNameErr ? 'border-rose-300' : ''}`} />
              <p className="ml-1 text-[10px] text-slate-400 font-medium italic">Lowercase letters, numbers, dots, and hyphens only.</p>
              {touched && userNameErr && <div className="ml-1 text-xs font-bold text-rose-500" role="alert">{userNameErr}</div>}
            </div>
            <div className="space-y-2">
              <label htmlFor="st-display" className={lbl}>Display Name</label>
              <input id="st-display" type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your Full Name" className={`${text} ${touched && displayErr ? 'border-rose-300' : ''}`} />
              {touched && displayErr && <div className="ml-1 text-xs font-bold text-rose-500" role="alert">{displayErr}</div>}
            </div>
            <div className="md:col-span-2 flex justify-end pt-4">
              <button type="submit" disabled={!dirty || saving} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl transition-all shadow-md shadow-purple-100 flex items-center gap-2 active:scale-95"><i className="fas fa-check text-sm" /> Save Profile Changes</button>
            </div>
          </form>
        </section>

        <section className={card}>
          <div className={head}><div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center"><i className="fas fa-layer-group text-xl" /></div><h2 className="text-xl font-bold">Workspace Management</h2></div>
          <div className="p-8">
            <div className="mb-10 p-6 bg-primary-50 border border-primary-100 rounded-2xl">
              <h3 className="font-bold text-primary-900 mb-2 text-sm">Create New Workspace</h3>
              <p className="text-xs text-primary-700 font-medium mb-4 leading-relaxed">Workspaces allow you to group links and collaborate with team members under a shared brand identity.</p>
              <div className="flex gap-3">
                <input type="text" aria-label="Workspace name" value={newWs} onChange={(e) => setNewWs(e.target.value)} placeholder="Workspace Name" className="flex-1 px-4 py-2.5 bg-white border border-primary-200 rounded-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-sm font-medium" />
                <button type="button" onClick={createWs} disabled={!newWs.trim() || creating} className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all disabled:bg-slate-300 text-sm shadow-sm active:scale-95">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4 ml-1">Your Link Ecosystems</span>
              {workspaces.map((w) => (
                <div key={w.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:border-primary-100 hover:shadow-sm transition-all group gap-6 ${active?.id === w.id ? 'ring-2 ring-primary-200' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-primary-600 font-black text-xl group-hover:scale-110 transition-transform">{isPersonal(w.id) ? <i className="fas fa-user" /> : w.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">{w.name}</h3>
                        {isPersonal(w.id) && <span className="px-2 py-0.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><i className="fas fa-lock text-[6px]" /> Personal</span>}
                        {profile?.defaultWorkspaceId === w.id && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><i className="fas fa-star text-[6px]" /> Default</span>}
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mt-0.5">{w.members.length} Member(s)</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {profile?.defaultWorkspaceId === w.id ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 cursor-default"><i className="fas fa-check-circle text-xs" /><span className="text-[10px] font-black uppercase tracking-widest">Home Workspace</span></div>
                    ) : (
                      <button type="button" onClick={() => setHome(w.id)} title="This workspace will open automatically every time you log in." className="group flex flex-col items-start px-4 py-2 hover:bg-primary-50 border border-transparent hover:border-primary-100 rounded-xl transition-all"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-600">Set as Home</span><span className="text-[8px] font-medium text-slate-300 group-hover:text-primary-400 -mt-0.5">Open on login</span></button>
                    )}
                    {active?.id === w.id ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest">Currently Managing</span></div>
                    ) : (
                      <button type="button" onClick={() => ws.setActive(w)} title="Switch your dashboard and settings to this workspace." className="group flex flex-col items-start px-4 py-2 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-200 rounded-xl transition-all"><span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary-600">Switch View</span><span className="text-[8px] font-medium text-slate-400 group-hover:text-primary-400 -mt-0.5">Manage data</span></button>
                    )}
                    {w.ownerId === me && !isPersonal(w.id) && <button type="button" onClick={() => askDeleteWs(w)} aria-label={`Delete ${w.name}`} title="Delete Workspace" className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1"><i className="fas fa-trash-alt text-xs" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {active && (
          <section className={card}>
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg"><i className="fas fa-users" /></div><div><h2 className="text-xl font-bold text-slate-800">Team &amp; Members</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage who has access to the {active.name} workspace</p></div></div>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">{active.members.length} Member(s)</span>
            </div>
            <div className="p-8">
              {canManage && (
                <div className="mb-10 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">Invite New Member</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">Add a team member by their email address and assign them a role.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="email" aria-label="Member email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm font-medium" />
                    <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm font-bold"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option></select>
                    <button type="button" onClick={invite} disabled={!email.trim() || inviting} className="px-8 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:bg-slate-300 text-sm shadow-sm active:scale-95 whitespace-nowrap">{inviting ? 'Inviting...' : 'Invite Member'}</button>
                  </div>
                </div>
              )}
              <div className="space-y-3">{active.members.map((m) => <MemberRow key={m.uid} m={m} me={me} canManage={canManage} busy={roleBusy} onRole={(r) => changeRole(m.uid, r)} onRemove={() => askRemove(m)} />)}</div>
            </div>
          </section>
        )}

        {active && (
          <section className={card}>
            <div className={head}><div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-lg"><i className="fas fa-palette" /></div><div><h2 className="text-xl font-bold text-slate-800">Workspace Branding</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom visual identity for {active.name}</p></div></div>
            <form onSubmit={saveBranding} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div><label htmlFor="br-name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Brand Display Name</label><input id="br-name" type="text" value={brand.brandName} onChange={(e) => setBrand({ ...brand, brandName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" /></div>
                  <div>
                    <label htmlFor="br-color" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Primary Brand Color</label>
                    <div className="flex items-center gap-4"><input id="br-color" type="color" value={brand.brandColor} onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })} className="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" /><div className="text-sm font-mono font-bold text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{brand.brandColor}</div></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="br-logo" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Workspace Logo URL</label>
                    <input id="br-logo" type="url" value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-sm" />
                    {!logoOk && <p className="mt-2 text-xs font-bold text-rose-500" role="alert">Logo URL must start with https://</p>}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-4 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Brand Preview</p>
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-3 transition-transform hover:scale-110">
                      {brand.logoUrl && logoOk ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={brand.logoUrl} alt="Brand logo" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />) : <i className="fas fa-building text-slate-200 text-4xl" />}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-50 flex justify-end">
                <button type="submit" disabled={savingBrand || !logoOk} className="px-10 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md shadow-primary-100 transition-all active:scale-95 flex items-center gap-2"><i className={`fas ${savingBrand ? 'fa-circle-notch animate-spin' : 'fa-save'}`} /> Save Brand Style</button>
              </div>
            </form>
          </section>
        )}

        <section className={card}>
          <div className={head}><div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><i className="fas fa-shield-alt text-xl" /></div><h2 className="text-xl font-bold">Security &amp; Password</h2></div>
          <div className="p-8">
            {!pwOpen && hasPassword && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-lock text-xl" /></div><div><h3 className="font-bold text-emerald-900">Your password is set</h3><p className="text-xs text-emerald-700 font-medium">You can log in with both email/password and social accounts.</p></div></div>
                <button type="button" onClick={() => setPwOpen(true)} className="px-6 py-2.5 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-all text-sm shadow-sm active:scale-95">Change Password</button>
              </div>
            )}
            {!pwOpen && !hasPassword && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-primary-50 border border-primary-100 rounded-2xl">
                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-key text-xl" /></div><div><h3 className="font-bold text-primary-900">Set a password</h3><p className="text-xs text-primary-700 font-medium leading-relaxed">Add a password to enable email/password login alongside your social providers.</p></div></div>
                <button type="button" onClick={() => setPwOpen(true)} className="w-full md:w-auto px-8 py-3 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-700 transition-all text-sm shadow-md shadow-primary-100 active:scale-95">Set Password Now</button>
              </div>
            )}
            {pwOpen && (
              <form onSubmit={savePassword} noValidate className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['a', 'b'] as const).map((k) => (
                    <div key={k} className="space-y-2">
                      <label htmlFor={`pw-${k}`} className={lbl}>{k === 'a' ? 'New Password' : 'Confirm Password'}</label>
                      <div className="relative group">
                        <input id={`pw-${k}`} type={showPw[k] ? 'text' : 'password'} autoComplete="new-password" value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} placeholder={k === 'a' ? 'At least 8 characters' : 'Repeat new password'} className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium" />
                        <button type="button" aria-label={showPw[k] ? 'Hide password' : 'Show password'} onClick={() => setShowPw({ ...showPw, [k]: !showPw[k] })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><i className={`fas ${showPw[k] ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {(pw.a || pw.b) && pwErr && <div className="text-xs font-bold text-rose-500 ml-1" role="alert">{pwErr}</div>}
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setPwOpen(false); setPw({ a: '', b: '' }); }} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={!!pwErr || !pw.b || pwBusy} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-md shadow-rose-100 disabled:bg-slate-200 disabled:text-slate-400 active:scale-95">{pwBusy ? 'Saving...' : hasPassword ? 'Update Password' : 'Set Password'}</button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className={card}>
          <div className={head}><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-plug text-xl" /></div><h2 className="text-xl font-bold">Connected Accounts</h2></div>
          <div className="p-8">
            {hasGoogle ? (
              <>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/google-logo.svg" alt="" className="w-6 h-6" /></div>
                    <div><h3 className="font-bold text-slate-900">Google</h3><p className="text-xs font-black uppercase text-emerald-600 tracking-tighter">Connected</p></div>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed italic"><i className="fas fa-info-circle text-primary-500" /><span>Set a password so you can still sign in if you ever lose access to your Google account.</span></div>
              </>
            ) : (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100"><i className="fas fa-link text-slate-200 text-2xl" /></div>
                <p className="text-sm font-bold text-slate-500 mb-6">No connected accounts found.</p>
                <button type="button" onClick={connectGoogle} className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest shadow-sm active:scale-95">Connect Google Account</button>
              </div>
            )}
          </div>
        </section>
      </div>

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
