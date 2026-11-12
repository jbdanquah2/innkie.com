'use client';
import { useEffect, useMemo, useState } from 'react';
import { AdSlot } from '@/components/AdSlot';
import { CLAIM_NAMES, TIME_CLAIMS, expiryStatus, isEpochSeconds, isHmacAlg, parseJwt, signHs256, verifyHmac, type ParsedJwt } from '@/lib/jwt';
import { logToolUsage } from '@/lib/metrics';
import { useToast } from '@/lib/toast';

const EXAMPLE_SECRET = 'your-256-bit-secret';
const field = 'block w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
const card = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6';

const STATUS_STYLE = {
  valid: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  expired: 'border-rose-200 bg-rose-50 text-rose-900',
  'not-yet-valid': 'border-amber-200 bg-amber-50 text-amber-900',
  'no-expiry': 'border-slate-200 bg-slate-50 text-slate-800',
  unreadable: 'border-amber-200 bg-amber-50 text-amber-900',
} as const;
const STATUS_TITLE = {
  valid: 'Not expired',
  expired: 'Expired',
  'not-yet-valid': 'Not valid yet',
  'no-expiry': 'No expiry claim',
  unreadable: 'Expiry unclear',
} as const;

function CodeBlock({ title, text, onCopy }: { title: string; text: string; onCopy: () => void }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button type="button" onClick={onCopy} className="text-sm font-medium text-slate-300 hover:text-white">Copy</button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed text-emerald-200 font-mono overflow-x-auto"><code>{text}</code></pre>
    </div>
  );
}

function ClaimValue({ value }: { value: unknown }) {
  if (typeof value === 'string') return <span className="break-all">{value}</span>;
  return <span className="font-mono break-all">{JSON.stringify(value)}</span>;
}

