'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

/** Closing call to action. Guests (and the static HTML) see the sign-up prompt; signed-in users see a way back to the app. */
export function HomeCta() {
  const { user } = useAuth();
  return (
    <div className="rounded-2xl bg-primary-50 border border-primary-100 px-6 py-12 md:px-14 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
      <div className="max-w-xl">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {user ? 'Pick up where you left off.' : 'Keep track of your links.'}
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          {user
            ? 'Your links, QR codes and analytics are in your workspace.'
            : 'A free account adds click analytics, saved QR designs and workspaces. The tools above work without one.'}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        {user ? (
          <Link href="/dashboard" className="px-6 py-3 text-center rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors">Open dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="px-6 py-3 text-center rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors">Create free account</Link>
            <Link href="/tools" className="px-6 py-3 text-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 hover:border-slate-500 transition-colors">Browse tools</Link>
          </>
        )}
      </div>
    </div>
  );
}
