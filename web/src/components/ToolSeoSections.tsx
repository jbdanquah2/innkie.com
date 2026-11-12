import type { ToolContentSection, ToolFaq } from '@/lib/config/tool-registry';

/** Registry-driven "feature sections" + FAQ block (server-rendered, crawlable). `accent`, `defaultIcon` and `variant` are kept for callers but no longer change the look. */
type Accent = 'blue' | 'rose' | 'primary';

export function ToolSections({ sections = [] }: { sections?: ToolContentSection[]; accent?: Accent; defaultIcon?: string; variant?: 'card' | 'badge' }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{section.title}</h2>
            {section.description && <p className="mt-3 text-slate-600 leading-relaxed">{section.description}</p>}
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
            {section.items.map((item) => (
              <div key={item.title} className="border-t border-slate-300 pt-4">
                <dt className="font-semibold text-slate-900">{item.title}</dt>
                <dd className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}

export function ToolFaqs({ faqs = [], className = '', title = 'Frequently asked questions' }: { faqs?: ToolFaq[]; className?: string; title?: string }) {
  if (!faqs.length) return null;
  return (
    <section className={`max-w-3xl ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6">{title}</h2>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {faqs.map((faq) => (
          <div key={faq.question} className="py-5">
            <h3 className="font-semibold text-slate-900">{faq.question}</h3>
            <p className="mt-2 text-slate-600 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Wrapper used by pages whose SEO block is entirely registry-driven. */
export function ToolSeoSections({ sections = [], faqs = [] }: { sections?: ToolContentSection[]; faqs?: ToolFaq[]; accent?: Accent }) {
  return (
    <div className="mt-24 space-y-20">
      <ToolSections sections={sections} />
      <ToolFaqs faqs={faqs} />
    </div>
  );
}
