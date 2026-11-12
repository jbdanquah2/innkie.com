import { QrGenerator } from '@/components/tools/QrGenerator';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/qr-generator';
export const metadata = registryMetadata(resolveToolPage(path));

export default function QrGeneratorPage() {
  return <ToolPageLayout path={path}><QrGenerator /></ToolPageLayout>;
}
