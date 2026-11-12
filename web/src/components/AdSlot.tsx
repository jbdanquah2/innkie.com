'use client';
import { useEffect, useRef } from 'react';
import { env, isProduction } from '@/lib/env';

interface Props {
  slotId: string;
  format?: string;
  fullWidthResponsive?: string;
  minHeight?: string;
}

/** AdSense unit. Renders nothing outside production, or when `slotId` is not a real numeric AdSense slot id. */
export function AdSlot({ slotId, format = 'auto', fullWidthResponsive = 'true', minHeight = '100px' }: Props) {
  const ref = useRef<HTMLModElement>(null);
  // AdSense slot ids are numeric. Placeholder names never fill and would leave an empty, labelled gap, so render nothing until a real id is set.
  const show = isProduction && !!env.adsenseClientId && /^\d{6,}$/.test(slotId);

  useEffect(() => {
    if (!show) return;
    const el = ref.current;
    if (!el) return;
    let done = false;
    const push = () => {
      if (done) return;
      const processed = el.getAttribute('data-adsbygoogle-status') === 'done' || el.innerHTML.trim().length > 0;
      if (processed) { done = true; return; }
      // AdSense throws "No slot size for availableWidth=0" if the unit has no width yet (hidden/collapsed/not laid out).
      if (el.offsetWidth === 0) return;
      done = true;
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn('Ads: AdSense push handled', e);
      }
    };
    const t = setTimeout(push, 200);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(push) : null;
    ro?.observe(el);
    return () => { clearTimeout(t); ro?.disconnect(); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="ad-container my-8 w-full flex flex-col items-center overflow-hidden" style={{ minHeight: `calc(${minHeight} + 1.25rem)` }}>
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Advertisement</p>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight }}
        data-ad-client={env.adsenseClientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}
