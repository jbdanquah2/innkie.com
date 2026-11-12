import Link from 'next/link';
import { Logo } from '../Logo';
import { CookieSettingsButton, LinkCounter } from './FooterClient';
import { TOOL_MENU } from '@/lib/config/nav';

const linkCls = 'text-slate-400 hover:text-white transition-colors';

const MORE: { href: string; label: string }[] = [
  { href: '/guides', label: 'Guides' },
  { href: '/features', label: 'Features' },
  { href: '/docs', label: 'API' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/report-abuse', label: 'Report abuse' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)] gap-x-8 gap-y-12">
          <div className="col-span-2 lg:col-span-1 space-y-5">
            <Logo showText size="36px" className="brightness-0 invert" />
            <p className="text-sm leading-relaxed max-w-xs">Free web tools that run in your browser, plus short links and QR codes you can track.</p>
            <LinkCounter />
          </div>

          {TOOL_MENU.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-sm font-semibold text-white mb-4">{c.title}</h2>
              <ul className="space-y-2.5 text-sm">
                {c.tools.map((t) => (
                  <li key={t.href}><Link href={t.href} className={linkCls}>{t.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-sm">
          <nav aria-label="Site" className="flex flex-wrap gap-x-6 gap-y-2">
            {MORE.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>
            ))}
            <CookieSettingsButton className={`${linkCls} text-left`} />
          </nav>
          <div className="flex items-center gap-5">
            <p>&copy; {new Date().getFullYear()} iNNkie</p>
            <a href="https://www.linkedin.com/company/innkie/" target="_blank" rel="noopener" aria-label="iNNkie on LinkedIn" className="text-slate-500 hover:text-white transition-colors">
              <i className="fab fa-linkedin text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
