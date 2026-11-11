import { JsonLd } from '@/components/JsonLd';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { ImageResizer } from './ImageResizer';
import { ImageResizerStatic } from './ImageResizerStatic';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

export function ImageResizerPage({ path }: { path: string }) {
  const p = resolveToolPage(path);
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p, 'MultimediaApplication')} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{p.heading}</h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">{p.intro}</p>
        </div>
        <ImageResizer />
        <div className="mt-32 space-y-24">
          <ToolSections sections={p.sections} defaultIcon="fas fa-expand" />
          <ImageResizerStatic />
          <ToolFaqs faqs={p.faqs} className="pb-20" />
        </div>
        <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={path} />
      </div>
    </div>
  );
}
