'use client';
import { useMemo, useRef, useState } from 'react';
import { analyze, formatDuration, LIMITS, smsInfo, tidy } from '@/lib/text-stats';
import { useCopy } from './ui';

const SAMPLE =
  'Counting words should be effortless. Paste an essay, an email or a product description and the numbers update as you type. Nothing leaves your browser.\n\nUse the keyword list to spot words you repeat, and the reading time to size your post.';

const card = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5';
const field = 'block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const small = 'px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-500 transition-colors disabled:opacity-40';

const SPEEDS = [
  { wpm: 150, label: 'Slow (150 wpm)' },
  { wpm: 200, label: 'Average (200 wpm)' },
  { wpm: 250, label: 'Fast (250 wpm)' },
  { wpm: 300, label: 'Skimming (300 wpm)' },
];

export function WordCounter() {
  const copy = useCopy();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const [wpm, setWpm] = useState(200);

  const selected = sel[1] > sel[0] ? text.slice(sel[0], sel[1]) : '';
  const scoped = selected.trim() ? selected : text;
  const a = useMemo(() => analyze(scoped, wpm), [scoped, wpm]);
  const whole = useMemo(() => (scoped === text ? a : analyze(text, wpm)), [scoped, text, a, wpm]);
  const sms = useMemo(() => smsInfo(text), [text]);

  const set = (v: string) => { setText(v); setSel([0, 0]); };
  const update = (v: string) => set(v);
  const readSel = () => { const el = ref.current; if (el) setSel([el.selectionStart, el.selectionEnd]); };

  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dd className="text-2xl font-semibold text-slate-900 tabular-nums">{typeof value === 'number' ? value.toLocaleString('en-US') : value}</dd>
      <dt className="text-xs text-slate-500 mt-0.5">{label}</dt>
    </div>
  );

  return (
    <div className="space-y-4">
      <section className={card} aria-label="Your text">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label htmlFor="wc-in" className="text-sm font-medium text-slate-700">Your text</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={small} onClick={() => update(SAMPLE)}>Load sample</button>
            <button type="button" className={small} onClick={() => copy(text, 'Text copied')} disabled={!text}>Copy text</button>
            <button type="button" className={small} onClick={() => { set(''); ref.current?.focus(); }} disabled={!text}>Clear</button>
          </div>
        </div>
        <textarea
          id="wc-in"
          ref={ref}
          rows={11}
          value={text}
          spellCheck
          onChange={(e) => update(e.target.value)}
          onSelect={readSel}
          onKeyUp={readSel}
          onMouseUp={readSel}
          className={`${field} w-full resize-y leading-relaxed`}
          placeholder="Type or paste your text here. Select part of it to count just that part."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Tidy up:</span>
          <button type="button" className={small} disabled={!text} onClick={() => set(tidy.extraSpaces(text))}>Remove extra spaces</button>
          <button type="button" className={small} disabled={!text} onClick={() => set(tidy.emptyLines(text))}>Remove empty lines</button>
          <button type="button" className={small} disabled={!text} onClick={() => set(tidy.sentenceCase(text))}>Sentence case</button>
          <button type="button" className={small} disabled={!text} onClick={() => set(tidy.upper(text))}>UPPERCASE</button>
          <button type="button" className={small} disabled={!text} onClick={() => set(tidy.lower(text))}>lowercase</button>
        </div>
      </section>

      <section className={card} aria-label="Counts">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-slate-900">{selected.trim() ? 'Counts for your selection' : 'Counts'}</h2>
          {selected.trim() && <p className="text-sm text-slate-500">{whole.words.toLocaleString('en-US')} words in the whole text</p>}
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-live="polite">
          {stat('Words', a.words)}
          {stat('Characters', a.chars)}
          {stat('Characters, no spaces', a.noSpaces)}
          {stat('Sentences', a.sentences)}
          {stat('Paragraphs', a.paragraphs)}
          {stat('Lines', a.lines)}
          {stat('Unique words', a.unique)}
          {stat('Average word length', a.avgWordLength ? `${a.avgWordLength} letters` : '0')}
        </dl>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 items-end">
          <div className="rounded-lg border border-slate-200 px-3 py-3">
            <p className="text-sm text-slate-500">Reading time</p>
            <p className="text-lg font-semibold text-slate-900 tabular-nums">{formatDuration(a.read)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 px-3 py-3">
            <p className="text-sm text-slate-500">Speaking time (130 wpm)</p>
            <p className="text-lg font-semibold text-slate-900 tabular-nums">{formatDuration(a.speak)}</p>
          </div>
          <div>
            <label htmlFor="wc-speed" className="block text-sm text-slate-500 mb-1">Reading speed</label>
            <select id="wc-speed" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className={`${field} w-full`}>
              {SPEEDS.map((s) => <option key={s.wpm} value={s.wpm}>{s.label}</option>)}
            </select>
          </div>
        </div>
        {a.sentences > 0 && <p className="mt-3 text-sm text-slate-500">Average sentence: {a.avgSentenceWords} words.</p>}
      </section>

      {a.top.length > 0 && (
        <section className={card} aria-label="Most used words">
          <h2 className="font-semibold text-slate-900">Most used words</h2>
          <p className="mt-1 text-sm text-slate-600">Common words such as &ldquo;the&rdquo; and &ldquo;and&rdquo; are left out.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {a.top.map(([w, n]) => (
              <li key={w} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800">{w} <span className="text-slate-500 tabular-nums">× {n}</span></li>
            ))}
          </ul>
        </section>
      )}

      <section className={card} aria-label="Length limits">
        <h2 className="font-semibold text-slate-900">Length limits</h2>
        <p className="mt-1 text-sm text-slate-600">How your whole text compares with common limits. Platforms may count links and emoji differently, so check the final text in the app itself.</p>
        <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          {LIMITS.map((l) => {
            const used = whole.chars;
            const over = used > l.max;
            return (
              <li key={l.id} className="py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-800">{l.label}</span>
                  <span className={`tabular-nums ${over ? 'text-rose-700 font-medium' : 'text-slate-600'}`}>
                    {used.toLocaleString('en-US')} / {l.max.toLocaleString('en-US')}
                    {over ? ` (${(used - l.max).toLocaleString('en-US')} over)` : used ? ` (${(l.max - used).toLocaleString('en-US')} left)` : ''}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                  <div className={`h-full ${over ? 'bg-rose-500' : 'bg-primary-600'}`} style={{ width: `${Math.min(100, (used / l.max) * 100)}%` }} />
                </div>
                {l.note && <p className="mt-1 text-xs text-slate-500">{l.note}</p>}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 text-sm text-slate-700" role="status">
          <span className="font-medium text-slate-900">Text messages: </span>
          {sms.segments === 0
            ? 'type something to see how many messages it needs.'
            : `${sms.segments} message${sms.segments === 1 ? '' : 's'} (${sms.encoding}: ${sms.units.toLocaleString('en-US')} characters, ${sms.perSegment} fit in each message${sms.segments > 1 ? ' once split' : ''}).`}
          {sms.encoding === 'UCS-2' && sms.segments > 0 && <span className="block text-xs text-slate-500 mt-1">An emoji or an unusual letter switches the whole message to a format that fits only 70 characters.</span>}
        </div>
      </section>
    </div>
  );
}
