import { ImageCompressorPage } from '@/components/tools/ImageCompressorPage';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

export const metadata = registryMetadata(resolveToolPage('/tools/compress-images-for-shopify'));

export default function Page() {
  return <ImageCompressorPage path="/tools/compress-images-for-shopify" />;
}
