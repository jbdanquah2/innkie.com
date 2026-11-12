import { SvgToPng } from '@/components/tools/SvgToPng';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/svg-to-png';
export const metadata = registryMetadata(resolveToolPage(path));

export default function SvgToPngPage() {
  return <ToolPageLayout path={path}><SvgToPng /></ToolPageLayout>;
}
