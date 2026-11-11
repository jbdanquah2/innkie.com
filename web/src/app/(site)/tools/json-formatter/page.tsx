import { JsonLd } from '@/components/JsonLd';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { JsonFormatterContent } from '@/components/tools/JsonFormatterContent';
import { buildMetadata, buildToolSchema } from '@/lib/seo';

const description = 'Professional JSON utility for modern developers. Syntax highlighting, interactive tree view, and automated TypeScript interface generation.';

export const metadata = buildMetadata({ title: 'JSON Formatter & TS Generator', description, path: '/tools/json-formatter' });

const faq = {
  '@type': 'FAQPage',
  mainEntity: [
    ['Is my data secure?', 'Yes. JSON processing and formatting happen locally in your browser, and data is not sent to iNNkie servers.'],
    ['Can I format very large files?', 'The formatter is optimized for performance. Very large files depend on your browser memory, but common datasets are handled easily.'],
    ['What does Copy as TS do?', 'It analyzes your JSON structure and generates a matching TypeScript interface that you can paste into your code projects.'],
    ['How do I fix syntax errors?', 'The tool provides real-time error messages that identify the character or line causing invalid JSON.'],
  ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

export default function JsonFormatterPage() {
  const [app, crumbs] = buildToolSchema({ route: '/tools/json-formatter', appName: 'iNNkie JSON Formatter', crumb: 'JSON Formatter', description });
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={[app, faq, crumbs]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            JSON <span className="text-primary-600">Formatter</span>
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto">Interactive visual explorer and automated TypeScript generator for your data.</p>
        </div>
        <JsonFormatter />
        <JsonFormatterContent />
      </div>
    </div>
  );
}
