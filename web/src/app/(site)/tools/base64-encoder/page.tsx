import { JsonLd } from '@/components/JsonLd';
import { Base64Encoder } from '@/components/tools/Base64Encoder';
import { Base64EncoderContent } from '@/components/tools/Base64EncoderContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Base64 Encoder & Decoder',
  description: 'Encode and decode Base64 strings securely in your browser. 100% client-side processing ensures your sensitive data is never sent to a server.',
  path: '/tools/base64-encoder',
});

export default function Base64EncoderPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd
        schema={buildToolSchema({
          route: '/tools/base64-encoder',
          appName: 'iNNkie Base64 Encoder & Decoder',
          crumb: 'Base64 Encoder',
          description: 'Securely encode and decode Base64 data locally in your browser. Supports UTF-8 strings and special characters with 100% privacy.',
        })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Base64 <span className="text-primary-600">Encoder</span> &amp; Decoder
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Fast, secure, and bidirectional Base64 transformation. 100% browser-side processing ensures your sensitive data never leaves your machine.
          </p>
        </div>
        <Base64Encoder />
        <Base64EncoderContent />
      </div>
    </div>
  );
}
