import Link from 'next/link';
import { getGuideByToolRoute } from '@/lib/config/guide-registry';

/** Link to the guide for a tool route; renders nothing when there is none. */
export function GuideCallout({ toolRoute, className = 'mt-16 block' }: { toolRoute: string; className?: string }) {
  const g = getGuideByToolRoute(toolRoute);
  if (!g) return null;
  return (
    <div className={className}>
      <Link
        href={`/guides/${g.slug}`}
        className="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-primary-500 hover:shadow-lg transition-all max-w-3xl mx-auto"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
          <i className="fas fa-book-open text-lg" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Related Guide · {g.readingTime}</p>
          <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{g.title}</h3>
        </div>
        <div className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors pl-2">
          <i className="fas fa-chevron-right text-xs" />
        </div>
      </Link>
    </div>
  );
}
