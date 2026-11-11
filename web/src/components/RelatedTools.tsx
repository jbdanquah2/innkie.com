import Link from 'next/link';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { TONE_CLASSES } from '@/lib/config/nav';

/** "Specialized versions" (aliases) + "Related utilities" from the registry. `currentPath` excludes the alias being viewed. */
export function RelatedTools({ category, excludeId, currentPath, maxTools = 3 }: { category: string; excludeId: string; currentPath?: string; maxTools?: number }) {
  const current = TOOL_REGISTRY.find((t) => t.id === excludeId);
  const aliases = current?.aliases?.filter((a) => a.path !== currentPath) ?? [];
  let related = TOOL_REGISTRY.filter((t) => t.category === category && t.id !== excludeId).slice(0, maxTools);
  if (!related.length) related = TOOL_REGISTRY.filter((t) => t.id !== excludeId).slice(0, maxTools);

  return (
    <div className="mt-20 border-t border-slate-100 pt-16">
      {aliases.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Specialized Versions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aliases.map((a) => (
              <Link key={a.path} href={a.path} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                  <i className="fas fa-layer-group text-xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{a.name || a.h1}</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">{a.intro || a.description}</p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors px-2 pt-1">
                  <i className="fas fa-chevron-right text-xs" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-10">
        <div className="h-8 w-1 bg-primary-600 rounded-full" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Related Utilities</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.map((tool) => {
          const tone = TONE_CLASSES[tool.color];
          return (
            <Link key={tool.id} href={tool.route} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0 ${tone.box.replace('group-hover/item:', 'group-hover:')}`}>
                <i className={`${tool.icon} text-xl`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{tool.name}</h3>
                <p className="text-slate-500 text-xs font-medium truncate">{tool.description}</p>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors px-2">
                <i className="fas fa-chevron-right text-xs" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link href="/tools" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary-600 transition-all group">
          Browse All Utilities <i className="fas fa-arrow-right transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
