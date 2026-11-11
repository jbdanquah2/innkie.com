'use client';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

const DEFAULT_SAMPLE = JSON.stringify(
  {
    message: 'Welcome to JSON Formatter',
    version: '2.0.0',
    active: true,
    useful_features: ['Interactive Tree View', 'Syntax Highlighting', 'TypeScript Interface Generator'],
  },
  null,
  2,
);

const SAMPLE = JSON.stringify(
  {
    user: { id: 'usr_88231', profile: { name: 'Alex Developer', roles: ['admin', 'editor'], verified: true } },
    settings: { theme: 'dark', notifications: { email: true, push: false, frequency: 'daily' } },
    stats: { loginCount: 42, lastActive: '2026-05-06T12:00:00Z', score: 9.5 },
  },
  null,
  2,
);

function deepSort(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSort);
  return Object.keys(obj).sort().reduce((res: any, k) => ((res[k] = deepSort(obj[k])), res), {});
}

function jsonToTypeScript(obj: any, name: string): string {
  const gen = (val: any): string => {
    if (val === null) return 'any';
    if (Array.isArray(val)) return val.length === 0 ? 'any[]' : `${gen(val[0])}[]`;
    if (typeof val === 'object') {
      let res = '{\n';
      Object.keys(val).forEach((k) => (res += `  ${k}: ${gen(val[k])};\n`));
      return res + '}';
    }
    return typeof val;
  };
  return `export interface ${name} ${gen(obj)}`;
}

function computeStats(data: unknown) {
  let count = 0;
  let depth = 0;
  const walk = (o: any, d: number) => {
    count++;
    depth = Math.max(depth, d);
    if (o !== null && typeof o === 'object') Object.values(o).forEach((v) => walk(v, d + 1));
  };
  walk(data, 1);
  return { nodeCount: count, maxDepth: depth, dataType: Array.isArray(data) ? 'Array' : 'Object' };
}

// Same tokenizer as the Angular syntaxHighlight(), but emitting React nodes (no innerHTML).
const TOKEN_RE = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<Fragment key={`t${i}`}>{json.slice(last, idx)}</Fragment>);
    const tok = m[0];
    let cls = 'text-amber-500';
    if (tok.startsWith('"')) cls = /:$/.test(tok) ? 'text-indigo-400 font-bold' : 'text-emerald-400';
    else if (/true|false/.test(tok)) cls = 'text-rose-400';
    else if (/null/.test(tok)) cls = 'text-slate-500 italic';
    out.push(<span key={`s${i++}`} className={cls}>{tok}</span>);
    last = idx + tok.length;
  }
  if (last < json.length) out.push(<Fragment key="end">{json.slice(last)}</Fragment>);
  return out;
}

