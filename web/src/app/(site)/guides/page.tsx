import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

export const metadata = buildMetadata({
  title: 'Guides & How-Tos',
  description:
    'Practical, no-fluff guides on links, redirects, UTM tracking, JWTs, and image formats — from the iNNkie utility platform.',
  path: '/guides',
  keywords: ['guides', 'how to', 'url redirects', 'utm parameters', 'jwt', 'image formats', 'iNNkie'],
});

const collection = {
  '@type': 'CollectionPage',
  '@id': 'https://innkie.com/guides#collection',
  name: 'iNNkie Guides',
  url: 'https://innkie.com/guides',
  description: 'Practical guides on links, tracking, developer tooling, and media.',
  hasPart: GUIDE_REGISTRY.map((g) => ({
    '@type': 'Article',
    headline: g.title,
    url: `https://innkie.com/guides/${g.slug}`,
  })),
};

export default function GuidesHubPage() {
  const categories = [...new Set(GUIDE_REGISTRY.map((g) => g.category))];
  return (
    <div className="bg-white min-h-screen pt-28 pb-20">
      <JsonLd schema={[collection, getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }], '/guides')]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Guides</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Explainers on redirects, tracking, encodings, tokens and image formats, written to go with the tools.
          </p>
        </header>

        <div className="mt-10 space-y-12">
          {categories.map((cat) => (
            <section key={cat} aria-labelledby={`g-${cat}`}>
              <h2 id={`g-${cat}`} className="text-lg font-semibold text-slate-900">{cat}</h2>
              <ul className="mt-3 border-t border-slate-200">
                {GUIDE_REGISTRY.filter((g) => g.category === cat).map((guide) => (
                  <li key={guide.slug} className="border-b border-slate-200">
                    <Link href={`/guides/${guide.slug}`} className="group block py-5 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
                      <span>
                        <span className="block font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{guide.title}</span>
                        <span className="block text-xs text-slate-500 mt-1">{guide.readingTime}</span>
                      </span>
                      <span className="block text-sm text-slate-600 leading-relaxed mt-2 md:mt-0">{guide.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
