import { TOOL_ARTICLES } from '@/lib/config/tool-articles';

/** Long-form article under a tool. Renders nothing when the tool has no article. */
export function ToolArticle({ toolId }: { toolId: string }) {
  const sections = TOOL_ARTICLES[toolId];
  if (!sections?.length) return null;
  return (
    <article className="max-w-3xl mx-auto mt-24 space-y-10">
      {sections.map((s) => (
        <section key={s.heading} className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{s.heading}</h2>
          {s.paragraphs.map((t) => (
            <p key={t.slice(0, 40)} className="text-slate-600 font-medium leading-relaxed">{t}</p>
          ))}
          {s.bullets && (
            <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium leading-relaxed">
              {s.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
