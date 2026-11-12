import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { UtmBuilder } from '@/components/tools/UtmBuilder';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/utm-builder';
export const metadata = buildMetadata({
  title: 'UTM Link Builder',
  description: 'Add UTM tags to a link so Google Analytics shows which campaign, source and medium each visit came from. Copy the link or shorten it. Runs in your browser.',
  path,
});

export default function UtmBuilderPage() {
  return <ToolPageLayout path={path}><UtmBuilder /></ToolPageLayout>;
}
