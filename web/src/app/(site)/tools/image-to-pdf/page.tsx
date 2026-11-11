import { JsonLd } from '@/components/JsonLd';
import { ImageToPdf } from '@/components/tools/ImageToPdf';
import { ImageToPdfContent } from '@/components/tools/ImageToPdfContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Image to PDF Converter',
  description: 'Turn your photos into professional PDF documents instantly. 100% private, browser-side conversion for JPG, PNG, and WebP images. No uploads, no storage.',
  path: '/tools/image-to-pdf',
});

export default function ImageToPdfPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd
        schema={buildToolSchema({
          route: '/tools/image-to-pdf',
          appName: 'iNNkie Private Image to PDF Converter',
          crumb: 'Image to PDF',
          description: 'Securely combine multiple images into a single professional PDF document locally in your browser. No uploads required.',
          category: 'BusinessApplication',
        })}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Image to <span className="text-primary-600">PDF</span> Converter
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-lg">
            Combine multiple photos into a single professional PDF document. 100% private browser-side conversion.
          </p>
        </div>
        <ImageToPdf />
        <ImageToPdfContent />
      </div>
    </div>
  );
}
