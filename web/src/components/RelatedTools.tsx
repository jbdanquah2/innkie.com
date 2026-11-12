import Link from 'next/link';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';

/** "Related tools" (and variants of this tool) from the registry. `currentPath` excludes the alias being viewed. */
export function RelatedTools({ category, excludeId, currentPath, maxTools = 3 }: { category: string; excludeId: string; currentPath?: string; maxTools?: number }) {
  const current = TOOL_REGISTRY.find((t) => t.id === excludeId);
  const aliases = current?.aliases?.filter((a) => a.path !== currentPath) ?? [];
  let related = TOOL_REGISTRY.filter((t) => t.category === category && t.id !== excludeId).slice(0, maxTools);
  if (!related.length) related = TOOL_REGISTRY.filter((t) => t.id !== excludeId).slice(0, maxTools);

  return (
    <section aria-label="Related tools" className="mt-20 border-t border-slate-200 pt-12">
      {aliases.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Variants of this tool</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {aliases.map((a) => (
              <li key={a.path}>
                <Link href={a.path} className="group block h-full rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors">
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{a.name || a.h1}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">{a.intro || a.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">More tools like this</h2>
        <Link href="/tools" className="text-sm font-semibold text-primary-700 hover:underline shrink-0">All tools →</Link>
      </div>
      <ul className="grid md:grid-cols-3 gap-4">
        {related.map((tool) => (
          <li key={tool.id}>
            <Link href={tool.route} className="group block h-full rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors">
              <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{tool.name}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
