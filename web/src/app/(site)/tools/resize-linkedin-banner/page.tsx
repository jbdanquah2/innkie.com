import { ImageResizerPage } from '@/components/tools/ImageResizerPage';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

export const metadata = registryMetadata(resolveToolPage('/tools/resize-linkedin-banner'));

export default function Page() {
  return <ImageResizerPage path="/tools/resize-linkedin-banner" />;
}
