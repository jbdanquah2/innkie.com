import { PngToJpeg } from '@/components/tools/PngToJpeg';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/png-to-jpeg';
const description =
  'Convert PNG images to JPEG in your browser. Batch conversion, a before and after comparison, and ZIP download. Your files never leave your device.';

export const metadata = buildMetadata({ title: 'PNG to JPEG Converter', description, path });

export default function PngToJpegPage() {
  return <ToolPageLayout path={path} appCategory="MultimediaApplication"><PngToJpeg /></ToolPageLayout>;
}