export function JwtDecoder() {
  const toast = useToast();
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [check, setCheck] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
  const [now, setNow] = useState(() => Date.now());

  const parsed = useMemo(() => (token.trim() ? parseJwt(token) : null), [token]);
  const jwt: ParsedJwt | null = parsed && parsed.ok ? parsed : null;

  // Keep the "expires in…" text fresh while a token is on screen.
  useEffect(() => {
    if (!jwt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [jwt]);

  // A different token invalidates any earlier signature result.
  useEffect(() => setCheck('idle'), [token, secret]);

  const decodedOk = !!jwt;
  useEffect(() => {
    if (decodedOk) void logToolUsage('jwt_decoder', 'decode');
  }, [decodedOk]);

  const status = jwt ? expiryStatus(jwt.payload, Math.floor(now / 1000)) : null;
  const payloadObj = jwt && jwt.payload !== null && typeof jwt.payload === 'object' && !Array.isArray(jwt.payload) ? (jwt.payload as Record<string, unknown>) : null;
  const unsigned = jwt ? jwt.alg.toLowerCase() === 'none' : false;

  const claimRows = useMemo(() => {
    if (!payloadObj) return [];
    return Object.keys(CLAIM_NAMES).filter((k) => k in payloadObj).map((k) => ({ key: k, name: CLAIM_NAMES[k], value: payloadObj[k] }));
  }, [payloadObj]);

  const loadExample = async () => {
    const t = Math.floor(Date.now() / 1000);
    setToken(await signHs256({ sub: '1234567890', name: 'Jane Doe', aud: 'example-app', iat: t - 300, exp: t + 3600 }, EXAMPLE_SECRET));
    setSecret(EXAMPLE_SECRET);
  };

  const copy = async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Could not copy'); }
  };

  const verify = async () => {
    if (!jwt || !secret) return;
    try { setCheck((await verifyHmac(jwt, secret)) ? 'valid' : 'invalid'); } catch { setCheck('error'); }
  };

  const timeText = (v: number) => {
    const d = new Date(v * 1000);
    return `${d.toLocaleString()} (${d.toISOString().replace('.000Z', 'Z')})`;
  };

  return (
    <div className="space-y-6">
      <section className={card}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label htmlFor="jwt-input" className="text-sm font-medium text-slate-700">JSON Web Token</label>
          <div className="flex gap-4 text-sm">
            <button type="button" onClick={loadExample} className="font-medium text-primary-700 hover:underline">Load an example</button>
            <button type="button" onClick={() => { setToken(''); setSecret(''); }} className="font-medium text-slate-600 hover:text-rose-700 hover:underline">Clear</button>
          </div>
        </div>
        <textarea
          id="jwt-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={5}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={parsed ? !parsed.ok : undefined}
          placeholder="Paste a token, or a whole Authorization header such as: Bearer eyJhbGciOi..."
          className={`${field} font-mono text-sm break-all resize-y`}
        />
        <p className="mt-2 text-xs text-slate-500">Decoded in your browser. The token is never sent anywhere.</p>
      </section>

      <AdSlot slotId="jwt_decoder_top" minHeight="90px" />

      {parsed && !parsed.ok && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <p className="font-semibold">This is not a readable JWT</p>
          <p className="mt-1 text-sm">{parsed.reason}</p>
        </div>
      )}

      {jwt && status && (
        <>
          <div className="space-y-3">
            <div className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${STATUS_STYLE[status.kind]}`} role="status">
              <div>
                <p className="font-semibold">{STATUS_TITLE[status.kind]}</p>
                <p className="text-sm">{status.kind === 'no-expiry' ? 'The token has no exp claim, so its own claims never expire it.' : status.detail}</p>
              </div>
              <p className="text-sm">Algorithm: <span className="font-mono font-semibold">{jwt.alg || 'missing'}</span></p>
            </div>
            {unsigned && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                This token is unsigned (<span className="font-mono">alg: none</span>). Anyone can create one with any contents, so a server must never trust it.
              </p>
            )}
            <p className="text-xs text-slate-500">Expiry is judged from the claims and your device&apos;s clock. It does not prove the token is genuine; that needs the signature to be verified.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <CodeBlock title="Header" text={jwt.headerText} onCopy={() => copy(jwt.headerText, 'Header copied')} />
            <CodeBlock title="Payload" text={jwt.payloadText} onCopy={() => copy(jwt.payloadText, 'Payload copied')} />
          </div>

          {claimRows.length > 0 && (
            <section className={card} aria-label="Standard claims">
              <h2 className="font-semibold text-slate-900 mb-4">Standard claims</h2>
              <dl className="divide-y divide-slate-200">
                {claimRows.map((c) => (
                  <div key={c.key} className="py-3 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 text-sm">
                    <dt className="text-slate-600">{c.name} <span className="font-mono text-xs text-slate-400">({c.key})</span></dt>
                    <dd className="text-slate-900 min-w-0">
                      {(TIME_CLAIMS as readonly string[]).includes(c.key) && isEpochSeconds(c.value)
                        ? <span>{timeText(c.value)}</span>
                        : <ClaimValue value={c.value} />}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className={card} aria-label="Signature">
            <h2 className="font-semibold text-slate-900">Signature</h2>
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">{jwt.signature || '(empty)'}</p>
            {isHmacAlg(jwt.alg) ? (
              <div className="mt-4">
                <label htmlFor="jwt-secret" className="block text-sm font-medium text-slate-700 mb-1.5">Check the signature with a shared secret</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input id="jwt-secret" type="text" autoComplete="off" spellCheck={false} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret used to sign the token" className={`${field} font-mono text-sm`} />
                  <button type="button" onClick={verify} disabled={!secret} className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">Verify</button>
                </div>
                <p className="mt-2 text-xs text-slate-500">The check runs in your browser. Still, use test secrets here and never paste a production secret into any web page.</p>
                {check === 'valid' && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Signature valid: the token was signed with this secret and has not been changed.</p>}
                {check === 'invalid' && <p role="status" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Signature does not match: the secret is wrong, or the token was altered.</p>}
                {check === 'error' && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Your browser could not run the check.</p>}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                {unsigned
                  ? 'There is no signature to check.'
                  : jwt.alg
                    ? `${jwt.alg} tokens are signed with a private key and checked with the matching public key, which this tool does not handle. Verify the signature in your own code.`
                    : 'The header has no algorithm, so the signature cannot be checked here.'}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
