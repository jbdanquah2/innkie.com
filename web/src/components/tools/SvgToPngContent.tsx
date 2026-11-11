import { RelatedTools } from '@/components/RelatedTools';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';

const USE_CASES = [['fa-mobile-alt', 'App Icons'], ['fa-bullhorn', 'Marketing'], ['fa-print', 'Print Ready'], ['fa-code', 'Dev Assets']];
const CHECKS = ['High-DPI support for retina displays', 'Local processing for 100% privacy', 'Support for complex paths and gradients'];

export function SvgToPngContent({ toolId }: { toolId: string }) {
  const tool = TOOL_REGISTRY.find((t) => t.id === toolId)!;
  return (
    <>
      <RelatedTools category={tool.category} excludeId={tool.id} currentPath={tool.route} />

      <div className="mt-32 space-y-24">
        {(tool.sections || []).map((section) => (
          <section key={section.title} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">{section.title}</h2>
              {section.description && <p className="text-slate-500 font-medium leading-relaxed">{section.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {section.items.map((item) => (
                <div key={item.title} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center absolute -top-5 left-8 shadow-lg shadow-primary-200"><i className={item.icon} /></div>
                  <h4 className="font-black text-slate-900 mb-2 mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">The ultimate vector-to-raster engine.</h2>
          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            SVGs (Scalable Vector Graphics) are perfect for design, but PNGs are often required for web optimization, social media, and presentations. Our converter ensures your graphics remain pixel-perfect even when upscaling to 8x resolution.
          </p>
        </section>

        <section className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 blur-[120px]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black tracking-tight leading-tight">Built for designers, <br /> made for developers.</h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">Whether you are building a website, creating a presentation, or designing a brand identity, our SVG tool fits perfectly into your workflow.</p>
              <ul className="space-y-4">
                {CHECKS.map((c) => <li key={c} className="flex items-center gap-3 text-sm font-bold"><i className="fas fa-check-circle text-emerald-500" /> {c}</li>)}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {USE_CASES.map(([icon, label]) => (
                <div key={label} className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center space-y-2">
                  <i className={`fas ${icon} text-2xl text-primary-400`} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto space-y-12 pb-20">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {(tool.faqs || []).map((faq) => (
              <div key={faq.question} className="space-y-2">
                <h4 className="font-black text-slate-800 text-sm">{faq.question}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
