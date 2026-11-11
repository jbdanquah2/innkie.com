import { ImageCompressorPage } from '@/components/tools/ImageCompressorPage';
import { registryMetadata, resolveToolPage } from '@/lib/tool-page';

export const metadata = registryMetadata(resolveToolPage('/tools/image-compressor'));

export default function Page() {
  return <ImageCompressorPage path="/tools/image-compressor" />;
}
