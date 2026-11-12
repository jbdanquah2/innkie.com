'use client';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { downloadBlob } from '@/lib/files';
import { findJsonProblem, formatJsonText, jsonToTypeScript, minifyJsonText, unsafeIntegers } from '@/lib/json-format';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

const SAMPLE = JSON.stringify(
  {
    user: { id: 'usr_88231', 'display-name': 'Alex Developer', roles: ['admin', 'editor'], verified: true },
    settings: { theme: 'dark', notifications: { email: true, push: false, frequency: 'daily' } },
    stats: { loginCount: 42, lastActive: '2026-05-06T12:00:00Z', score: 9.5, referrer: null },
  },
);

type Indent = '2' | '4' | 'tab';
const INDENTS: { id: Indent; label: string; value: string }[] = [
  { id: '2', label: '2 spaces', value: '  ' },
  { id: '4', label: '4 spaces', value: '    ' },
  { id: 'tab', label: 'Tab', value: '\t' },
];

function deepSort(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSort);
  return Object.keys(obj as object).sort().reduce((res: Record<string, unknown>, k) => ((res[k] = deepSort((obj as Record<string, unknown>)[k])), res), {});
}

function computeStats(data: unknown) {
  let count = 0;
  let depth = 0;
  const walk = (o: unknown, d: number) => {
    count++;
    depth = Math.max(depth, d);
    if (o !== null && typeof o === 'object') Object.values(o as object).forEach((v) => walk(v, d + 1));
  };
  walk(data, 1);
  const type = data === null ? 'null' : Array.isArray(data) ? 'Array' : typeof data === 'object' ? 'Object' : typeof data;
  return { nodeCount: count, maxDepth: depth, dataType: type.charAt(0).toUpperCase() + type.slice(1) };
}

const TOKEN_RE = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<Fragment key={`t${i}`}>{json.slice(last, idx)}</Fragment>);
    const tok = m[0];
    let cls = 'text-amber-300';
    if (tok.startsWith('"')) cls = /:$/.test(tok) ? 'text-indigo-300 font-semibold' : 'text-emerald-300';
    else if (/true|false/.test(tok)) cls = 'text-rose-300';
    else if (/null/.test(tok)) cls = 'text-slate-400 italic';
    out.push(<span key={`s${i++}`} className={cls}>{tok}</span>);
    last = idx + tok.length;
  }
  if (last < json.length) out.push(<Fragment key="end">{json.slice(last)}</Fragment>);
  return out;
}

function TreeNode({ k, value, depth, openDepth }: { k?: string; value: unknown; depth: number; openDepth: number }) {
  const [expanded, setExpanded] = useState(depth < openDepth);
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const expandable = type === 'object' || type === 'array';
  const children = type === 'object'
    ? Object.keys(value as object).map((key) => ({ key, value: (value as Record<string, unknown>)[key] }))
    : type === 'array'
      ? (value as unknown[]).map((v, i) => ({ key: String(i), value: v }))
      : [];

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-2 py-0.5">
        {expandable ? (
          <button type="button" aria-expanded={expanded} aria-label={expanded ? 'Collapse' : 'Expand'} onClick={() => setExpanded((e) => !e)} className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white">
            <i className={`fas ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px]`} aria-hidden="true" />
          </button>
        ) : (
          <span className="w-4" />
        )}
        {k !== undefined && <span className="text-indigo-300 font-semibold">&quot;{k}&quot;:</span>}
        {type === 'string' && <span className="text-emerald-300 break-all">&quot;{String(value)}&quot;</span>}
        {type === 'number' && <span className="text-amber-300">{String(value)}</span>}
        {type === 'boolean' && <span className="text-rose-300">{String(value)}</span>}
        {type === 'null' && <span className="text-slate-400 italic">null</span>}
        {type === 'object' && (
          <span className="text-slate-300 text-xs">
            {expanded ? '{' : '{ … }'}
            {!expanded && <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{children.length} keys</span>}
          </span>
        )}
        {type === 'array' && (
          <span className="text-slate-300 text-xs">
            {expanded ? '[' : '[ … ]'}
            {!expanded && <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{children.length} items</span>}
          </span>
        )}
      </div>
      {expandable && expanded && (
        <div className="ml-6 border-l border-white/10 pl-4">
          {children.map((c) => <TreeNode key={c.key} k={c.key} value={c.value} depth={depth + 1} openDepth={openDepth} />)}
          <div className="text-slate-400 text-xs opacity-60">{type === 'object' ? '}' : ']'}</div>
        </div>
      )}
    </div>
  );
}

