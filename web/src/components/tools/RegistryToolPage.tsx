import { JsonLd } from '@/components/JsonLd';
import { GuideCallout } from '@/components/GuideCallout';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

/** Standard layout for registry-driven tools: heading + widget + feature sections + FAQ (+ FAQ JSON-LD) + related. */
export function RegistryToolPage({ path, children }: { path: string; children: React.ReactNode }) {
  const p = resolveToolPage(path);
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p, 'DeveloperApplication')} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{p.heading}</h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">{p.intro}</p>
        </div>
        {children}
        <div className="mt-32 space-y-24">
          <ToolSections sections={p.tool.sections} accent="primary" defaultIcon="fas fa-check" />
          <ToolFaqs faqs={p.faqs} />
        </div>
        <GuideCallout toolRoute={p.path} />
        <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={p.path} />
      </div>
    </div>
  );
}
