import Link from 'next/link';
import { Logo } from '../Logo';
import { CookieSettingsButton, LinkCounter } from './FooterClient';

const linkCls = 'text-slate-400 hover:text-white transition-colors';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Tools',
    links: [
      { href: '/tools/link-shortener', label: 'URL Shortener' },
      { href: '/tools/qr-generator', label: 'QR Code Generator' },
      { href: '/tools/image-compressor', label: 'Image Compressor' },
      { href: '/tools/pdf-to-image', label: 'PDF to Image' },
      { href: '/tools/json-formatter', label: 'JSON Formatter' },
      { href: '/tools', label: 'All tools' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/guides', label: 'Guides' },
      { href: '/features', label: 'Features' },
      { href: '/docs', label: 'API documentation' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/report-abuse', label: 'Report abuse' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-x-8 gap-y-12">
          <div className="col-span-2 md:col-span-1 space-y-5">
            <Logo showText size="36px" className="brightness-0 invert" />
            <p className="text-sm leading-relaxed max-w-xs">Free web tools that run in your browser, plus short links and QR codes you can track.</p>
            <LinkCounter />
          </div>

          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-sm font-semibold text-white mb-4">{c.title}</h2>
              <ul className="space-y-3 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className={linkCls}>{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold text-white mb-4">Legal</h2>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className={linkCls}>Privacy policy</Link></li>
              <li><Link href="/terms" className={linkCls}>Terms of service</Link></li>
              <li><CookieSettingsButton className={`${linkCls} text-left`} /></li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} iNNkie</p>
          <a href="https://www.linkedin.com/company/innkie/" target="_blank" rel="noopener" aria-label="iNNkie on LinkedIn" className="text-slate-500 hover:text-white transition-colors">
            <i className="fab fa-linkedin text-lg" />
          </a>
        </div>
      </div>
    </footer>
  );
}
