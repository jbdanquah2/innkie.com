'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

type Mode = 'csv2json' | 'json2csv';

const SAMPLE_CSV = `id,name,email,active,revenue
101,Acme Corp,contact@acme.com,true,450000.50
102,Globex,hr@globex.com,false,12000.00
103,Soylent Corp,sales@soylent.com,true,88900.25`;

const SAMPLE_JSON = JSON.stringify(
  [
    { id: 1, name: 'Marketing Campaign', stats: { clicks: 120, conversions: 5 } },
    { id: 2, name: 'Newsletter', stats: { clicks: 450, conversions: 22 } },
  ],
  null,
  2,
);

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    if (line[i] === delimiter && !inQuotes) {
      result.push(line.substring(start, i));
      start = i + 1;
    }
  }
  result.push(line.substring(start));
  return result;
}

function csvToJson(csv: string, delimiter: string): string {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must contain at least a header and one row.');
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = parseCsvLine(lines[i], delimiter);
    const obj: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      let val: unknown = cells[idx]?.trim().replace(/^"|"$/g, '');
      if (val !== '' && val !== undefined && !isNaN(val as number)) val = Number(val);
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      obj[header] = val;
    });
    rows.push(obj);
  }
  return JSON.stringify(rows, null, 2);
}

function flatten(obj: Record<string, any>, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, k) => {
    const pre = prefix.length ? prefix + '_' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) Object.assign(acc, flatten(obj[k], pre + k));
    else acc[pre + k] = obj[k];
    return acc;
  }, {});
}

function jsonToCsv(jsonStr: string): string {
  let json = JSON.parse(jsonStr);
  if (!Array.isArray(json)) json = [json];
  if (json.length === 0) return '';
  const flat = json.map((o: any) => flatten(o));
  const headers = Array.from(new Set(flat.reduce((acc: string[], o: any) => acc.concat(Object.keys(o)), [])));
  return [headers.join(','), ...flat.map((row: any) => headers.map((h) => JSON.stringify(row[h as string] ?? '')).join(','))].join('\r\n');
}

export function DataConverter() {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('csv2json');
  const [delimiter, setDelimiter] = useState(',');
  // Start from the sample so the prerendered HTML already shows a conversion.
  const [input, setInput] = useState(SAMPLE_CSV);

  const { output, error } = useMemo(() => {
    const raw = input.trim();
    if (!raw) return { output: '', error: null as string | null };
    try {
      return { output: mode === 'csv2json' ? csvToJson(raw, delimiter) : jsonToCsv(raw), error: null };
    } catch (e: any) {
      return { output: '', error: e.message as string };
    }
  }, [input, mode, delimiter]);

  const last = useRef('');
  useEffect(() => {
    if (!output || last.current === output) return;
    last.current = output;
    void logToolUsage('data_converter', 'convert');
  }, [output]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setInput(m === 'csv2json' ? SAMPLE_CSV : SAMPLE_JSON);
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success('Converted data copied!');
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `innkie-export-${Date.now()}.${mode === 'csv2json' ? 'json' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const seg = (active: boolean) => `px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${active ? 'bg-white shadow-sm' : ''}`;

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-wrap gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button type="button" onClick={() => switchMode('csv2json')} className={seg(mode === 'csv2json')}>CSV to JSON</button>
                <button type="button" onClick={() => switchMode('json2csv')} className={seg(mode === 'json2csv')}>JSON to CSV</button>
              </div>
            </div>
            {mode === 'csv2json' && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delimiter</p>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  aria-label="Delimiter"
                  className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 px-3 py-1.5 outline-none focus:ring-4 focus:ring-primary-100"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value={'\t'}>Tab</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setInput('')} className="px-4 py-2 text-slate-400 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Clear Workspace
            </button>
            <button type="button" onClick={download} disabled={!output} className="px-6 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-30 disabled:grayscale">
              <i className="fas fa-download mr-2" /> Download Result
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[600px]">
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input {mode === 'csv2json' ? 'CSV / Raw Text' : 'JSON Object'}</span>
            <button type="button" onClick={() => setInput(mode === 'csv2json' ? SAMPLE_CSV : SAMPLE_JSON)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-all">Load Sample</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Input"
            placeholder={mode === 'csv2json' ? 'name,email,role\nJohn Doe,john@example.com,Admin' : '[ { "name": "John" } ]'}
            className="flex-1 w-full p-8 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[400px] lg:min-h-0">
          <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Converted Result</span>
            <button type="button" onClick={copy} disabled={!output} className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2 disabled:opacity-20">
              <i className="far fa-copy" /> Copy Result
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8">
            {output ? (
              <pre className="font-mono text-sm leading-relaxed whitespace-pre text-emerald-400"><code>{output}</code></pre>
            ) : (
              <div className="text-white/20 font-mono text-sm italic">{'// Conversion results will appear here...'}</div>
            )}
          </div>
          {error && (
            <div className="absolute bottom-8 left-8 right-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Processing Error</p>
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
