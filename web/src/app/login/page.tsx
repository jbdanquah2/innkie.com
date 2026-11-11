import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { buildMetadata } from '@/lib/seo';

// Sign-in is intentionally kept out of the index (the sitemap omits it too).
export const metadata: Metadata = buildMetadata({
  title: 'Sign In',
  description: 'Sign in to your iNNkie dashboard to manage your short links and view analytics.',
  path: '/login',
  noindex: true,
});

export default function LoginPage() {
  return <LoginForm />;
}
