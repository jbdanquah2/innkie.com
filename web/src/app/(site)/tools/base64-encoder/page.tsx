import { Base64Encoder } from '@/components/tools/Base64Encoder';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/base64-encoder';
export const metadata = buildMetadata({
  title: 'Base64 Encoder & Decoder',
  description: 'Encode text or files to Base64 and decode Base64 to text, images and files. Supports URL-safe Base64 and data: URIs. Runs in your browser, so nothing is uploaded.',
  path,
});

export default function Base64EncoderPage() {
  return <ToolPageLayout path={path}><Base64Encoder /></ToolPageLayout>;
}
