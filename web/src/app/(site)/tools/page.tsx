import { JsonLd } from '@/components/JsonLd';
import { AdSlot } from '@/components/AdSlot';
import { ToolsHubClient } from '@/components/ToolsHubClient';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';

export const metadata = buildMetadata({
  title: 'Free Online Tools for Links, Images, PDFs and Developers',
  description:
    'Browse every iNNkie tool: link shortener, QR codes, image compressor and resizer, PDF converters, JSON formatter and more. They run in your browser, so files are never uploaded.',
  path: '/tools',
});

const schema = [
  {
    '@type': 'CollectionPage',
    '@id': 'https://innkie.com/tools#collection',
    name: 'iNNkie Free Web Utilities & Tools',
    description: 'Free tools for links, images, PDFs and developers that run in your browser.',
    url: 'https://innkie.com/tools',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: TOOL_REGISTRY.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://innkie.com${t.route}`, name: t.name })),
    },
  },
  getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Tools', url: '/tools' }]),
];

export default function ToolsHubPage() {
  return (
    <>
      <JsonLd schema={schema} />
      <ToolsHubClient adSlot={<AdSlot slotId="tools_hub_bottom" minHeight="250px" />} />
    </>
  );
}
