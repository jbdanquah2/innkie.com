import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { env } from '@/lib/env';
import { BASE_URL } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  appleWebApp: { title: 'iNNkie' },
  authors: [{ name: 'iNNkie' }],
};

// auth.innkie.com serves Firebase Auth handler pages: keep it out of the index and send
// real visitors to the primary domain (ported from src/index.html).
const AUTH_DOMAIN_GUARD = `
if (window.location.hostname === 'auth.innkie.com') {
  var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow';
  document.head.appendChild(m);
  var l = document.querySelector('link[rel="canonical"]') || document.createElement('link');
  l.setAttribute('rel', 'canonical'); l.setAttribute('href', 'https://innkie.com' + window.location.pathname);
  if (!l.parentNode) document.head.appendChild(l);
  if (!window.location.pathname.startsWith('/__/')) {
    window.location.replace('https://innkie.com' + window.location.pathname + window.location.search);
  }
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: AUTH_DOMAIN_GUARD }} />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        {env.adsenseClientId && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
