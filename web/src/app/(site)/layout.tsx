import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { env } from '@/lib/env';

// Public site chrome. Routes that hid the layout in Angular (login, /r/[code], 404) live outside this group.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    {/* AdSense loads only on public, content-bearing pages (not the signed-in app, login or redirect shell).
        Plain tag on purpose: next/script adds a data-nscript attribute, which AdSense rejects. */}
    {env.adsenseClientId && (
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.adsenseClientId}`}
        crossOrigin="anonymous"
      />
    )}
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-100 selection:text-primary-700">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
    </>
  );
}
