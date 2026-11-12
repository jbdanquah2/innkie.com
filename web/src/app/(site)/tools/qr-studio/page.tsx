import { QrStudio } from '@/components/tools/QrStudio';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/qr-studio';
export const metadata = buildMetadata({
  title: 'Branded QR Studio',
  description: 'Design QR codes that match your brand: colours or gradients, dot and corner styles, and your logo in the middle. Download as PNG or SVG. Free, in your browser.',
  path,
});

export default function QrStudioPage() {
  return <ToolPageLayout path={path}><QrStudio /></ToolPageLayout>;
}
