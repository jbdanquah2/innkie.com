'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

type Mode = 'encode' | 'decode';

const utf8ToB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const b64ToUtf8 = (b64: string) => {
  const bin = atob(b64);
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function Base64Encoder() {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    const raw = input.trim();
    if (!raw) return { output: '', error: null as string | null, isJson: false };
    try {
      if (mode === 'encode') return { output: utf8ToB64(raw), error: null, isJson: false };
      const decoded = b64ToUtf8(raw);
      try {
        return { output: JSON.stringify(JSON.parse(decoded), null, 2), error: null, isJson: true };
      } catch {
        return { output: decoded, error: null, isJson: false };
      }
    } catch {
      return { output: '', error: mode === 'decode' ? 'Invalid Base64 format or encoding issue.' : 'Encoding failed.', isJson: false };
    }
  }, [input, mode]);

  // Log once per successful transformation, like the Angular version (not on every re-render).
  const lastLogged = useRef('');
  useEffect(() => {
    if (!result.output) return;
    const key = `${mode}:${input}`;
    if (lastLogged.current === key) return;
    lastLogged.current = key;
    void logToolUsage('base64_encoder', mode);
  }, [result.output, mode, input]);

  const isUrl = /^https?:\/\//.test(result.output.trim());

  const copy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    toast.success('Result copied to clipboard!');
  };

  const download = () => {
    if (!result.output) return;
    const url = URL.createObjectURL(new Blob([result.output], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `innkie-base64-${mode}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const loadSample = () =>
    setInput(mode === 'encode' ? 'iNNkie is the best All-in-One Utility platform! 🚀' : 'aU5Oa2llIGlzIHRoZSBiZXN0IEFsbC1pbi1PbmUgVXRpbGl0eSBwbGF0Zm9ybSEg8J+agA==');

  const seg = (active: boolean) => `px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${active ? 'bg-white shadow-sm' : ''}`;

  return (
    <>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setMode('encode')} className={seg(mode === 'encode')}>Encode</button>
              <button type="button" onClick={() => setMode('decode')} className={seg(mode === 'decode')}>Decode</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setInput('')} className="px-4 py-2 text-slate-400 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Clear Workspace
            </button>
            <button type="button" onClick={download} disabled={!result.output} className="px-6 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-30 disabled:grayscale">
              <i className="fas fa-download mr-2" /> Download Result
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[600px]">
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[350px] lg:min-h-0">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input {mode === 'encode' ? 'Raw Text' : 'Base64'}</span>
              <span className="text-[9px] font-bold text-slate-300 px-2 py-0.5 bg-white border border-slate-100 rounded-full">{input.length.toLocaleString('en-US')} chars</span>
            </div>
            <button type="button" onClick={loadSample} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 transition-all">Load Sample</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Input"
            placeholder={mode === 'encode' ? 'Paste your raw text here to encode...' : 'Paste your Base64 string here to decode...'}
            className="flex-1 w-full p-8 font-mono text-sm text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="flex-1 flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative min-h-[350px] lg:min-h-0">
          <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{mode === 'encode' ? 'Base64 Result' : 'Decoded Result'}</span>
              {result.output && (
                <span className="text-[9px] font-bold text-white/20 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full">{result.output.length.toLocaleString('en-US')} chars</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isUrl && (
                <a href={result.output.trim()} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  <i className="fas fa-external-link-alt" /> Open Link
                </a>
              )}
              <button type="button" onClick={copy} disabled={!result.output} className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors flex items-center gap-2 disabled:opacity-20">
                <i className="far fa-copy" /> Copy Result
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {result.output ? (
              <div className="relative group">
                <pre className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${result.isJson ? 'text-blue-300' : 'text-emerald-400'}`}><code>{result.output}</code></pre>
                {result.isJson && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest">JSON Detected</div>
                )}
              </div>
            ) : !result.error ? (
              <div className="text-white/20 font-mono text-sm italic">{'// Transformation results will appear here...'}</div>
            ) : null}

            {result.error && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-xl">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Decoding Error</p>
                  <p className="text-xs font-bold text-rose-200/80 leading-relaxed max-w-[250px] mx-auto">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdSlot slotId="base64_bottom" minHeight="90px" />
    </>
  );
}
