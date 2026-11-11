import { JsonLd } from '@/components/JsonLd';
import { DataConverter } from '@/components/tools/DataConverter';
import { DataConverterContent } from '@/components/tools/DataConverterContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

const description =
  'Instantly convert CSV files to JSON and JSON to CSV in your browser. 100% private, client-side data transformation utility for developers and marketers.';

export const metadata = buildMetadata({ title: 'CSV to JSON Converter', description, path: '/tools/csv-json-converter' });

export default function CsvJsonConverterPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={buildToolSchema({ route: '/tools/csv-json-converter', appName: 'iNNkie CSV to JSON Converter', crumb: 'CSV JSON Converter', description })} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            CSV <span className="text-primary-600">&lt;&gt;</span> JSON Converter
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Instantly transform spreadsheets into code and vice versa. 100% private browser-side conversion for secure data handling.
          </p>
        </div>
        <DataConverter />
        <DataConverterContent />
      </div>
    </div>
  );
}
