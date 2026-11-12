'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DELIMITERS, csvToObjects, detectDelimiter, jsonToCsv, parseCsv, type Delimiter } from '@/lib/csv';
import { downloadBlob } from '@/lib/files';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

type Mode = 'csv2json' | 'json2csv';

const SAMPLE_CSV = `id,name,email,active,revenue
101,Acme Corp,contact@acme.com,true,450000.50
102,"Globex, Inc",hr@globex.com,false,12000.00
103,Soylent Corp,sales@soylent.com,true,88900.25`;

const SAMPLE_JSON = JSON.stringify(
  [
    { id: 1, name: 'Marketing Campaign', tags: ['email', 'spring'], stats: { clicks: 120, conversions: 5 } },
    { id: 2, name: 'Newsletter', tags: [], stats: { clicks: 450, conversions: 22 } },
  ],
  null,
  2,
);

const field = 'block w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const check = 'h-4 w-4 rounded border-slate-300 accent-primary-600';
const PREVIEW_ROWS = 8;
const PREVIEW_COLS = 8;

export function DataConverter() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('csv2json');
  // Start from the sample so the prerendered HTML already shows a conversion.
  const [input, setInput] = useState(SAMPLE_CSV);
  const [delimiter, setDelimiter] = useState<Delimiter | 'auto'>('auto');
  const [detectTypes, setDetectTypes] = useState(true);
  const [emptyAsNull, setEmptyAsNull] = useState(false);
  const [flatten, setFlatten] = useState(true);

  const effectiveDelimiter: Delimiter = delimiter === 'auto' ? (mode === 'csv2json' ? detectDelimiter(input) : ',') : delimiter;
  const delimiterName = DELIMITERS.find((d) => d.id === effectiveDelimiter)!.label.toLowerCase();

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null, rows: 0, columns: [] as string[], warnings: [] as string[], preview: [] as string[][] };
    if (mode === 'csv2json') {
      const r = csvToObjects(input, { delimiter: effectiveDelimiter, detectTypes, emptyAsNull });
      const preview = [r.columns, ...r.rows.slice(0, PREVIEW_ROWS).map((row) => r.columns.map((c) => (row[c] === null ? '' : String(row[c]))))];
      return { output: JSON.stringify(r.rows, null, 2), error: null, rows: r.rows.length, columns: r.columns, warnings: r.warnings, preview };
    }
    const r = jsonToCsv(input, { delimiter: effectiveDelimiter, flatten });
    if (r.error) return { output: '', error: r.error, rows: 0, columns: [], warnings: [], preview: [] };
    const preview = parseCsv(r.csv, effectiveDelimiter).rows.slice(0, PREVIEW_ROWS + 1);
    return { output: r.csv, error: null, rows: r.rowCount, columns: r.columns, warnings: [], preview };
  }, [input, mode, effectiveDelimiter, detectTypes, emptyAsNull, flatten]);

  const last = useRef('');
  useEffect(() => {
    if (!result.output || last.current === result.output) return;
    last.current = result.output;
    void logToolUsage('data_converter', 'convert');
  }, [result.output]);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setInput(m === 'csv2json' ? SAMPLE_CSV : SAMPLE_JSON);
    setDelimiter(m === 'csv2json' ? 'auto' : ',');
  };

  const useOutputAsInput = () => {
    if (!result.output) return;
    const next: Mode = mode === 'csv2json' ? 'json2csv' : 'csv2json';
    setInput(result.output);
    setMode(next);
    setDelimiter(effectiveDelimiter);
  };

  const copy = async () => {
    if (!result.output) return;
    try { await navigator.clipboard.writeText(result.output); toast.success('Copied'); } catch { toast.error('Could not copy'); }
  };

  const download = () => {
    if (!result.output) return;
    // Downloaded CSV starts with a byte-order mark so Excel reads accents and non-Latin text correctly.
    const isCsv = mode === 'json2csv';
    downloadBlob(new Blob([isCsv ? '﻿' + result.output : result.output], { type: isCsv ? 'text/csv;charset=utf-8' : 'application/json' }), `converted-${Date.now()}.${isCsv ? 'csv' : 'json'}`);
  };

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error('That file is over 20 MB. Please use a smaller one.');
    const text = await file.text();
    const looksJson = /^\s*[[{]/.test(text) && /\.json$/i.test(file.name);
    setMode(looksJson ? 'json2csv' : 'csv2json');
    setDelimiter(looksJson ? ',' : /\.tsv$/i.test(file.name) ? '\t' : 'auto');
    setInput(text);
    toast.success(`Loaded ${file.name}`);
  };

  const modeBtn = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label="Conversion direction" className="flex p-1 rounded-lg bg-slate-100 w-fit">
            {modeBtn('csv2json', 'CSV to JSON')}
            {modeBtn('json2csv', 'JSON to CSV')}
          </div>
          <p className="text-sm text-slate-600" role="status">
            {result.error ? <span className="font-semibold text-rose-700">Cannot convert</span> : result.output ? <><strong className="text-slate-900">{result.rows.toLocaleString('en-US')}</strong> rows · <strong className="text-slate-900">{result.columns.length}</strong> columns</> : 'Waiting for input'}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-[170px]">
            <label htmlFor="dc-delim" className="block text-sm font-medium text-slate-700 mb-1.5">Separator</label>
            <select id="dc-delim" value={delimiter} onChange={(e) => setDelimiter(e.target.value as Delimiter | 'auto')} className={field}>
              {mode === 'csv2json' && <option value="auto">Detect automatically</option>}
              {DELIMITERS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          {mode === 'csv2json' ? (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={detectTypes} onChange={(e) => setDetectTypes(e.target.checked)} className={check} />Convert numbers and true/false</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={emptyAsNull} onChange={(e) => setEmptyAsNull(e.target.checked)} className={check} />Empty cells become null</label>
            </>
          ) : (
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className={check} />Flatten nested objects (stats.clicks)</label>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {mode === 'csv2json'
            ? <>Separator in use: <strong>{delimiterName}</strong>. Numbers are converted only when that cannot change them, so 007, +15551234567 and very long IDs stay as text.</>
            : 'Numbers are copied exactly as written, and values that contain the separator, quotes or line breaks are quoted correctly.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:h-[520px]">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[320px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">{mode === 'csv2json' ? 'CSV input' : 'JSON input'}</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.json,text/csv,application/json" className="sr-only" aria-label="Open a file" onChange={(e) => { void openFile(e.target.files?.[0]); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-primary-700 hover:underline">Open a file</button>
              <button type="button" onClick={() => setInput(mode === 'csv2json' ? SAMPLE_CSV : SAMPLE_JSON)} className="font-medium text-slate-600 hover:text-slate-900 hover:underline">Sample</button>
              <button type="button" onClick={() => setInput('')} className="font-medium text-rose-700 hover:underline">Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-label={mode === 'csv2json' ? 'CSV input' : 'JSON input'}
            placeholder={mode === 'csv2json' ? 'Paste CSV here, or open a file' : 'Paste a JSON array of objects here'}
            className="flex-1 w-full p-4 font-mono text-sm text-slate-800 bg-white outline-none resize-none leading-relaxed whitespace-pre"
          />
        </div>

        <div className="flex flex-col rounded-xl bg-slate-900 overflow-hidden min-h-[320px]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">{mode === 'csv2json' ? 'JSON output' : 'CSV output'}</h2>
            <div className="flex gap-4 text-sm">
              <button type="button" onClick={useOutputAsInput} disabled={!result.output} className="font-medium text-slate-200 hover:text-white disabled:opacity-40">Convert back</button>
              <button type="button" onClick={copy} disabled={!result.output} className="font-medium text-slate-200 hover:text-white disabled:opacity-40">Copy</button>
              <button type="button" onClick={download} disabled={!result.output} className="font-medium text-slate-200 hover:text-white disabled:opacity-40">Download</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {result.error ? (
              <div role="alert" className="rounded-lg border border-rose-400/40 bg-rose-950/80 p-4 text-sm text-rose-100">
                <p className="font-semibold text-rose-200">The JSON is not valid</p>
                <p className="mt-1">{result.error}</p>
              </div>
            ) : result.output ? (
              <pre className="font-mono text-sm leading-relaxed text-emerald-200 whitespace-pre">{result.output}</pre>
            ) : (
              <p className="font-mono text-sm text-slate-500">The converted data appears here.</p>
            )}
          </div>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <ul role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1 list-disc pl-8">
          {result.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}

      {result.preview.length > 1 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Preview">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Preview {result.rows > PREVIEW_ROWS && <span className="font-normal text-slate-500">(first {PREVIEW_ROWS} of {result.rows.toLocaleString('en-US')} rows)</span>}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-300">
                  {result.preview[0].slice(0, PREVIEW_COLS).map((h, i) => <th key={i} scope="col" className="py-2 pr-4 font-semibold text-slate-900 whitespace-nowrap">{h}</th>)}
                  {result.preview[0].length > PREVIEW_COLS && <th className="py-2 text-slate-500 font-normal">+{result.preview[0].length - PREVIEW_COLS} more</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.preview.slice(1).map((row, r) => (
                  <tr key={r}>{row.slice(0, PREVIEW_COLS).map((c, i) => <td key={i} className="py-2 pr-4 text-slate-700 max-w-[240px] truncate">{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
