import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { buildMetadata } from '@/lib/seo';

const path = '/tools/jwt-decoder';
export const metadata = buildMetadata({
  title: 'JWT Decoder',
  description: 'Decode a JSON Web Token in your browser: header, claims, expiry status and local times. Optionally check an HS256 signature. Your token is never uploaded.',
  path,
});

export default function JwtDecoderPage() {
  return <ToolPageLayout path={path}><JwtDecoder /></ToolPageLayout>;
}
