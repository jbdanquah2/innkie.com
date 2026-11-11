import { JsonLd } from '@/components/JsonLd';
import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { JwtDecoderContent } from '@/components/tools/JwtDecoderContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

const description =
  'Inspect and debug JSON Web Tokens securely in your browser. 100% client-side decoding ensures your security tokens are never sent to a server.';

export const metadata = buildMetadata({ title: 'JWT Decoder', description, path: '/tools/jwt-decoder' });

export default function JwtDecoderPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd
        schema={buildToolSchema({
          route: '/tools/jwt-decoder',
          appName: 'iNNkie Secure JWT Decoder',
          crumb: 'JWT Decoder',
          description: 'Securely decode JSON Web Tokens (JWT) locally in your browser. Inspect headers, payloads, and timestamps without exposing sensitive data.',
        })}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Secure <span className="text-primary-600">JWT</span> Decoder
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Inspect and debug JSON Web Tokens instantly. 100% browser-side decoding—your sensitive security tokens never leave your device.
          </p>
        </div>
        <JwtDecoder />
        <JwtDecoderContent />
      </div>
    </div>
  );
}
