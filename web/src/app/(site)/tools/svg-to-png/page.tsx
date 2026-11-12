import { JsonLd } from '@/components/JsonLd';
import { ToolArticle } from '@/components/ToolArticle';
import { SvgToPng } from '@/components/tools/SvgToPng';
import { SvgToPngContent } from '@/components/tools/SvgToPngContent';
import { registryMetadata, registrySchema, resolveToolPage } from '@/lib/tool-page';

const p = resolveToolPage('/tools/svg-to-png');
export const metadata = registryMetadata(p);

export default function SvgToPngPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">{p.tool.name}</h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">{p.tool.description}</p>
        </div>
        <SvgToPng />
        <SvgToPngContent toolId={p.tool.id} />
        <ToolArticle toolId={p.tool.id} />
      </div>
    </div>
  );
}
