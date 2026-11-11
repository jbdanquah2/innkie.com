'use client';
import { useMemo, useState } from 'react';
import { areaCls, btnGhost, card, labelCls } from './ui';

const STOP = new Set('a an and are as at be but by for from has have he her his i if in into is it its of on or our she so that the their them they this to was we were will with you your'.split(' '));

export function analyze(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const chars = [...text].length;
  const noSpaces = [...text.replace(/\s/g, '')].length;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split('\n').length : 0;
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (k.length > 2 && !STOP.has(k)) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  return { words: words.length, chars, noSpaces, sentences, paragraphs, lines, top, read: words.length / 200, speak: words.length / 130 };
}

const fmtTime = (mins: number) => {
  if (mins <= 0) return '0 sec';
  const s = Math.round(mins * 60);
  return s < 60 ? `${s} sec` : `${Math.floor(s / 60)} min ${s % 60 ? `${s % 60} sec` : ''}`.trim();
};

export function WordCounter() {
  const [text, setText] = useState('');
  const a = useMemo(() => analyze(text), [text]);
  const stat = (label: string, value: string | number) => (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
      <div className="text-2xl font-black text-slate-900 tabular-nums">{typeof value === 'number' ? value.toLocaleString('en-US') : value}</div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="wc-in" className={labelCls}>Your text</label>
        <div className="flex gap-2 mb-2">
          <button type="button" className={btnGhost} onClick={() => setText('Counting words should be effortless. Paste an essay, an email or a product description and see the numbers update as you type. Nothing leaves your browser.\n\nUse the keyword list to spot repeated words, and the reading time to size your post.')}>Load sample</button>
          <button type="button" className={btnGhost} onClick={() => setText('')} disabled={!text}>Clear</button>
        </div>
      </div>
      <textarea id="wc-in" rows={10} value={text} onChange={(e) => setText(e.target.value)} className={areaCls} placeholder="Type or paste your text here…" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6" aria-live="polite">
        {stat('Words', a.words)}{stat('Characters', a.chars)}{stat('No spaces', a.noSpaces)}{stat('Sentences', a.sentences)}
        {stat('Paragraphs', a.paragraphs)}{stat('Lines', a.lines)}{stat('Reading time', fmtTime(a.read))}{stat('Speaking time', fmtTime(a.speak))}
      </div>
      {a.top.length > 0 && (
        <div className="mt-6">
          <span className={labelCls}>Most used words</span>
          <div className="flex flex-wrap gap-2">
            {a.top.map(([w, n]) => <span key={w} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-bold">{w} <span className="opacity-60">×{n}</span></span>)}
          </div>
        </div>
      )}
    </div>
  );
}
