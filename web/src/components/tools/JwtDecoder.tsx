'use client';
import { useEffect, useMemo, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { logToolUsage } from '@/lib/metrics';

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  try {
    const bin = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return atob(b64);
  }
}

const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();

export function JwtDecoder() {
  const [token, setToken] = useState('');

  const decoded = useMemo(() => {
    const raw = token.trim();
    if (!raw) return null;
    const parts = raw.split('.');
    if (parts.length !== 3) return null;
    try {
      return { header: JSON.parse(base64UrlDecode(parts[0])), payload: JSON.parse(base64UrlDecode(parts[1])), signature: parts[2] };
    } catch {
      return null;
    }
  }, [token]);

  const timeClaims = useMemo(() => {
    const p = decoded?.payload;
    if (!p) return [];
    const out: { label: string; value: string }[] = [];
    if (p.iat) out.push({ label: 'Issued At (iat)', value: formatDate(p.iat) });
    if (p.exp) out.push({ label: 'Expires (exp)', value: formatDate(p.exp) });
    if (p.nbf) out.push({ label: 'Not Before (nbf)', value: formatDate(p.nbf) });
    return out;
  }, [decoded]);

  const decodedOk = !!decoded;
  useEffect(() => {
    if (decodedOk) void logToolUsage('jwt_decoder', 'decode');
  }, [decodedOk]);

  return (
    <>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-12">
        <label htmlFor="jwt-input" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Paste your JWT Token here</label>
        <textarea
          id="jwt-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all font-mono text-sm text-slate-700 break-all"
        />
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            <i className="fas fa-shield-alt" /> Local Processing Only
          </div>
          <button type="button" onClick={() => setToken('')} className="text-xs font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors">
            <i className="fas fa-trash-alt mr-1" /> Clear
          </button>
        </div>
      </div>

      <AdSlot slotId="jwt_decoder_top" minHeight="90px" />

      {decoded ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <i className="fas fa-heading text-primary-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Header</h3>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <pre className="text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto"><code>{JSON.stringify(decoded.header, null, 2)}</code></pre>
                <div className="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest pointer-events-none">ALGORITHM &amp; TYPE</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <i className="fas fa-database text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Payload</h3>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <pre className="text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto"><code>{JSON.stringify(decoded.payload, null, 2)}</code></pre>
                <div className="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest pointer-events-none">DATA CLAIMS</div>
              </div>
              {timeClaims.length > 0 && (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Human-Readable Timestamps</h4>
                  <div className="space-y-3">
                    {timeClaims.map((c) => (
                      <div key={c.label} className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-500 uppercase tracking-tighter">{c.label}</span>
                        <span className="font-mono text-slate-700 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 ml-4 mb-4">
              <i className="fas fa-fingerprint text-rose-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Signature</h3>
            </div>
            <div className="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-[2rem] text-center">
              <p className="text-xs font-mono text-slate-400 break-all leading-relaxed">{decoded.signature}</p>
              <p className="mt-6 text-[10px] font-bold text-slate-500 italic">Note: iNNkie decodes the structure locally. Signature verification requires your private key and is not performed here for your security.</p>
            </div>
          </div>
        </>
      ) : token.trim().length > 0 ? (
        <div className="text-center py-20 bg-rose-50 rounded-[3rem] border border-rose-100 border-dashed animate-pulse">
          <i className="fas fa-exclamation-triangle text-rose-400 text-4xl mb-4" />
          <h3 className="text-lg font-black text-rose-900 tracking-tight">Invalid JWT Format</h3>
          <p className="text-rose-600/70 font-medium">Please check your token structure (header.payload.signature)</p>
        </div>
      ) : null}
    </>
  );
}