function TreeNode({ k, value }: { k?: string; value: any }) {
  const [expanded, setExpanded] = useState(true);
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const expandable = type === 'object' || type === 'array';
  const children = type === 'object' ? Object.keys(value).map((key) => ({ key, value: value[key] })) : type === 'array' ? value.map((v: any, i: number) => ({ key: String(i), value: v })) : [];

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-2 group py-0.5">
        {expandable ? (
          <button type="button" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={() => setExpanded((e) => !e)} className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors">
            <i className={`fas ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
          </button>
        ) : (
          <div className="w-4" />
        )}
        {k !== undefined && <span className="text-indigo-400 font-bold">&quot;{k}&quot;:</span>}
        {type === 'string' && <span className="text-emerald-400">&quot;{value}&quot;</span>}
        {type === 'number' && <span className="text-amber-500">{value}</span>}
        {type === 'boolean' && <span className="text-rose-400">{String(value)}</span>}
        {type === 'null' && <span className="text-slate-500 italic">null</span>}
        {type === 'object' && (
          <span className="text-slate-400 text-xs italic">
            {expanded ? '{' : '{ ... }'}
            {!expanded && <span className="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{children.length} keys</span>}
          </span>
        )}
        {type === 'array' && (
          <span className="text-slate-400 text-xs italic">
            {expanded ? '[' : '[ ... ]'}
            {!expanded && <span className="ml-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{children.length} items</span>}
          </span>
        )}
      </div>
      {expandable && expanded && (
        <div className="ml-6 border-l border-white/5 pl-4">
          {children.map((c: { key: string; value: any }) => (
            <TreeNode key={c.key} k={c.key} value={c.value} />
          ))}
          <div className="text-slate-400 text-xs italic opacity-50">{type === 'object' ? '}' : ']'}</div>
        </div>
      )}
    </div>
  );
}

export function JsonFormatter() {
  const toast = useToast();
  const [input, setInput] = useState(DEFAULT_SAMPLE);
  const [view, setView] = useState<'code' | 'tree'>('code');
  const [manualError, setManualError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!input.trim()) return { data: null as any, error: null as string | null, formatted: '' };
    try {
      const data = JSON.parse(input);
      return { data, error: null, formatted: JSON.stringify(data, null, 2) };
    } catch (e: any) {
      return { data: null, error: e.message as string, formatted: '' };
    }
  }, [input]);

  const error = manualError ?? parsed.error;
  const hasData = parsed.data !== null || (parsed.formatted !== '' && !parsed.error);
  const stats = !input.trim()
    ? { nodeCount: 0, maxDepth: 0, dataType: 'None' }
    : parsed.error
      ? { nodeCount: 0, maxDepth: 0, dataType: 'Invalid' }
      : computeStats(parsed.data);

  // Angular logged on every parse; throttle to once per 3s so typing doesn't flood the metrics endpoint.
  const lastLog = useRef(0);
  useEffect(() => {
    if (!parsed.formatted) return;
    const now = Date.now();
    if (now - lastLog.current < 3000) return;
    lastLog.current = now;
    void logToolUsage('json_formatter', 'process');
  }, [parsed.formatted]);

  const edit = (v: string) => {
    setManualError(null);
    setInput(v);
  };

  const format = () => {
    if (parsed.error) return setManualError(parsed.error);
    if (parsed.formatted) {
      setInput(parsed.formatted);
      toast.success('Formatted successfully!');
    }
  };
  const minify = () => {
    if (!input.trim()) return;
    if (parsed.error) return setManualError(parsed.error);
    edit(JSON.stringify(parsed.data));
    toast.success('Minified successfully!');
  };
  const sortKeys = () => {
    if (!hasData) return;
    edit(JSON.stringify(deepSort(parsed.data), null, 2));
    toast.success('Keys sorted alphabetically');
  };
  const copyTs = async () => {
    if (!hasData) return;
    await navigator.clipboard.writeText(jsonToTypeScript(parsed.data, 'RootInterface'));
    toast.success('TS Interface copied!');
  };
  const copy = async () => {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    toast.success('Copied to clipboard!');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    edit(input.slice(0, s) + '  ' + input.slice(en));
    requestAnimationFrame(() => (ta.selectionStart = ta.selectionEnd = s + 2));
  };

  // Pasting minified JSON auto-formats it.
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text || text.includes('\n') || !/^[{[]/.test(text.trim())) return;
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, 2);
      e.preventDefault();
      const ta = e.currentTarget;
      edit(input.slice(0, ta.selectionStart) + formatted + input.slice(ta.selectionEnd));
      toast.success('Auto-formatted minified JSON');
    } catch {
      /* not valid JSON: let the default paste happen */
    }
  };

  const stat = (label: string, value: ReactNode) => (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-700 uppercase tracking-tighter">{value}</p>
    </div>
  );

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-wrap gap-8">
            {stat('Data Type', stats.dataType)}
            {stat('Total Nodes', stats.nodeCount)}
            {stat('Max Depth', stats.maxDepth)}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validation</p>
              <span className={`text-sm font-black uppercase tracking-tighter ${error ? 'text-rose-500' : 'text-emerald-500'}`}>
                {error ? 'Invalid' : hasData ? 'Valid JSON' : 'Waiting...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={sortKeys} disabled={!hasData} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">Sort Keys</button>
            <button type="button" onClick={copyTs} disabled={!hasData} className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">Copy as TS Interface</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[700px]">
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Raw JSON</span>
              <button type="button" onClick={() => { edit(SAMPLE); toast.info('Sample JSON loaded'); }} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all">Load Sample</button>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={format} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700">Format</button>
              <button type="button" onClick={minify} className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-900">Minify</button>
              <button type="button" onClick={() => edit('')} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600">Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            aria-label="Raw JSON input"
            placeholder="Paste your JSON here..."
            className="flex-1 w-full p-8 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[600px]">
          <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex p-1 bg-white/5 rounded-xl">
              {(['code', 'tree'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-white text-slate-900' : 'text-white/40'}`}>
                  {v === 'code' ? 'Code' : 'Tree Explorer'}
                </button>
              ))}
            </div>
            <button type="button" onClick={copy} className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2">
              <i className="far fa-copy" /> Copy Result
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {view === 'code' ? (
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {parsed.formatted ? highlight(parsed.formatted) : '// Output will appear here...'}
              </div>
            ) : (
              <div className="pb-10">
                {hasData ? <TreeNode value={parsed.data} /> : <div className="text-white/20 font-mono text-sm italic">{'// Paste valid JSON to explore tree...'}</div>}
              </div>
            )}
          </div>

          {error && (
            <div className="absolute bottom-8 left-8 right-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Syntax Error</p>
                  <p className="text-xs font-bold text-rose-200/80 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
