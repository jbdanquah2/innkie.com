'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '../Logo';
import { useAuth } from '@/lib/auth';
import { TOOL_MENU, TONE_CLASSES } from '@/lib/config/nav';

// This is a client component for the menus' open/close state, but Next still renders its
// full markup into the static HTML: the tool links below are present for crawlers even
// while the mega-menu is visually closed (the Angular version only rendered them on click).

const navLink = (active: boolean) =>
  `px-4 py-2 rounded-xl text-sm font-bold transition-all ${
    active ? 'text-primary-600 bg-primary-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
  }`;

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
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const is = (p: string) => (p === '/' ? pathname === '/' : pathname.startsWith(p));
  const avatar = user?.photoURL || '/assets/default-avatar.png';
  const doLogout = async () => {
    setMobileOpen(false);
    await logout();
    window.location.assign('/');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-10">
            <Logo className="flex-shrink-0" />
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className={navLink(pathname === '/')}>Home</Link>

              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  aria-expanded={toolsOpen}
                  onClick={() => setToolsOpen((o) => !o)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all ${
                    toolsOpen || is('/tools') ? 'text-primary-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Explore Tools
                  <i className={`fas fa-chevron-down ml-1.5 text-[10px] transition-transform duration-300 ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div
                  className={`${toolsOpen ? 'block' : 'hidden'} absolute top-full left-[-150px] mt-2 w-[800px] rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-black/5 border border-slate-100 overflow-hidden`}
                >
                  <div className="grid grid-cols-3 gap-8">
                    {TOOL_MENU.map((col) => (
                      <div key={col.title}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{col.title}</p>
                        <div className="space-y-2">
                          {col.tools.map((t) => (
                            <Link
                              key={t.href}
                              href={t.href}
                              className={`flex items-start gap-4 p-3 rounded-2xl group/item transition-all ${TONE_CLASSES[t.tone].hover}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover/item:text-white transition-all shadow-sm ${TONE_CLASSES[t.tone].box}`}>
                                <i className={`fas ${t.icon}`} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 leading-none">{t.label}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-tight">{t.hint}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <Link href="/guides" className="text-xs font-black text-slate-500 hover:text-primary-600 flex items-center gap-2">
                      <i className="fas fa-book-open text-[10px]" /> Read the Guides
                    </Link>
                    <Link href="/tools" className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-2">
                      View Full Suite <i className="fas fa-arrow-right text-[10px]" />
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/features" className={navLink(is('/features'))}>Features</Link>
              <Link href="/guides" className={navLink(is('/guides'))}>Guides</Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auth area renders only once Firebase has reported state, as in the Angular app. */}
            {ready && (
              <div className="hidden md:flex items-center space-x-3">
                {!user ? (
                  <>
                    <Link href="/login/?signUp=false" className="text-sm font-bold text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">
                      Log in
                    </Link>
                    <Link
                      href="/login/?signUp=true"
                      className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95"
                    >
                      Sign up
                    </Link>
                  </>
                ) : (
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="h-8 w-8 rounded-full border border-slate-200" src={avatar} alt="Profile" referrerPolicy="no-referrer" />
                      <i className="fas fa-chevron-down text-[8px] text-slate-400" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white py-2 shadow-2xl ring-1 ring-black/5 border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/30">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Account</p>
                        </div>
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-all">
                          <i className="fas fa-th-large w-4 opacity-50" /> Dashboard
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-all">
                          <i className="fas fa-user-cog w-4 opacity-50" /> Settings
                        </Link>
                        <div className="h-px bg-slate-50 my-1" />
                        <button type="button" onClick={doLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all text-left">
                          <i className="fas fa-sign-out-alt w-4 opacity-50" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center md:hidden">
              <button
                type="button"
                aria-label="Open main menu"
                onClick={() => setMobileOpen((o) => !o)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-slate-100"
              >
                <i className={mobileOpen ? 'fas fa-times text-xl' : 'fas fa-bars-staggered text-xl'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-slate-900/40 z-[60] md:hidden" />}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[70] transform transition-transform duration-300 md:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <Logo size="100px" />
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-8 space-y-10">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Navigation</p>
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <i className="fas fa-home w-5 text-slate-300" /> Home
            </Link>
            <Link href="/features" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <i className="fas fa-star w-5 text-slate-300" /> Features
            </Link>
            <Link href="/guides" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <i className="fas fa-book-open w-5 text-slate-300" /> Guides
            </Link>
            {user && (
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold text-primary-600 bg-primary-50 transition-all">
                <i className="fas fa-th-large w-5" /> Dashboard
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Utility Suite</p>
            <div className="grid grid-cols-1 gap-2">
              {TOOL_MENU.flatMap((c) => c.tools).map((t) => (
                <Link key={t.href} href={t.href} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TONE_CLASSES[t.tone].item}`}>
                    <i className={`fas ${t.icon}`} />
                  </div>
                  <span className="text-sm font-black text-slate-800">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          {ready && !user && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login/?signUp=false" className="py-3 text-center text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl">Log in</Link>
              <Link href="/login/?signUp=true" className="py-3 text-center text-sm font-bold text-white bg-primary-600 rounded-xl shadow-lg shadow-primary-200">Get Started</Link>
            </div>
          )}
          {ready && user && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-10 w-10 rounded-full border border-white shadow-sm" src={avatar} alt="" referrerPolicy="no-referrer" />
                <div>
                  <p className="text-sm font-black text-slate-800">My Account</p>
                  <p className="text-[10px] text-slate-400 font-medium">Logged in</p>
                </div>
              </div>
              <button type="button" onClick={doLogout} className="w-full py-3 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl flex items-center justify-center gap-2">
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