const btn = 'px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export function JsonFormatter() {
  const toast = useToast();
  const [input, setInput] = useState(SAMPLE);
  const [view, setView] = useState<'code' | 'tree'>('code');
  const [indent, setIndent] = useState<Indent>('2');
  const indentStr = INDENTS.find((i) => i.id === indent)!.value;
  const trapTab = useRef(true);

  const analysis = useMemo(() => {
    if (!input.trim()) return { state: 'empty' as const };
    const problem = findJsonProblem(input);
    if (problem) return { state: 'invalid' as const, problem };
    let data: unknown = null;
    try { data = JSON.parse(input); } catch { /* the validator already accepted it */ }
    return { state: 'valid' as const, data, unsafe: unsafeIntegers(input) };
  }, [input]);

  const valid = analysis.state === 'valid';
  const formatted = useMemo(() => (valid ? formatJsonText(input, indentStr) : ''), [valid, input, indentStr]);
  const stats = valid ? computeStats(analysis.data) : { nodeCount: 0, maxDepth: 0, dataType: analysis.state === 'invalid' ? 'Invalid' : 'None' };
  const unsafe = valid ? analysis.unsafe : [];
  const bytes = new Blob([input]).size;

  // Metrics: at most once every 3 seconds while typing.
  const lastLog = useRef(0);
  useEffect(() => {
    if (!formatted) return;
    const now = Date.now();
    if (now - lastLog.current < 3000) return;
    lastLog.current = now;
    void logToolUsage('json_formatter', 'process');
  }, [formatted]);

  const format = () => {
    if (!valid) return toast.error('Fix the error first');
    setInput(formatJsonText(input, indentStr));
    toast.success('Formatted');
  };
  const minify = () => {
    if (!valid) return toast.error('Fix the error first');
    setInput(minifyJsonText(input));
    toast.success('Minified');
  };
  const sortKeys = () => {
    if (!valid) return;
    setInput(JSON.stringify(deepSort(analysis.data), null, indentStr));
    toast.success('Keys sorted alphabetically');
  };
  const copy = async (text: string, msg: string) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Could not copy'); }
  };
  const download = () => {
    if (!formatted) return;
    downloadBlob(new Blob([formatted], { type: 'application/json' }), `data-${Date.now()}.json`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { trapTab.current = false; return; } // let keyboard users Tab out
    if (e.key !== 'Tab' || !trapTab.current || e.shiftKey) return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    setInput(input.slice(0, s) + '  ' + input.slice(en));
    requestAnimationFrame(() => (ta.selectionStart = ta.selectionEnd = s + 2));
  };

  // Pasting minified JSON formats it, without changing any value.
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text || text.includes('\n') || !/^[{[]/.test(text.trim()) || findJsonProblem(text)) return;
    e.preventDefault();
    const ta = e.currentTarget;
    setInput(input.slice(0, ta.selectionStart) + formatJsonText(text, indentStr) + input.slice(ta.selectionEnd));
    toast.success('Formatted the pasted JSON');
  };

  const problem = analysis.state === 'invalid' ? analysis.problem : null;
  const caret = problem ? `${' '.repeat(Math.max(0, problem.column - 1))}^` : '';
  const largeTree = stats.nodeCount > 400;

  const stat = (name: string, value: ReactNode) => (
    <div>
      <p className="text-xs text-slate-500">{name}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {stat('Type', stats.dataType)}
            {stat('Nodes', stats.nodeCount)}
            {stat('Depth', stats.maxDepth)}
            {stat('Size', `${bytes.toLocaleString('en-US')} bytes`)}
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className={`text-sm font-semibold ${problem ? 'text-rose-700' : valid ? 'text-emerald-700' : 'text-slate-500'}`} role="status">
                {problem ? 'Invalid JSON' : valid ? 'Valid JSON' : 'Waiting for input'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="json-indent" className="sr-only">Indentation</label>
            <select id="json-indent" value={indent} onChange={(e) => setIndent(e.target.value as Indent)} className={`${btn} pr-8`}>
              {INDENTS.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
            <button type="button" onClick={sortKeys} disabled={!valid || unsafe.length > 0} title={unsafe.length ? 'Sorting would round the large numbers in this document' : undefined} className={btn}>Sort keys</button>
            <button type="button" onClick={() => copy(jsonToTypeScript(analysis.state === 'valid' ? analysis.data : null, 'Root', indentStr), 'TypeScript interface copied')} disabled={!valid} className={btn}>Copy as TypeScript</button>
          </div>
        </div>
        {unsafe.length > 0 && (
          <p role="note" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {unsafe.length === 1 ? 'One number' : `${unsafe.length} numbers`} in this JSON (such as <span className="font-mono">{unsafe[0]}</span>) {unsafe.length === 1 ? 'is' : 'are'} too large for JavaScript to hold exactly.
            Format and Minify keep {unsafe.length === 1 ? 'it' : 'them'} exactly as written; the tree and TypeScript views treat {unsafe.length === 1 ? 'it' : 'them'} as approximate numbers.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:h-[640px]">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[380px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Input</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setInput(SAMPLE)} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">Sample</button>
              <button type="button" onClick={format} className="text-sm font-semibold text-primary-700 hover:underline">Format</button>
              <button type="button" onClick={minify} className="text-sm font-medium text-slate-700 hover:underline">Minify</button>
              <button type="button" onClick={() => setInput('')} className="text-sm font-medium text-rose-700 hover:underline">Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { trapTab.current = true; }}
            onPaste={onPaste}
            aria-label="JSON input"
            aria-invalid={!!problem}
            spellCheck={false}
            placeholder="Paste your JSON here"
            className="flex-1 w-full p-4 font-mono text-sm text-slate-800 bg-white outline-none resize-none leading-relaxed"
          />
          <p className="px-4 py-2 border-t border-slate-100 text-xs text-slate-500">Tab indents. Press Esc, then Tab, to move to the next control.</p>
        </div>

        <div className="flex flex-col rounded-xl bg-slate-900 overflow-hidden min-h-[380px] relative">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <div role="tablist" aria-label="Output view" className="flex p-1 bg-white/10 rounded-lg">
              {(['code', 'tree'] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === v ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`}>
                  {v === 'code' ? 'Formatted' : 'Tree'}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => copy(formatted, 'Copied')} disabled={!formatted} className="text-sm font-medium text-slate-200 hover:text-white disabled:opacity-40">Copy</button>
              <button type="button" onClick={download} disabled={!formatted} className="text-sm font-medium text-slate-200 hover:text-white disabled:opacity-40">Download</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {view === 'code' ? (
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-200" style={{ tabSize: 4 }}>
                {formatted ? highlight(formatted) : <span className="text-slate-500">Formatted output appears here.</span>}
              </div>
            ) : valid ? (
              <>
                {largeTree && <p className="mb-3 text-xs text-slate-400">Large document: the tree starts collapsed below the first level.</p>}
                <TreeNode value={analysis.data} depth={0} openDepth={largeTree ? 1 : 99} />
              </>
            ) : (
              <span className="font-mono text-sm text-slate-500">Paste valid JSON to explore it as a tree.</span>
            )}
          </div>

          {problem && (
            <div role="alert" className="m-3 rounded-lg border border-rose-400/40 bg-rose-950/80 p-4 text-sm">
              <p className="font-semibold text-rose-200">Line {problem.line}, column {problem.column}</p>
              <p className="mt-1 text-rose-100">{problem.message}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2 font-mono text-xs text-rose-100">{problem.excerpt.slice(0, 160)}{'\n'}{caret}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
