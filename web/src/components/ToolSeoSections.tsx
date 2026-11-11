import type { ToolContentSection, ToolFaq } from '@/lib/config/tool-registry';

/** Registry-driven "feature sections" + FAQ block (server-rendered, crawlable). */
type Accent = 'blue' | 'rose' | 'primary';
const ICON: Record<Accent, string> = { blue: 'bg-blue-50 text-blue-600', rose: 'bg-rose-50 text-rose-600', primary: 'bg-primary-50 text-primary-600' };

export function ToolSections({ sections = [], accent = 'blue', defaultIcon = 'fas fa-image', variant = 'card' }: { sections?: ToolContentSection[]; accent?: Accent; defaultIcon?: string; variant?: 'card' | 'badge' }) {
  const icon = ICON[accent];
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">{section.title}</h2>
            {section.description && <p className="text-slate-500 font-medium leading-relaxed">{section.description}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {section.items.map((item) =>
              variant === 'badge' ? (
                <div key={item.title} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center absolute -top-5 left-8 shadow-lg shadow-primary-200"><i className={item.icon || defaultIcon} /></div>
                  <h4 className="font-black text-slate-900 mb-2 mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>
                </div>
              ) : (
              <div key={item.title} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className={`w-12 h-12 ${icon} rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm`}>
                  <i className={item.icon || defaultIcon} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.description}</p>
              </div>
              ),
            )}
          </div>
        </section>
      ))}
    </>
  );
}

export function ToolFaqs({ faqs = [], className = '', title = 'Frequently Asked Questions' }: { faqs?: ToolFaq[]; className?: string; title?: string }) {
  if (!faqs.length) return null;
  return (
        <section className={`max-w-4xl mx-auto space-y-12 ${className}`}>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-2">
                <h4 className="font-black text-slate-800 text-sm">{faq.question}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
  );
}

/** Wrapper used by pages whose SEO block is entirely registry-driven. */
export function ToolSeoSections({ sections = [], faqs = [], accent = 'blue' }: { sections?: ToolContentSection[]; faqs?: ToolFaq[]; accent?: Accent }) {
  return (
    <div className="mt-32 space-y-24">
      <ToolSections sections={sections} accent={accent} />
      <ToolFaqs faqs={faqs} />
    </div>
  );
}
