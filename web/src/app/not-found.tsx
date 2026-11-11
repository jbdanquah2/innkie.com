import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Page Not Found',
  description: 'This iNNkie page does not exist.',
  path: '/404',
  noindex: true,
});

// Rendered to out/404.html. Firebase Hosting serves this for unmatched paths.
export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg text-center">
        <div className="mb-10 flex justify-center">
          <Logo size="64px" showText />
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/60 px-8 py-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <i className="fas fa-triangle-exclamation text-2xl" />
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">Page Not Found</h1>
          <p className="mx-auto mb-8 max-w-sm text-sm font-medium leading-6 text-slate-500">
            The page you requested does not exist or may have moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-primary-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-primary-200 transition-all hover:bg-primary-700 active:scale-95"
          >
            <i className="fas fa-arrow-left" />
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
