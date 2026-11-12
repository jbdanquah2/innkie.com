import { JsonLd } from '@/components/JsonLd';
import { GuideCallout } from '@/components/GuideCallout';
import { RelatedTools } from '@/components/RelatedTools';
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb';
import { ToolFaqs, ToolSections } from '@/components/ToolSeoSections';
import { LinkShortener } from './LinkShortener';
import { LinkShortenerStatic } from './LinkShortenerStatic';
import { registrySchema, resolveToolPage } from '@/lib/tool-page';

const MAIN_INTRO =
  'Turn a long link into a short one you can share anywhere. Choose your own ending, and see where clicks come from with a free account.';

const FACTS = ['No sign-up needed', 'Custom endings', 'QR code included'];

export function LinkShortenerPage({ path }: { path: string }) {
  const p = resolveToolPage(path);
  const intro = p.alias ? p.intro : MAIN_INTRO;
  return (
    <div className="bg-white text-slate-900">
      <JsonLd schema={registrySchema(p, 'BusinessApplication')} />

      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 md:pt-14 md:pb-16"><div className="max-w-3xl">
          <ToolBreadcrumb name={p.heading} />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">{p.heading}</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">{intro}</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            {FACTS.map((f) => (
              <li key={f} className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs" aria-hidden="true" />{f}</li>
            ))}
          </ul>
          <div className="mt-8"><LinkShortener /></div>
        </div></div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-20">
        <ToolSections sections={p.sections} />
        <LinkShortenerStatic />
        <ToolFaqs faqs={p.faqs} title="URL shortener FAQ" />
        <div>
          <GuideCallout toolRoute="/tools/link-shortener" className="" />
          <RelatedTools category={p.tool.category} excludeId={p.tool.id} currentPath={path} />
        </div>
      </div>
    </div>
  );
}
