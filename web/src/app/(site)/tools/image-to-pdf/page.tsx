import { ImageToPdf } from '@/components/tools/ImageToPdf';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/image-to-pdf';
export const metadata = buildMetadata({
  title: 'Image to PDF Converter',
  description: 'Combine JPG, PNG and WebP images into one PDF. Reorder pages, choose A4 or fit-to-image pages, and download. Done in your browser, so your images are never uploaded.',
  path,
});

export default function ImageToPdfPage() {
  return <ToolPageLayout path={path}><ImageToPdf /></ToolPageLayout>;
}
