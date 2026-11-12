import Link from 'next/link';
import { getGuideByToolRoute } from '@/lib/config/guide-registry';

/** Link to the guide for a tool route; renders nothing when there is none. */
export function GuideCallout({ toolRoute, className = 'mt-16' }: { toolRoute: string; className?: string }) {
  const g = getGuideByToolRoute(toolRoute);
  if (!g) return null;
  return (
    <aside className={className} aria-label="Related guide">
      <Link
        href={`/guides/${g.slug}`}
        className="group block max-w-3xl rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
      >
        <p className="text-xs font-medium text-slate-500">Read the guide · {g.readingTime}</p>
        <h3 className="mt-1.5 font-semibold text-slate-900 leading-snug group-hover:text-primary-700 transition-colors">{g.title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">{g.description}</p>
      </Link>
    </aside>
  );
}
