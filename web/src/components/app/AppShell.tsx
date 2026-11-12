'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { LinkCreateSlideOver } from './LinkCreateSlideOver';
import { useAuth } from '@/lib/auth';
import { LinksProvider } from '@/lib/links-store';
import { SlideOverProvider, useSlideOver } from '@/lib/slide-over';
import { applyTheme, resetTheme } from '@/lib/theme';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace';

interface NavItem { href: string; label: string; icon: string; exact?: boolean }
const NAV: NavItem[] = [
  { href: '/dashboard/', label: 'Overview', icon: 'fa-table-columns', exact: true },
  { href: '/links/', label: 'Links', icon: 'fa-link' },
  { href: '/analytics/', label: 'Analytics', icon: 'fa-chart-simple' },
  { href: '/qr-studio/', label: 'QR codes', icon: 'fa-qrcode' },
  { href: '/developer-api/', label: 'Developers', icon: 'fa-code' },
  { href: '/settings/', label: 'Settings', icon: 'fa-gear' },
];

const linkCls = (on: boolean) => `group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${on ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

/** Closes a popup on an outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', click); document.removeEventListener('keydown', key); };
  }, [open, close]);
  return box;
}

function WorkspaceSwitcher({ onPick }: { onPick: () => void }) {
  const { workspaces, active, ready, setActive } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const close = useMemo(() => () => setOpen(false), []);
  const box = useDismiss(open, close);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? workspaces.filter((w) => w.name.toLowerCase().includes(q)) : workspaces;
  }, [workspaces, search]);
  const isPersonal = (id?: string) => !!id?.startsWith('personal_');

  return (
    <div className="relative" ref={box}>
      <button type="button" aria-label={`Workspace: ${active ? active.name : 'none'}. Switch workspace`} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-sm text-slate-900 transition-colors shadow-xs">
        <span aria-hidden="true" className="w-7 h-7 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">{(active?.name || '?').charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1 text-left"><span className="block text-[11px] leading-none text-slate-500">Workspace</span><span className="block truncate font-medium leading-tight mt-0.5">{active ? active.name : ready ? 'No workspace' : 'Loading…'}</span></span>
        <i className="fas fa-up-down text-[10px] text-slate-400" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
          {workspaces.length >= 5 && (
            <div className="px-2 pb-1 pt-1 border-b border-slate-100">
              <input type="text" aria-label="Filter workspaces" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter" className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded outline-none focus:border-primary-600" />
            </div>
          )}
          <ul role="listbox" aria-label="Workspaces" className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No match</li>}
            {filtered.map((ws) => (
              <li key={ws.id} role="option" aria-selected={ws.id === active?.id}>
                <button type="button" onClick={() => { setActive(ws); setOpen(false); setSearch(''); onPick(); }} className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${ws.id === active?.id ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                  <span className="truncate">{ws.name}{isPersonal(ws.id) && <span className="text-slate-400 font-normal"> (personal)</span>}</span>
                  {ws.id === active?.id && <i className="fas fa-check text-xs text-primary-600" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 mt-1 pt-1">
            <Link href="/settings/" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-primary-700 hover:bg-slate-50">Manage workspaces</Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** The photo when there is one, otherwise initials drawn locally (no third-party avatar service). */
function Avatar({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" />;
  }
  return <span aria-hidden="true" className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">{initials}</span>;
}

function AccountMenu({ name, email, avatar }: { name: string; email?: string | null; avatar: string }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useMemo(() => () => setOpen(false), []);
  const box = useDismiss(open, close);
  return (
    <div className="relative" ref={box}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-50 text-left transition-colors">
        <Avatar name={name} src={avatar} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-900 truncate">{name}</span>
          <span className="block text-xs text-slate-500 truncate">{email}</span>
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
          <Link role="menuitem" href="/settings/" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Account settings</Link>
          <button role="menuitem" type="button" onClick={async () => { await logout(); window.location.assign('/'); }} className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">Log out</button>
        </div>
      )}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const { profile, user } = useAuth();
  const { active } = useWorkspace();
  const { open } = useSlideOver();
  const [mobile, setMobile] = useState(false);

  // Workspace brand colour themes the whole app; public pages always use the default palette.
  useEffect(() => { applyTheme(active?.branding?.brandColor); }, [active?.branding?.brandColor]);
  useEffect(() => () => resetTheme(), []);
  useEffect(() => setMobile(false), [pathname]);

  const isActive = (i: NavItem) => (i.exact ? pathname === i.href || pathname === i.href.slice(0, -1) : pathname.startsWith(i.href.slice(0, -1)));
  const name = profile?.displayName || user?.displayName || 'User';
  const avatar = profile?.photoURL || user?.photoURL || '';

  const canCreate = active?.role !== 'viewer';

  return (
    <div data-app className="flex flex-col lg:flex-row h-screen bg-white antialiased text-slate-900 overflow-hidden relative">
      <div className="lg:hidden w-full bg-white border-b border-slate-200 z-30 px-4 h-14 flex shrink-0 items-center justify-between">
        <Logo size="28px" showText />
        <button type="button" aria-label="Open menu" aria-expanded={mobile} onClick={() => setMobile(true)} className="w-9 h-9 flex items-center justify-center text-slate-600 rounded-md border border-slate-300 hover:border-slate-500"><i className="fas fa-bars" aria-hidden="true" /></button>
      </div>
      {mobile && <div onClick={() => setMobile(false)} className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden" />}

      <aside aria-label="Sidebar" className={`flex w-64 flex-col bg-white border-r border-slate-200 z-50 fixed inset-y-0 left-0 transform transition-transform duration-200 lg:static lg:translate-x-0 overflow-y-auto ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <Logo size="32px" showText />
            <button type="button" aria-label="Close menu" onClick={() => setMobile(false)} className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button>
          </div>
          <div className="mt-5"><WorkspaceSwitcher onPick={() => setMobile(false)} /></div>
          {canCreate && (
            <button type="button" onClick={() => { open(); setMobile(false); }} className="mt-3 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-on-primary py-2 rounded-md text-sm font-semibold transition-colors shadow-xs">
              <i className="fas fa-plus text-xs" aria-hidden="true" /> New link
            </button>
          )}
        </div>

        <nav className="px-3 space-y-0.5" aria-label="App navigation">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item) ? 'page' : undefined} className={linkCls(isActive(item))}>
              <i className={`fas ${item.icon} w-4 text-center ${isActive(item) ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-3 mt-6 pt-4 border-t border-slate-200">
          <p className="px-3 mb-1 text-[11px] font-medium text-slate-500">Free tools</p>
          <Link href="/tools/" className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
            <span className="flex items-center gap-3"><i className="fas fa-toolbox w-4 text-center text-slate-400" aria-hidden="true" />Browse tools</span><i className="fas fa-arrow-up-right-from-square text-[10px] text-slate-400" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-auto p-3 border-t border-slate-200 shrink-0">
          <AccountMenu name={name} email={profile?.email || user?.email} avatar={avatar} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</div>
      </main>
      <LinkCreateSlideOver />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50" role="status"><div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" /></div>}>
      <WorkspaceProvider>
        <LinksProvider>
          <SlideOverProvider>
            <Shell>{children}</Shell>
          </SlideOverProvider>
        </LinksProvider>
      </WorkspaceProvider>
    </RequireAuth>
  );
}
