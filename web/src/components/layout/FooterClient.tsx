'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

/** Live "links shortened" ticker from the publicly readable stats/global doc. */
export function LinkCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(getDb(), 'stats/global'),
      (snap) => snap.exists() && setTotal(snap.data()['totalUrlsShortened'] || 0),
      () => {},
    );
    return unsub;
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 shadow-inner">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
        {total === null ? '—' : total.toLocaleString('en-US')} Links Shortened
      </span>
    </div>
  );
}

/** Re-opens Google's consent message; falls back to Google Ads Settings outside the CMP regions. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const open = () => {
    const fc = (window as any).googlefc;
    if (fc && typeof fc.showRevocationMessage === 'function') fc.showRevocationMessage();
    else window.open('https://www.google.com/settings/ads', '_blank');
  };
  return (
    <button type="button" onClick={open} className={className}>
      Cookie Settings
    </button>
  );
}
