import type { Metadata } from 'next';
import { RedirectClient } from '@/components/auth/RedirectClient';
import { buildMetadata } from '@/lib/seo';

// One pre-rendered shell for every /r/<code>/ URL (firebase.json rewrites /r/** to it); the code is read client-side.
export const metadata: Metadata = buildMetadata({
  title: 'Redirecting...',
  description: 'Please wait while we redirect you.',
  path: '/r',
  noindex: true,
});

export default function RedirectPage() {
  return <RedirectClient />;
}
