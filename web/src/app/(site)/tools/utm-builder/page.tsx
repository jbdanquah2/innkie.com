import { JsonLd } from '@/components/JsonLd';
import { UtmBuilder } from '@/components/tools/UtmBuilder';
import { UtmBuilderContent } from '@/components/tools/UtmBuilderContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

const description =
  'Generate tracking URLs with Google Analytics UTM parameters easily. iNNkie UTM Builder helps you track marketing campaigns with source, medium, and campaign parameters.';

export const metadata = buildMetadata({ title: 'UTM Link Builder', description, path: '/tools/utm-builder' });

const faq = {
  '@type': 'FAQPage',
  mainEntity: [
    ['Are UTM links permanent?', 'Yes. UTM parameters are part of the URL and will work indefinitely as long as the destination website supports them.'],
    ['Do UTM links affect SEO?', 'Generally, no. Most modern websites use canonical tags to identify the primary page and avoid duplicate content issues from UTM parameters.'],
    ['Can I shorten UTM links?', 'Yes. Shortening a long UTM link makes it cleaner for social media or print while preserving tracking data for analytics.'],
  ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

export default function UtmBuilderPage() {
  const [app, crumbs] = buildToolSchema({
    route: '/tools/utm-builder',
    appName: 'iNNkie Free UTM Link Builder',
    crumb: 'UTM Link Builder',
    description,
    category: 'BusinessApplication',
  });
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={[app, faq, crumbs]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Free <span className="text-primary-600">UTM</span> Link Builder
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto">
            Generate tracking URLs with Google Analytics UTM parameters to track your marketing campaigns accurately.
          </p>
        </div>
        <UtmBuilder />
        <UtmBuilderContent />
      </div>
    </div>
  );
}
