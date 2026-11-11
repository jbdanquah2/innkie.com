'use client';
import { useEffect, useRef } from 'react';
import { env, isProduction } from '@/lib/env';

interface Props {
  slotId: string;
  format?: string;
  fullWidthResponsive?: string;
  minHeight?: string;
}

/** AdSense unit. Renders nothing outside production (the Angular app gated on `production || showAdsInDev`). */
export function AdSlot({ slotId, format = 'auto', fullWidthResponsive = 'true', minHeight = '100px' }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const show = isProduction && !!env.adsenseClientId;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const processed = el.getAttribute('data-adsbygoogle-status') === 'done' || el.innerHTML.trim().length > 0;
      if (processed) return;
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn('Ads: AdSense push handled', e);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div className="ad-container my-8 w-full flex flex-col items-center overflow-hidden" style={{ minHeight: `calc(${minHeight} + 1.25rem)` }}>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Advertisement</p>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={env.adsenseClientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}
