import { JsonLd } from '@/components/JsonLd';
import { GuideCallout } from '@/components/GuideCallout';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolArticle } from '@/components/ToolArticle';
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { TOOL_ARTICLES } from '@/lib/config/tool-articles';
import { TOOL_CONTENT } from '@/lib/config/tool-content';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

/**
 * The one layout every tool page uses: breadcrumb and plain heading, the working tool first, then the
 * explanation (sections, article, FAQ), the related guide and related tools. Text is left-aligned on one edge.
 */
export function ToolPageLayout({ path, children, appCategory = 'UtilityApplication' }: { path: string; children: React.ReactNode; appCategory?: string }) {
  const p = resolveToolPage(path);
  const content = TOOL_CONTENT[p.tool.id];
  const intro = p.alias ? p.intro : content?.intro ?? p.intro;
  // A tool with its own article does not also show the registry's older feature cards, which could contradict it.
  const sections = p.alias ? p.sections : TOOL_ARTICLES[p.tool.id] ? [] : p.tool.sections ?? [];
  return (
    <div className="bg-white text-slate-900">
      <JsonLd schema={registrySchema(p, appCategory)} />

      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 md:pt-14 md:pb-16">
          <div className="max-w-3xl mb-8">
            <ToolBreadcrumb name={p.heading} />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">{p.heading}</h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">{intro}</p>
            {!p.alias && content?.facts && (
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                {content.facts.map((f) => (
                  <li key={f} className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs" aria-hidden="true" />{f}</li>
                ))}
              </ul>
            )}
          </div>
          {children}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-20">
        <ToolSections sections={sections} />
        {!p.alias && <ToolArticle toolId={p.tool.id} />}
        <ToolFaqs faqs={p.faqs} />
        <div>
          <GuideCallout toolRoute={p.tool.route} className="" />
          <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={p.path} />
        </div>
      </div>
    </div>
  );
}
