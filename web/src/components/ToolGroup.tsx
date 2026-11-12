'use client';
import { useEffect, useRef } from 'react';

/**
 * One group of the homepage tool directory. Rendered open in the static HTML (so it is fully crawlable and correct
 * on desktop); on phones everything except `defaultOpenOnMobile` is collapsed after hydration to keep the page short.
 */
export function ToolGroup({ title, blurb, defaultOpenOnMobile = false, children }: { title: string; blurb: string; defaultOpenOnMobile?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!defaultOpenOnMobile && window.matchMedia('(max-width: 767px)').matches) ref.current?.removeAttribute('open');
  }, [defaultOpenOnMobile]);
  return (
    <details ref={ref} open className="group">
      <summary className="list-none cursor-pointer md:cursor-default md:pointer-events-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{blurb}</p>
          </div>
          <i className="fas fa-chevron-down text-xs text-slate-400 mt-2 transition-transform group-open:rotate-180 md:hidden" aria-hidden="true" />
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
