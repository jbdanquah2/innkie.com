import { ImageResizer } from './ImageResizer';
import { ToolPageLayout } from './ToolPageLayout';

export function ImageResizerPage({ path }: { path: string }) {
  return <ToolPageLayout path={path} appCategory="MultimediaApplication"><ImageResizer /></ToolPageLayout>;
}
