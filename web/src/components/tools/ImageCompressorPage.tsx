import { ImageCompressor } from './ImageCompressor';
import { ToolPageLayout } from './ToolPageLayout';

export function ImageCompressorPage({ path }: { path: string }) {
  return <ToolPageLayout path={path} appCategory="MultimediaApplication"><ImageCompressor /></ToolPageLayout>;
}
