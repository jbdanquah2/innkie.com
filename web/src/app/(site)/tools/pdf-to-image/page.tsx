import { PdfToImage } from '@/components/tools/PdfToImage';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

const path = '/tools/pdf-to-image';
export const metadata = registryMetadata(resolveToolPage(path));

export default function PdfToImagePage() {
  return <ToolPageLayout path={path}><PdfToImage /></ToolPageLayout>;
}
