import { JsonLd } from '@/components/JsonLd';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { PdfToImage } from '@/components/tools/PdfToImage';
import { registryMetadata, registrySchema, resolveToolPage } from '@/lib/tool-page';

const p = resolveToolPage('/tools/pdf-to-image');
export const metadata = registryMetadata(p);

export default function PdfToImagePage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p, 'BusinessApplication')} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{p.tool.name}</h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed text-lg">{p.tool.description}</p>
        </div>
        <PdfToImage />
        <div className="mt-32 space-y-24">
          <ToolSections sections={p.tool.sections} variant="badge" />
          <ToolFaqs faqs={p.tool.faqs} className="pb-20" />
        </div>
        <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={p.path} />
      </div>
    </div>
  );
}
