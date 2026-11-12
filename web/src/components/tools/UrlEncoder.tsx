'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { decodeText, encodeText, parseUrl, type Scope } from '@/lib/url-encode';
import { logToolUsage } from '@/lib/metrics';
import { useCopy } from './ui';

type Mode = 'encode' | 'decode';

const SAMPLE_ENCODE = 'https://example.com/search?q=hello world&lang=fr&tag=café & crème';
const SAMPLE_DECODE = 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26tag%3Dcaf%C3%A9%20%26%20cr%C3%A8me';

const field = 'block w-full p-4 font-mono text-sm text-slate-800 bg-white outline-none resize-none leading-relaxed';
const check = 'h-4 w-4 rounded border-slate-300 accent-primary-600';

export function UrlEncoder() {
  const copy = useCopy();
  const [mode, setMode] = useState<Mode>('encode');
  const [scope, setScope] = useState<Scope>('component');
  const [strict, setStrict] = useState(false);
  const [plus, setPlus] = useState(false);
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    if (!input) return { output: '', error: null as string | null, problems: [] as ReturnType<typeof decodeText>['problems'], doubleEncoded: false };
    if (mode === 'encode') {
      const r = encodeText(input, { scope, strict, spaceAsPlus: plus });
      return { output: r.output, error: r.error, problems: [], doubleEncoded: false };
    }
    const r = decodeText(input, { scope, plusAsSpace: plus });
    return { output: r.output, error: null, problems: r.problems, doubleEncoded: r.doubleEncoded };
  }, [input, mode, scope, strict, plus]);

  const url = useMemo(() => parseUrl(mode === 'encode' ? input : result.output), [mode, input, result.output]);

  const logged = useRef('');
  useEffect(() => {
    if (!result.output) return;
    const key = `${mode}:${scope}:${input}`;
    if (logged.current === key) return;
    logged.current = key;
    void logToolUsage('url_encoder', mode);
  }, [result.output, mode, scope, input]);

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setInput(''); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
  );
  const scopeBtn = (s: Scope, label: string) => (
    <button type="button" aria-pressed={scope === s} onClick={() => setScope(s)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${scope === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Direction</p>
            <div role="tablist" aria-label="Direction" className="flex p-1 rounded-lg bg-slate-100 w-fit">{tab('encode', 'Encode')}{tab('decode', 'Decode')}</div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Treat the text as</p>
            <div role="group" aria-label="Scope" className="flex p-1 rounded-lg bg-slate-100 w-fit">{scopeBtn('component', 'One value')}{scopeBtn('full', 'A whole URL')}</div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pb-2">
            {mode === 'encode' && scope === 'component' && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} className={check} />Also escape ! &apos; ( ) *</label>}
            {scope === 'component' && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={plus} onChange={(e) => setPlus(e.target.checked)} className={check} />{mode === 'encode' ? 'Write spaces as +' : 'Read + as a space'}</label>}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {scope === 'component'
            ? 'One value escapes everything except letters, digits and - _ . ~ ! * \' ( ): use it for a single query value or path segment.'
            : 'A whole URL keeps the characters that give it structure (: / ? # & =) and only escapes spaces and non-ASCII characters.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:h-[360px]">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[240px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900"><label htmlFor="url-in">{mode === 'encode' ? 'Text or URL to encode' : 'Encoded text to decode'}</label></h2>
            <div className="flex gap-4 text-sm">
              <button type="button" onClick={() => setInput(mode === 'encode' ? SAMPLE_ENCODE : SAMPLE_DECODE)} className="font-medium text-slate-600 hover:text-slate-900 hover:underline">Sample</button>
              <button type="button" onClick={() => setInput('')} disabled={!input} className="font-medium text-rose-700 hover:underline disabled:opacity-40">Clear</button>
            </div>
          </div>
          <textarea id="url-in" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder={mode === 'encode' ? 'Paste text or a URL' : 'Paste a percent-encoded string'} className={`flex-1 ${field}`} />
        </div>

        <div className="flex flex-col rounded-xl bg-slate-900 overflow-hidden min-h-[240px]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Result</h2>
            <button type="button" onClick={() => copy(result.output, 'Result copied')} disabled={!result.output} className="text-sm font-medium text-slate-200 hover:text-white disabled:opacity-40">Copy</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {result.error ? (
              <p role="alert" className="rounded-lg border border-rose-400/40 bg-rose-950/80 p-3 text-sm text-rose-100">{result.error}</p>
            ) : result.output ? (
              <pre className="font-mono text-sm leading-relaxed text-emerald-200 whitespace-pre-wrap break-all">{result.output}</pre>
            ) : (
              <p className="font-mono text-sm text-slate-500">The result appears here.</p>
            )}
          </div>
        </div>
      </div>

      {(result.problems.length > 0 || result.doubleEncoded) && (
        <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
          {result.problems.length > 0 && (
            <div>
              <p className="font-semibold">Decoded what it could. {result.problems.length === 1 ? 'One part was' : `${result.problems.length} parts were`} left as written:</p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {result.problems.slice(0, 6).map((p) => <li key={`${p.index}-${p.sequence}`}>Position {p.index + 1}: <span className="font-mono">{p.sequence}</span> is {p.reason}.</li>)}
                {result.problems.length > 6 && <li>and {result.problems.length - 6} more.</li>}
              </ul>
              <p className="mt-1 text-xs">Text that is not valid UTF-8 usually comes from an older system that used Latin-1 (for example %E9 for é).</p>
            </div>
          )}
          {result.doubleEncoded && (
            <p>
              The result still contains percent sequences, so this text was probably encoded twice.{' '}
              <button type="button" onClick={() => setInput(result.output)} className="font-semibold underline">Decode it again</button>
            </p>
          )}
        </div>
      )}

      {url && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="URL breakdown">
          <h2 className="font-semibold text-slate-900 mb-3">URL breakdown</h2>
          <dl className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 text-sm">
            {([['Scheme', url.scheme], ['Host', url.host], ['Port', url.port], ['User', url.username], ['Path', url.path], ['Fragment', url.hash]] as const).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-mono text-slate-900 break-all">{v}</dd></div>
            ))}
          </dl>
          {url.params.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b border-slate-300"><th scope="col" className="py-2 pr-4 font-semibold text-slate-900">Parameter</th><th scope="col" className="py-2 font-semibold text-slate-900">Value (decoded)</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {url.params.map((p, i) => <tr key={i}><td className="py-2 pr-4 font-mono text-slate-700 align-top">{p.key}</td><td className="py-2 font-mono text-slate-900 break-all">{p.value || <span className="text-slate-400">(empty)</span>}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
