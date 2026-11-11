'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

const CATEGORIES = [
  { id: 'docs', label: 'Document Utilities' },
  { id: 'media', label: 'Media & Image' },
  { id: 'link', label: 'Links & Web' },
  { id: 'dev', label: 'Developer Utilities' },
] as const;

const TONE: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
};

/**
 * Search + category filter. The initial render (no query, "all") contains every tool link, so the
 * prerendered HTML is the complete hub; filtering only happens after hydration.
 */
export function ToolsHubClient({ adSlot }: { adSlot: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  // /tools?q=pdf (used by the WebSite SearchAction)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return TOOL_REGISTRY.filter((t) => {
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchesSearch && (category === 'all' || t.category === category);
    });
  }, [query, category]);

  const clear = () => {
    setQuery('');
    setCategory('all');
  };

  const pill = (active: boolean) =>
    `px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-slate-200 hover:border-primary-400 ${
      active ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'bg-white text-slate-500'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Free <span className="text-primary-600">Utilities</span> Hub
            </h1>
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              A professional suite of 100% private, browser-side tools for modern digital teams.
            </p>
          </div>

          <div className="relative max-w-xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
              <i className="fas fa-search text-lg" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tools"
              placeholder="Search for a tool (e.g. PDF, Image, JWT)..."
              className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-bold text-lg shadow-xl shadow-slate-200/40"
            />
            {query && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                  <i className="fas fa-times text-xs" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button type="button" onClick={() => setCategory('all')} className={pill(category === 'all')}>All Tools</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={pill(category === c.id)}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-20">
          {CATEGORIES.map((cat) => {
            const tools = filtered.filter((t) => t.category === cat.id);
            if (!tools.length) return null;
            return (
              <section key={cat.id}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary-600 rounded-full" />
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{cat.label}</h2>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{tools.length} Tools</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tools.map((tool) => (
                    <Link key={tool.id} href={tool.route} className="group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`${TONE[tool.color]} p-3 rounded-2xl group-hover:text-white transition-all duration-300 shadow-sm`}>
                          <i className={`${tool.icon} text-2xl`} />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">{tool.name}</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-grow">{tool.description}</p>
                      <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest border-t border-slate-50 pt-6 group-hover:gap-3 transition-all">
                        Launch Utility <i className="fas fa-arrow-right transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 text-3xl">
                <i className="fas fa-search" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No tools match your search</h3>
              <p className="text-slate-500 font-medium mb-8">Try using different keywords or browse by category.</p>
              <button type="button" onClick={clear} className="px-8 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {category === 'all' && !query && (
          <section className="mt-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-primary-600 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Guides &amp; How-Tos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GUIDE_REGISTRY.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group flex items-center gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-primary-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                    <i className="fas fa-book-open text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{guide.category} · {guide.readingTime}</p>
                    <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{guide.title}</h3>
                  </div>
                  <div className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors pl-2">
                    <i className="fas fa-chevron-right text-xs" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-20">{adSlot}</div>
      </div>
    </div>
  );
}
