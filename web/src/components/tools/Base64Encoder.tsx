'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { base64ToBytes, bytesToBase64, classifyBytes, formatBytes, hexPreview, textToBytes } from '@/lib/base64';
import { downloadBlob } from '@/lib/files';
import { findJsonProblem, formatJsonText } from '@/lib/json-format';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

type Mode = 'encode' | 'decode';
interface OpenFile { name: string; mime: string; bytes: Uint8Array }

const MAX_FILE = 20 * 1024 * 1024;
const SAMPLE_TEXT = 'iNNkie is the best All-in-One Utility platform! 🚀';
const SAMPLE_B64 = 'aU5Oa2llIGlzIHRoZSBiZXN0IEFsbC1pbi1PbmUgVXRpbGl0eSBwbGF0Zm9ybSEg8J+agA==';

const check = 'h-4 w-4 rounded border-slate-300 accent-primary-600';

export function Base64Encoder() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<OpenFile | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);
  const [prettyJson, setPrettyJson] = useState(false);

  const inputBytes = useMemo(() => (file ? file.bytes : textToBytes(input)), [file, input]);

  const encoded = useMemo(() => (mode === 'encode' && inputBytes.length > 0 ? bytesToBase64(inputBytes, { urlSafe, padding }) : ''), [mode, inputBytes, urlSafe, padding]);

  const decoded = useMemo(() => {
    if (mode !== 'decode' || !input.trim()) return null;
    const r = base64ToBytes(input);
    if ('error' in r) return { error: r.error } as const;
    return { ok: true as const, ...r, kind: classifyBytes(r.bytes, r.mime) };
  }, [mode, input]);

  const textOut = decoded && 'ok' in decoded && decoded.kind.kind === 'text' ? decoded.kind.text : null;
  const looksJson = textOut !== null && /^\s*[[{]/.test(textOut) && !findJsonProblem(textOut);
  const shownText = textOut === null ? '' : looksJson && prettyJson ? formatJsonText(textOut) : textOut;

  // A preview URL for decoded images, released when the data changes.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!decoded || !('ok' in decoded) || decoded.kind.kind !== 'binary' || !decoded.kind.mime?.startsWith('image/') || decoded.kind.mime.includes('svg')) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([decoded.bytes as BlobPart], { type: decoded.kind.mime }));
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [decoded]);

  const output = mode === 'encode' ? encoded : shownText;
  const hasResult = mode === 'encode' ? !!encoded : !!decoded && 'ok' in decoded;

  const lastLogged = useRef('');
  useEffect(() => {
    if (!hasResult) return;
    const key = `${mode}:${input.length}:${file?.name ?? ''}`;
    if (lastLogged.current === key) return;
    lastLogged.current = key;
    void logToolUsage('base64_encoder', mode);
  }, [hasResult, mode, input, file]);

  const copy = async (text: string, msg = 'Copied') => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Could not copy'); }
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setFile(null);
    setInput('');
    setPrettyJson(false);
  };

  const openFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_FILE) return toast.error('That file is over 20 MB. Please use a smaller one.');
    if (mode === 'encode') {
      setFile({ name: f.name, mime: f.type, bytes: new Uint8Array(await f.arrayBuffer()) });
      setInput('');
    } else {
      setInput(await f.text());
    }
  };

  const downloadOutput = () => {
    if (mode === 'encode') downloadBlob(new Blob([encoded], { type: 'text/plain' }), `${file ? file.name + '.' : 'encoded-'}base64.txt`);
    else if (decoded && 'ok' in decoded) {
      if (decoded.kind.kind === 'binary') downloadBlob(new Blob([decoded.bytes as BlobPart], { type: decoded.kind.mime ?? 'application/octet-stream' }), `decoded.${decoded.kind.extension}`);
      else downloadBlob(new Blob([shownText], { type: 'text/plain' }), 'decoded.txt');
    }
  };

  const dataUri = file && file.mime ? `data:${file.mime};base64,${bytesToBase64(file.bytes)}` : '';
  const growth = mode === 'encode' && encoded && inputBytes.length ? Math.round((encoded.length / inputBytes.length - 1) * 100) : null;

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label="Direction" className="flex p-1 rounded-lg bg-slate-100 w-fit">
            {tab('encode', 'Encode')}
            {tab('decode', 'Decode')}
          </div>
          <p className="text-sm text-slate-600" role="status">
            {mode === 'encode'
              ? inputBytes.length ? <>{formatBytes(inputBytes.length)} in · <strong className="text-slate-900">{encoded.length.toLocaleString('en-US')}</strong> characters out{growth !== null && <> ({growth >= 0 ? '+' : ''}{growth}%)</>}</> : 'Waiting for input'
              : decoded && 'ok' in decoded ? <>{formatBytes(decoded.bytes.length)} decoded{decoded.urlSafe && ' · URL-safe input'}</> : decoded ? <span className="font-semibold text-rose-700">Cannot decode</span> : 'Waiting for input'}
          </p>
        </div>
        {mode === 'encode' ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} className={check} />URL-safe (use - and _ instead of + and /)</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={padding} onChange={(e) => setPadding(e.target.checked)} className={check} />Keep = padding</label>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Standard and URL-safe Base64 are both accepted, with or without padding, and a leading data: URI is understood. Text, images and other files are recognised.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:h-[480px]">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">{mode === 'encode' ? 'Text or file' : 'Base64'}</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <input ref={fileRef} type="file" className="sr-only" aria-label="Open a file" onChange={(e) => { void openFile(e.target.files?.[0]); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-primary-700 hover:underline">{mode === 'encode' ? 'Encode a file' : 'Open a text file'}</button>
              <button type="button" onClick={() => { setFile(null); setInput(mode === 'encode' ? SAMPLE_TEXT : SAMPLE_B64); }} className="font-medium text-slate-600 hover:text-slate-900 hover:underline">Sample</button>
              <button type="button" onClick={() => { setFile(null); setInput(''); }} className="font-medium text-rose-700 hover:underline">Clear</button>
            </div>
          </div>
          {file ? (
            <div className="flex-1 p-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900 break-all">{file.name}</p>
                <p className="mt-1 text-slate-600">{formatBytes(file.bytes.length)}{file.mime && ` · ${file.mime}`}</p>
                <button type="button" onClick={() => setFile(null)} className="mt-3 font-medium text-rose-700 hover:underline">Remove the file and type text instead</button>
              </div>
            </div>
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              aria-label={mode === 'encode' ? 'Text to encode' : 'Base64 to decode'}
              placeholder={mode === 'encode' ? 'Type or paste text to encode. Every character counts, including spaces and line breaks.' : 'Paste Base64 here, or a data: URI'}
              className="flex-1 w-full p-4 font-mono text-sm text-slate-800 bg-white outline-none resize-none leading-relaxed break-all"
            />
          )}
        </div>

        <div className="flex flex-col rounded-xl bg-slate-900 overflow-hidden min-h-[300px]">
          <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">{mode === 'encode' ? 'Base64' : decoded && 'ok' in decoded && decoded.kind.kind === 'binary' ? 'Decoded file' : 'Decoded text'}</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              {mode === 'encode' && dataUri && <button type="button" onClick={() => copy(dataUri, 'Data URI copied')} className="font-medium text-slate-200 hover:text-white">Copy as data URI</button>}
              {looksJson && <button type="button" onClick={() => setPrettyJson((v) => !v)} aria-pressed={prettyJson} className="font-medium text-slate-200 hover:text-white">{prettyJson ? 'Show exact text' : 'Format JSON'}</button>}
              <button type="button" onClick={() => copy(output)} disabled={!output} className="font-medium text-slate-200 hover:text-white disabled:opacity-40">Copy</button>
              <button type="button" onClick={downloadOutput} disabled={!hasResult} className="font-medium text-slate-200 hover:text-white disabled:opacity-40">Download</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {decoded && 'error' in decoded ? (
              <div role="alert" className="rounded-lg border border-rose-400/40 bg-rose-950/80 p-4 text-sm text-rose-100">
                <p className="font-semibold text-rose-200">Cannot decode this</p>
                <p className="mt-1">{decoded.error}</p>
              </div>
            ) : decoded && 'ok' in decoded && decoded.kind.kind === 'binary' ? (
              <div className="space-y-4 text-sm text-slate-200">
                <p><span className="font-semibold text-white">{decoded.kind.label}</span>, {formatBytes(decoded.bytes.length)}. This is not text, so it is shown as a file.</p>
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Decoded image preview" className="max-h-56 max-w-full rounded-lg border border-white/10 bg-white/5 object-contain" />
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-1">First bytes (hex)</p>
                  <p className="font-mono text-xs break-all text-slate-300">{hexPreview(decoded.bytes)}</p>
                </div>
              </div>
            ) : output ? (
              <pre className="font-mono text-sm leading-relaxed text-emerald-200 whitespace-pre-wrap break-all">{output}</pre>
            ) : (
              <p className="font-mono text-sm text-slate-500">The result appears here.</p>
            )}
          </div>
        </div>
      </div>

      <AdSlot slotId="base64_bottom" minHeight="90px" />
    </div>
  );
}
