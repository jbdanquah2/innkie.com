'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

const HOOKS = [
  'Unlock deeper analytics and see what truly drives your clicks.',
  'Increase your link limits and track performance in real time.',
  'Add your own custom aliases and brand every short link. (coming soon)',
  'Get faster redirects and priority support with Pro.',
  'Access audience insights to optimize your campaigns.',
];

/** Final CTA. Guests (and the static HTML) get the sign-up block; signed-in users get the rotating dashboard hook. */
export function HomeCta() {
  const { user } = useAuth();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => setI((n) => (n + 1) % HOOKS.length), 4000);
    return () => clearInterval(t);
  }, [user]);

  if (user) {
    return (
      <div className="animate-fade-in space-y-12">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">{HOOKS[i]}</h2>
        <Link
          href="/dashboard"
          className="px-14 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-shadow transition-transform shadow-2xl shadow-primary-200 text-xl active:scale-95 inline-flex items-center gap-3 mx-auto"
        >
          Open Command Center <i className="fas fa-chevron-right text-xs opacity-50" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 rounded-[3rem] p-12 md:p-24 text-center border border-primary-100 relative group overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight leading-[0.9]">Start building today.</h2>
        <p className="text-slate-600 text-xl md:text-2xl mb-12 font-medium max-w-2xl mx-auto">
          Access powerful image, PDF, and developer tools instantly. No credit card, no tracking, just tools.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/tools" className="w-full sm:w-auto px-10 py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-shadow transition-transform shadow-xl shadow-primary-300 active:scale-95 text-lg">
            Explore All Tools
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-black rounded-2xl border-2 border-slate-200 hover:border-primary-600 transition-all active:scale-95 text-lg">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
