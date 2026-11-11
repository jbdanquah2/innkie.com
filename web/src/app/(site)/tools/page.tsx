import { JsonLd } from '@/components/JsonLd';
import { AdSlot } from '@/components/AdSlot';
import { ToolsHubClient } from '@/components/ToolsHubClient';
import { buildMetadata, getBreadcrumbSchema } from '@/lib/seo';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';

export const metadata = buildMetadata({
  title: 'Free Online Utilities & Productive Web Tools',
  description:
    'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more. All tools run in your browser for maximum privacy.',
  path: '/tools',
});

const schema = [
  {
    '@type': 'CollectionPage',
    '@id': 'https://innkie.com/tools#collection',
    name: 'iNNkie Free Web Utilities & Tools',
    description: 'Boost your productivity with iNNkie free tools. Image compression, QR code generation, UTM builders, and more.',
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
