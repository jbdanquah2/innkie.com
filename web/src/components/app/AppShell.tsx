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
const NAV: { title: string; items: NavItem[] }[] = [
  { title: 'Analytics', items: [
    { href: '/dashboard/', label: 'Command Center', icon: 'fa-th-large', exact: true },
    { href: '/analytics/', label: 'Traffic Hub', icon: 'fa-chart-pie' },
  ] },
  { title: 'Management', items: [
    { href: '/links/', label: 'Links Hub', icon: 'fa-link' },
    { href: '/tools/utm-builder/', label: 'UTM Builder', icon: 'fa-bullhorn' },
    { href: '/qr-studio/', label: 'QR Studio', icon: 'fa-qrcode' },
  ] },
  { title: 'Media Tools', items: [
    { href: '/tools/image-compressor/', label: 'Optimizer', icon: 'fa-compress-arrows-alt' },
    { href: '/tools/image-resizer/', label: 'Resizer & Cropper', icon: 'fa-expand' },
    { href: '/tools/png-to-jpeg/', label: 'PNG to JPEG', icon: 'fa-file-export' },
    { href: '/tools/svg-to-png/', label: 'SVG to PNG', icon: 'fa-image' },
  ] },
  { title: 'Document Tools', items: [
    { href: '/tools/pdf-to-image/', label: 'PDF to Image', icon: 'fa-file-pdf' },
    { href: '/tools/image-to-pdf/', label: 'Image to PDF', icon: 'fa-images' },
  ] },
  { title: 'Developers', items: [
    { href: '/tools/json-formatter/', label: 'JSON Formatter', icon: 'fa-code' },
    { href: '/tools/csv-json-converter/', label: 'CSV <> JSON Converter', icon: 'fa-table' },
    { href: '/tools/base64-encoder/', label: 'Base64 Tool', icon: 'fa-code-branch' },
    { href: '/tools/jwt-decoder/', label: 'JWT Decoder', icon: 'fa-shield-alt' },
    { href: '/developer-api/', label: 'API & Keys', icon: 'fa-terminal' },
  ] },
];

const linkCls = (on: boolean) => `flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all group ${on ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50' : 'text-slate-600 hover:bg-slate-50'}`;

function WorkspaceSwitcher({ onPick }: { onPick: () => void }) {
  const { workspaces, active, ready, setActive } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? workspaces.filter((w) => w.name.toLowerCase().includes(q)) : workspaces;
  }, [workspaces, search]);
  const isPersonal = (id?: string) => !!id?.startsWith('personal_');

  return (
    <div className="mt-6 relative" ref={box}>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Active Workspace</span>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-sm font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-primary-500/20 active:scale-[0.99]">
        <div className="flex items-center gap-2 truncate">
          <i className={`fas text-primary-500 text-xs shrink-0 ${isPersonal(active?.id) ? 'fa-user' : 'fa-building'}`} />
          <span className="truncate">{active ? active.name : ready ? 'No Workspace Selected' : 'Loading...'}</span>
        </div>
        <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
          {workspaces.length >= 3 && (
            <div className="px-3 pb-2 pt-1 border-b border-slate-50">
              <div className="relative">
                <i className="fas fa-search absolute left-2.5 top-2.5 text-[10px] text-slate-400" />
                <input type="text" aria-label="Filter workspaces" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter workspaces..." className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-primary-400 font-medium" />
              </div>
            </div>
          )}
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">My Workspaces</div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && <div className="px-4 py-4 text-center"><p className="text-[10px] font-medium text-slate-400 italic">No matching workspaces</p></div>}
            {filtered.map((ws) => (
              <button key={ws.id} type="button" onClick={() => { setActive(ws); setOpen(false); setSearch(''); onPick(); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-primary-50 hover:text-primary-700 transition-colors text-left ${ws.id === active?.id ? 'bg-primary-50 text-primary-700' : ''}`}>
                <div className="flex items-center gap-2 truncate"><i className={`fas opacity-50 shrink-0 ${isPersonal(ws.id) ? 'fa-user' : 'fa-building'}`} /><span className="font-bold truncate">{ws.name}</span></div>
                {ws.id === active?.id && <i className="fas fa-check text-[10px] text-primary-600 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-50 mt-2 pt-2 px-2">
            <Link href="/settings/" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"><i className="fas fa-plus-circle" /> Manage Workspaces</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const { profile, user, logout } = useAuth();
  const { active } = useWorkspace();
  const { open } = useSlideOver();
  const [mobile, setMobile] = useState(false);

  // Workspace brand colour themes the whole app; public pages always use the default palette.
  useEffect(() => { applyTheme(active?.branding?.brandColor); }, [active?.branding?.brandColor]);
  useEffect(() => () => resetTheme(), []);
  useEffect(() => setMobile(false), [pathname]);

  const isActive = (i: NavItem) => (i.exact ? pathname === i.href || pathname === i.href.slice(0, -1) : pathname.startsWith(i.href.slice(0, -1)));
  const name = profile?.displayName || user?.displayName || 'User';
  const avatar = profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 antialiased text-slate-900 overflow-hidden relative">
      <div className="lg:hidden w-full bg-white border-b border-slate-100 z-30 px-4 h-16 flex shrink-0 items-center justify-between shadow-sm">
        <Logo size="32px" showText />
        <button type="button" aria-label="Open menu" onClick={() => setMobile(true)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl border border-slate-200 active:scale-95 transition-transform"><i className="fas fa-bars" /></button>
      </div>
      {mobile && <div onClick={() => setMobile(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" />}

      <aside className={`flex w-72 flex-col bg-white shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)] z-50 fixed inset-y-0 left-0 transform transition-transform duration-300 lg:static lg:translate-x-0 overflow-y-auto ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="lg:hidden absolute top-4 right-4">
          <button type="button" aria-label="Close menu" onClick={() => setMobile(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-slate-100"><i className="fas fa-times" /></button>
        </div>
        <div className="p-6">
          <div className="hidden lg:block"><Logo size="44px" showText /></div>
          <div className="lg:hidden h-10" />
          <WorkspaceSwitcher onPick={() => setMobile(false)} />
        </div>

        <div className="px-6 mb-4">
          <button type="button" onClick={() => { open(); setMobile(false); }} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary-200 transition-all active:scale-95 group">
            <i className="fas fa-plus-circle transition-transform group-hover:rotate-90" /> Create New Link
          </button>
        </div>

        <nav className="px-4 py-2 space-y-1 pb-6" aria-label="App navigation">
          {NAV.map((sec, i) => (
            <div key={sec.title}>
              <div className={`px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 ${i ? 'mt-4' : ''}`}>{sec.title}</div>
              {sec.items.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item) ? 'page' : undefined} className={linkCls(isActive(item))}>
                  <i className={`fas ${item.icon} w-5 text-center group-hover:text-primary-600 transition-colors`} /> {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-primary-100 transition-all relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{name}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{profile?.email || user?.email}</p>
            </div>
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 overflow-hidden">
              <Link href="/settings/" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all"><i className="fas fa-cog" /> Account Settings</Link>
              <button type="button" onClick={async () => { await logout(); window.location.assign('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"><i className="fas fa-sign-out-alt" /> Logout</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 w-full">
        <div className="max-w-7xl mx-auto">{children}</div>
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
