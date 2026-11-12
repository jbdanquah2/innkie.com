import { JsonLd } from '@/components/JsonLd';
import { GuideCallout } from '@/components/GuideCallout';
import { ToolArticle } from '@/components/ToolArticle';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolSeoSections } from '@/components/ToolSeoSections';
import { ImageCompressor } from './ImageCompressor';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

export function ImageCompressorPage({ path }: { path: string }) {
  const p = resolveToolPage(path);
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{p.heading}</h1>
          <p className="text-slate-600 font-medium max-w-2xl mx-auto">{p.intro}</p>
        </div>
        <ImageCompressor />
        {path === p.tool.route && <ToolArticle toolId={p.tool.id} />}
        <GuideCallout toolRoute="/tools/image-compressor" />
        <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={path} />
        <ToolSeoSections sections={p.sections} faqs={p.faqs} />
      </div>
    </div>
  );
}
