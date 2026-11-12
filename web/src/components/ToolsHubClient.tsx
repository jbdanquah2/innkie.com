'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

const CATEGORIES = [
  { id: 'link', label: 'Links and QR codes' },
  { id: 'media', label: 'Images' },
  { id: 'docs', label: 'Documents and text' },
  { id: 'dev', label: 'Developer utilities' },
] as const;

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

  const tab = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Free tools</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            {TOOL_REGISTRY.length} tools for links, images, PDFs and code. Files are processed in your browser and never uploaded.
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by category">
            <button type="button" onClick={() => setCategory('all')} aria-pressed={category === 'all'} className={tab(category === 'all')}>All</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={tab(category === c.id)}>{c.label}</button>
            ))}
          </div>
          <div className="relative md:w-72">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tools"
              placeholder="Search tools"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="mt-10 space-y-12">
          {CATEGORIES.map((cat) => {
            const tools = filtered.filter((t) => t.category === cat.id);
            if (!tools.length) return null;
            return (
              <section key={cat.id} aria-labelledby={`hub-${cat.id}`}>
                <h2 id={`hub-${cat.id}`} className="text-lg font-semibold text-slate-900">{cat.label}</h2>
                <ul className="mt-3 grid md:grid-cols-2 md:gap-x-12 border-t border-slate-200">
                  {tools.map((tool) => (
                    <li key={tool.id} className="border-b border-slate-200">
                      <Link href={tool.route} className="group flex items-start gap-4 py-4">
                        <i className={`${tool.icon} w-5 text-center text-slate-400 group-hover:text-primary-600 mt-1 transition-colors`} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{tool.name}</span>
                          <span className="block text-sm text-slate-500 mt-0.5 leading-snug">{tool.description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16">
              <p className="font-medium text-slate-900">No tools match &ldquo;{query}&rdquo;.</p>
              <p className="text-sm text-slate-500 mt-1">Try a different word, or browse by category.</p>
              <button type="button" onClick={clear} className="mt-4 text-sm font-medium text-primary-700 hover:underline">Show all tools</button>
            </div>
          )}
        </div>

        {category === 'all' && !query && (
          <section className="mt-16" aria-labelledby="hub-guides">
            <h2 id="hub-guides" className="text-lg font-semibold text-slate-900">Guides</h2>
            <ul className="mt-3 grid md:grid-cols-2 md:gap-x-12 border-t border-slate-200">
              {GUIDE_REGISTRY.map((guide) => (
                <li key={guide.slug} className="border-b border-slate-200">
                  <Link href={`/guides/${guide.slug}`} className="group block py-4">
                    <span className="block text-xs text-slate-500">{guide.category} · {guide.readingTime}</span>
                    <span className="block font-medium text-slate-900 mt-0.5 group-hover:text-primary-700 transition-colors">{guide.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-16">{adSlot}</div>
      </div>
    </div>
  );
}
