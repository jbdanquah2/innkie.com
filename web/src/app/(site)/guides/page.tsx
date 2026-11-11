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
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={[collection, getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Guides', url: '/guides' }], '/guides')]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">iNNkie Guides</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Guides &amp; <span className="text-primary-600">How-Tos</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Practical, no-fluff explainers on links, tracking, developer tooling, and media — written to help you use the right tool the right way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {GUIDE_REGISTRY.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-3 py-1 bg-primary-50 rounded-full">{guide.category}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{guide.readingTime}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight leading-snug group-hover:text-primary-600 transition-colors">{guide.title}</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">{guide.description}</p>
              <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest">
                Read Guide <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
