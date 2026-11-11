import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

// Everything in this group is the signed-in app: never indexed (also disallowed in robots.txt).
export const metadata: Metadata = {
  title: { absolute: 'App Dashboard | iNNkie' },
  description: 'Private iNNkie workspace area.',
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
