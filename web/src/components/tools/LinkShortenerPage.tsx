import { JsonLd } from '@/components/JsonLd';
import { GuideCallout } from '@/components/GuideCallout';
import { Logo } from '@/components/Logo';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { LinkShortener } from './LinkShortener';
import { LinkShortenerStatic } from './LinkShortenerStatic';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

export function LinkShortenerPage({ path }: { path: string }) {
  const p = resolveToolPage(path);
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <JsonLd schema={registrySchema(p, 'BusinessApplication')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-10 animate-fade-in flex justify-center"><Logo size="120px" /></div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[0.9]">
            {p.heading}. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-blue-500">Track smarter.</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">{p.intro}</p>
        </div>

        <LinkShortener />
        <GuideCallout toolRoute="/tools/link-shortener" />
        <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={path} />

        <div className="mt-32 space-y-24">
          <ToolSections sections={p.sections} accent="primary" defaultIcon="fas fa-link" />
          <LinkShortenerStatic />
          <ToolFaqs faqs={p.faqs} title="Shortener FAQ" className="pb-20" />
        </div>
      </div>
    </div>
  );
}
