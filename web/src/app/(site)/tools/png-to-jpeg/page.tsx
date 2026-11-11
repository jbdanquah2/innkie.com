import { JsonLd } from '@/components/JsonLd';
import { PngToJpeg } from '@/components/tools/PngToJpeg';
import { PngToJpegContent } from '@/components/tools/PngToJpegContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

const description =
  'Professional batch PNG to JPEG converter. Visual comparison tool, smart renaming, and instant ZIP downloads. No file uploads, 100% private in-browser processing.';

export const metadata = buildMetadata({ title: 'PNG to JPEG Converter', description, path: '/tools/png-to-jpeg' });

export default function PngToJpegPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={buildToolSchema({ route: '/tools/png-to-jpeg', appName: 'iNNkie PNG to JPEG Converter', crumb: 'PNG to JPEG', description, category: 'UtilityApplication' })} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            PNG to <span className="text-primary-600">JPEG</span> Pro
          </h1>
          <p className="text-slate-600 font-medium max-w-xl mx-auto">Professional batch conversion with visual inspection and smart renaming.</p>
        </div>
        <PngToJpeg />
        <PngToJpegContent />
      </div>
    </div>
  );
}
