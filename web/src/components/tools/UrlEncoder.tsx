'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logToolUsage } from '@/lib/metrics';
import { areaCls, btnGhost, card, labelCls, Segmented, useCopy } from './ui';

type Mode = 'encode' | 'decode';
type Scope = 'component' | 'full';

export function transform(input: string, mode: Mode, scope: Scope): { output: string; error: string | null } {
  if (!input) return { output: '', error: null };
  try {
    if (mode === 'encode') return { output: scope === 'component' ? encodeURIComponent(input) : encodeURI(input), error: null };
    // "+" means space only in form encoding; keep it literal so URLs round-trip.
    return { output: scope === 'component' ? decodeURIComponent(input) : decodeURI(input), error: null };
  } catch {
    return { output: '', error: 'Malformed input: contains an invalid percent-encoded sequence (for example a stray "%").' };
  }
}

export function UrlEncoder() {
  const copy = useCopy();
  const [mode, setMode] = useState<Mode>('encode');
  const [scope, setScope] = useState<Scope>('component');
  const [input, setInput] = useState('');
  const { output, error } = useMemo(() => transform(input, mode, scope), [input, mode, scope]);

  const logged = useRef('');
  useEffect(() => {
    if (!output) return;
    const key = `${mode}:${scope}:${input}`;
    if (logged.current === key) return;
    logged.current = key;
    void logToolUsage('url_encoder', mode);
  }, [output, mode, scope, input]);

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-6">
          <div><span className={labelCls}>Mode</span><Segmented value={mode} onChange={setMode} options={[{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }]} /></div>
          <div><span className={labelCls}>Scope</span><Segmented value={scope} onChange={setScope} options={[{ id: 'component', label: 'Component' }, { id: 'full', label: 'Full URL' }]} /></div>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnGhost} onClick={() => setInput(mode === 'encode' ? 'https://example.com/search?q=hello world&lang=fr&tag=café & crème' : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26tag%3Dcaf%C3%A9')}>Load sample</button>
          <button type="button" className={btnGhost} onClick={() => setInput('')} disabled={!input}>Clear</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="url-in" className={labelCls}>{mode === 'encode' ? 'Text or URL to encode' : 'Encoded text to decode'}</label>
          <textarea id="url-in" rows={9} value={input} onChange={(e) => setInput(e.target.value)} className={areaCls} placeholder={mode === 'encode' ? 'Paste text or a URL…' : 'Paste a percent-encoded string…'} />
        </div>
        <div>
          <div className="flex items-center justify-between"><label htmlFor="url-out" className={labelCls}>Result</label>
            <button type="button" className="text-[10px] font-black text-primary-600 uppercase tracking-widest disabled:opacity-30 mb-2" disabled={!output} onClick={() => copy(output, 'Result copied!')}><i className="far fa-copy mr-1" /> Copy</button>
          </div>
          <textarea id="url-out" rows={9} readOnly value={output} className={areaCls} placeholder="Result appears here…" />
          {error && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
        </div>
      </div>
      <p className="mt-5 text-[11px] text-slate-400 font-medium leading-relaxed">
        <strong>Component</strong> escapes everything except letters, digits and <code>- _ . ! ~ * ' ( )</code> (use it for a single query value). <strong>Full URL</strong> keeps <code>: / ? # &amp; =</code> so a whole address stays valid.
      </p>
    </div>
  );
}
