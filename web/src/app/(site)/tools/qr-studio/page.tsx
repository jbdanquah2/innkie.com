import { JsonLd } from '@/components/JsonLd';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { QrStudio } from '@/components/tools/QrStudio';
import { buildMetadata, getBreadcrumbSchema, getFaqSchema } from '@/lib/seo';
import { resolveToolPage } from '@/lib/tool-page';

const p = resolveToolPage('/tools/qr-studio');

export const metadata = buildMetadata({
  title: 'Branded QR Studio',
  description: 'Design high-resolution, branded QR codes for your business. Customize colors, shapes, and add your logo with our professional QR Studio.',
  path: '/tools/qr-studio',
});

const schema = [
  getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Tools', url: '/tools' }, { name: 'QR Studio', url: '/tools/qr-studio' }]),
  {
    '@type': 'SoftwareApplication',
    '@id': 'https://innkie.com/tools/qr-studio#app',
    name: 'iNNkie Branded QR Studio',
    url: 'https://innkie.com/tools/qr-studio',
    operatingSystem: 'Any',
    applicationCategory: 'BusinessApplication',
    description: 'Design high-resolution, branded QR codes with custom colors, gradients, and logos for professional campaigns.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  getFaqSchema(p.tool.faqs),
];

export default function QrStudioPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <JsonLd schema={schema} />
      <QrStudio />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-32 space-y-24">
          <ToolSections sections={p.tool.sections} variant="badge" />
          <ToolFaqs faqs={p.tool.faqs} className="pb-20" />
          <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={p.path} />
        </div>
      </div>
    </div>
  );
}
