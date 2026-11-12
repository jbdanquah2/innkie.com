'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '../Logo';
import { useAuth } from '@/lib/auth';
import { TOOL_MENU } from '@/lib/config/nav';

// A client component for the menus' open/close state, but Next still renders the full markup into the static
// HTML: the tool links below are present for crawlers even while the menu is visually closed.

const topLink = (active: boolean) =>
  `px-3 py-2 text-sm rounded-md transition-colors ${active ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 font-medium'}`;

export function Header() {
  const pathname = usePathname() || '/';
  const { user, ready, logout } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToolsOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (toolsRef.current && !toolsRef.current.contains(t)) setToolsOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setToolsOpen(false); setProfileOpen(false); setMobileOpen(false); }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const is = (p: string) => pathname.startsWith(p);
  const avatar = user?.photoURL || '/assets/default-avatar.png';
  const doLogout = async () => {
    setMobileOpen(false);
    await logout();
    window.location.assign('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <nav aria-label="Main" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Logo showText size="32px" className="flex-shrink-0" />
            <div className="hidden md:flex items-center gap-1">
              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  aria-expanded={toolsOpen}
                  aria-controls="tools-menu"
                  onClick={() => setToolsOpen((o) => !o)}
                  className={`flex items-center gap-1.5 ${topLink(toolsOpen || is('/tools'))}`}
                >
                  Tools
                  <i className={`fas fa-chevron-down text-[9px] text-slate-400 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                <div
                  id="tools-menu"
                  className={`${toolsOpen ? 'block' : 'hidden'} absolute top-full -left-24 mt-2 w-[900px] rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-200`}
                >
                  <div className="grid grid-cols-4 gap-6">
                    {TOOL_MENU.map((col) => (
                      <div key={col.title}>
                        <p className="text-sm font-semibold text-slate-900 mb-3">{col.title}</p>
                        <ul className="space-y-1">
                          {col.tools.map((t) => (
                            <li key={t.href}>
                              <Link href={t.href} className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors">
                                <span className="block text-sm font-medium text-slate-800">{t.label}</span>
                                <span className="block text-xs text-slate-500">{t.hint}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-sm">
                    <Link href="/guides" className="text-slate-600 hover:text-slate-900">Read the guides</Link>
                    <Link href="/tools" className="font-semibold text-primary-700 hover:underline">All tools →</Link>
                  </div>
                </div>
              </div>

              <Link href="/features" className={topLink(is('/features'))}>Features</Link>
              <Link href="/guides" className={topLink(is('/guides'))}>Guides</Link>
              <Link href="/docs" className={topLink(is('/docs'))}>API</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auth area renders only once Firebase has reported state. */}
            {ready && (
              <div className="hidden md:flex items-center gap-2">
                {!user ? (
                  <>
                    <Link href="/login/?signUp=false" className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2">Log in</Link>
                    <Link href="/login/?signUp=true" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors">Sign up</Link>
                  </>
                ) : (
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      aria-expanded={profileOpen}
                      aria-label="Account menu"
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-8 w-8 rounded-full border border-slate-200" src={avatar} alt="" referrerPolicy="no-referrer" />
                      <i className="fas fa-chevron-down text-[9px] text-slate-400" aria-hidden="true" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200 overflow-hidden">
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Dashboard</Link>
                        <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Settings</Link>
                        <div className="h-px bg-slate-200 my-1" />
                        <button type="button" onClick={doLogout} className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50">Log out</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              aria-label="Open main menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <i className="fas fa-bars text-lg" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-slate-900/40 z-[60] md:hidden" />}
      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-xl z-[70] transform transition-transform duration-200 md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full invisible'
        }`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <Logo showText size="32px" />
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
            <i className="fas fa-times text-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-5 py-6 space-y-8">
          <ul className="space-y-1 text-base">
            {user && <li><Link href="/dashboard" className="block py-2 font-semibold text-primary-700">Dashboard</Link></li>}
            <li><Link href="/features" className="block py-2 font-medium text-slate-800">Features</Link></li>
            <li><Link href="/guides" className="block py-2 font-medium text-slate-800">Guides</Link></li>
            <li><Link href="/docs" className="block py-2 font-medium text-slate-800">API</Link></li>
            <li><Link href="/tools" className="block py-2 font-medium text-slate-800">All tools</Link></li>
          </ul>

          {TOOL_MENU.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-slate-900 mb-2">{col.title}</p>
              <ul className="border-t border-slate-200">
                {col.tools.map((t) => (
                  <li key={t.href} className="border-b border-slate-200">
                    <Link href={t.href} className="block py-2.5 text-sm text-slate-700">{t.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-200 shrink-0">
          {ready && !user && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login/?signUp=false" className="py-2.5 text-center text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg">Log in</Link>
              <Link href="/login/?signUp=true" className="py-2.5 text-center text-sm font-semibold text-white bg-slate-900 rounded-lg">Sign up</Link>
            </div>
          )}
          {ready && user && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-9 w-9 rounded-full border border-slate-200" src={avatar} alt="" referrerPolicy="no-referrer" />
                <Link href="/settings" className="text-sm font-medium text-slate-800">Settings</Link>
              </div>
              <button type="button" onClick={doLogout} className="text-sm font-semibold text-rose-700">Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
