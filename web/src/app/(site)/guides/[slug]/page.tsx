import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema, getFaqSchema } from '@/lib/seo';
import { GUIDE_REGISTRY, getGuideBySlug } from '@/lib/config/guide-registry';

// Static export: only the slugs below exist. Anything else is a real 404 (not the empty SPA shell).
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_REGISTRY.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuideBySlug(slug);
  if (!g) return {};
  return buildMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}` });
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuideBySlug(slug);
  if (!g) notFound();

  const path = `/guides/${g.slug}`;
  const url = `https://innkie.com${path}`;
  const others = GUIDE_REGISTRY.filter((x) => x.slug !== g.slug).slice(0, 4);

  const schema: unknown[] = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: g.title,
      description: g.description,
      url,
      datePublished: g.datePublished,
      dateModified: g.datePublished,
      articleSection: g.category,
      inLanguage: 'en-US',
      author: { '@type': 'Organization', name: 'iNNkie', '@id': 'https://innkie.com/#organization' },
      publisher: { '@id': 'https://innkie.com/#organization' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }, { name: g.title, url: path }], path),
  ];
  if (g.faqs?.length) schema.push(getFaqSchema(g.faqs));

  return (
    <article className="min-h-screen bg-white pt-28 pb-20">
      <JsonLd schema={schema} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/guides" className="hover:text-slate-900">Guides</Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-700">{g.category}</span>
        </nav>

        <header className="mb-10">
          <p className="text-sm text-slate-500 mb-3">{g.category} · {g.readingTime}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">{g.h1}</h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed">{g.intro}</p>
        </header>

        <div className="space-y-10">
          {g.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-4">{section.heading}</h2>
              {section.paragraphs.map((para, i) => (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">{para}</p>
              ))}
              {!!section.bullets?.length && (
                <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-slate-400">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="text-slate-700 leading-relaxed pl-1">{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {g.relatedToolRoute && (
          <aside className="mt-14 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900">Try it: {g.relatedToolName}</p>
              <p className="text-sm text-slate-500 mt-0.5">Free, runs in your browser.</p>
            </div>
            <Link href={g.relatedToolRoute} className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap">
              Open tool
            </Link>
          </aside>
        )}

        {!!g.faqs?.length && (
          <section className="mt-14">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Frequently asked questions</h2>
            <dl className="divide-y divide-slate-200 border-t border-slate-200 mt-4">
              {g.faqs.map((faq) => (
                <div key={faq.question} className="py-5">
                  <dt className="font-medium text-slate-900">{faq.question}</dt>
                  <dd className="mt-1.5 text-slate-600 leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-16 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">More guides</h2>
          <ul className="mt-3 border-t border-slate-200">
            {others.map((o) => (
              <li key={o.slug} className="border-b border-slate-200">
                <Link href={`/guides/${o.slug}`} className="group block py-3">
                  <span className="block text-xs text-slate-500">{o.category}</span>
                  <span className="block font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{o.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
