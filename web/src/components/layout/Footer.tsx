import Link from 'next/link';
import { Logo } from '../Logo';
import { CookieSettingsButton, LinkCounter } from './FooterClient';

const linkCls = 'hover:text-primary-500 transition-colors';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          <div className="space-y-6">
            <Logo showText size="44px" className="brightness-0 invert" />
            <p className="text-sm leading-relaxed font-medium max-w-xs text-slate-500">
              The all-in-one utility platform for creators and teams who care about branding, analytics, and speed.
            </p>
            <LinkCounter />
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Platform</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/links" className={linkCls}>Links Hub</Link></li>
              <li><Link href="/analytics" className={linkCls}>Traffic Insights</Link></li>
              <li><Link href="/qr-studio" className={linkCls}>QR Studio</Link></li>
              <li><Link href="/developer-api" className={linkCls}>Developer API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Resources</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/features" className={linkCls}>Product Tour</Link></li>
              <li><Link href="/guides" className={linkCls}>Guides</Link></li>
              <li><Link href="/docs" className={linkCls}>API Documentation</Link></li>
              <li><Link href="/contact" className={linkCls}>Support Center</Link></li>
              <li><Link href="/about" className={linkCls}>About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Company</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/privacy" className={linkCls}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={linkCls}>Terms of Service</Link></li>
              <li><CookieSettingsButton className={`${linkCls} text-left`} /></li>
              <li><Link href="/contact" className={linkCls}>Contact Us</Link></li>
              <li><Link href="/report-abuse" className={linkCls}>Report Abuse</Link></li>
              <li><Link href="/about" className={linkCls}>About iNNkie</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            &copy; {new Date().getFullYear()} iNNkie Utility Platform. Built for the modern web.
          </p>
          <div className="flex items-center gap-6 text-slate-500">
            <a href="https://www.linkedin.com/company/innkie/" target="_blank" rel="noopener" aria-label="iNNkie on LinkedIn" className="hover:text-white transition-colors">
              <i className="fab fa-linkedin text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
