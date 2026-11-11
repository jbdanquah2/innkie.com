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
    <article className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={schema} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <i className="fas fa-chevron-right text-[8px]" />
          <Link href="/guides" className="hover:text-primary-600 transition-colors">Guides</Link>
          <i className="fas fa-chevron-right text-[8px]" />
          <span className="text-slate-600 normal-case tracking-normal truncate">{g.category}</span>
        </nav>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-3 py-1 bg-primary-50 rounded-full">{g.category}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.readingTime}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">{g.h1}</h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">{g.intro}</p>
        </header>

        <div className="space-y-12">
          {g.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-5">{section.heading}</h2>
              {section.paragraphs.map((para, i) => (
                <p key={i} className="text-slate-600 font-medium leading-relaxed mb-4">{para}</p>
              ))}
              {!!section.bullets?.length && (
                <ul className="space-y-3 mt-5">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-slate-600 font-medium leading-relaxed">
                      <i className="fas fa-circle-check text-primary-500 mt-1.5 text-sm flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {g.relatedToolRoute && (
          <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary-600/20 blur-[100px]" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-2">Put it into practice</p>
                <h3 className="text-2xl font-black tracking-tight">Try the {g.relatedToolName}</h3>
              </div>
              <Link href={g.relatedToolRoute} className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap">
                Open Tool <i className="fas fa-arrow-right" />
              </Link>
            </div>
          </div>
        )}

        {!!g.faqs?.length && (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {g.faqs.map((faq) => (
                <div key={faq.question} className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-20 pt-12 border-t border-slate-200">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">More Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {others.map((o) => (
              <Link key={o.slug} href={`/guides/${o.slug}`} className="flex flex-col gap-2 p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary-500 hover:shadow-lg transition-all group">
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{o.category}</span>
                <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">{o.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
