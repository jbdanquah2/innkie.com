import { findJsonProblem, formatJsonText } from './json-format';

/** Everything here is local: tokens are decoded in the browser and never sent anywhere. */

/** Pasted tokens often carry a "Bearer " prefix, quotes, or line breaks from where they were copied. */
export function cleanToken(input: string): string {
  let t = input.trim();
  t = t.replace(/^authorization\s*:\s*/i, '').replace(/^bearer\s+/i, '');
  t = t.replace(/^["'`]+|["'`,;]+$/g, '');
  return t.replace(/\s+/g, '');
}

const B64URL = /^[A-Za-z0-9_-]*={0,2}$/;

export function base64UrlToBytes(s: string): Uint8Array {
  if (!B64URL.test(s)) throw new Error('not Base64URL');
  let b64 = s.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeText(part: string): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(part));
}

export interface ParsedJwt {
  ok: true;
  header: Record<string, unknown>;
  payload: unknown;
  /** The decoded JSON exactly as it was encoded, reformatted without changing any value. */
  headerText: string;
  payloadText: string;
  signature: string;
  signingInput: string;
  alg: string;
}
export interface JwtFailure { ok: false; reason: string }

export function parseJwt(raw: string): ParsedJwt | JwtFailure {
  const token = cleanToken(raw);
  const parts = token.split('.');
  if (parts.length === 5) return { ok: false, reason: 'This has five parts, so it looks like an encrypted token (JWE). Its contents cannot be read without the decryption key.' };
  if (parts.length !== 3) return { ok: false, reason: `A JWT has three parts separated by dots (header.payload.signature), but this has ${parts.length}.` };

  const decodePart = (name: string, p: string): { text: string; value: unknown } | JwtFailure => {
    let text: string;
    try { text = decodeText(p); } catch { return { ok: false, reason: `The ${name} is not valid Base64URL text. Check for a missing or extra character.` }; }
    if (findJsonProblem(text)) return { ok: false, reason: `The ${name} decodes, but it is not valid JSON.` };
    return { text, value: JSON.parse(text) };
  };

  const h = decodePart('header', parts[0]);
  if ('ok' in h) return h;
  if (h.value === null || typeof h.value !== 'object' || Array.isArray(h.value)) return { ok: false, reason: 'The header must be a JSON object.' };
  const p = decodePart('payload', parts[1]);
  if ('ok' in p) return p;

  const header = h.value as Record<string, unknown>;
  return {
    ok: true,
    header,
    payload: p.value,
    headerText: formatJsonText(h.text),
    payloadText: formatJsonText(p.text),
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`,
    alg: typeof header['alg'] === 'string' ? (header['alg'] as string) : '',
  };
}

export const CLAIM_NAMES: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not valid before',
  iat: 'Issued at',
  jti: 'Token ID',
};
export const TIME_CLAIMS = ['iat', 'nbf', 'exp'] as const;

export function isEpochSeconds(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e11; // 1e11 s is year 5138; larger values are almost certainly milliseconds
}

export function describeDuration(totalSeconds: number): string {
  let s = Math.abs(Math.round(totalSeconds));
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const units: [string, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  const parts: string[] = [];
  for (const [name, size] of units) {
    const n = Math.floor(s / size);
    if (n > 0 && parts.length < 2) { parts.push(`${n} ${name}${n === 1 ? '' : 's'}`); s -= n * size; }
  }
  return parts.join(' ');
}

export type ExpiryStatus =
  | { kind: 'no-expiry' }
  | { kind: 'valid'; detail: string }
  | { kind: 'expired'; detail: string }
  | { kind: 'not-yet-valid'; detail: string }
  | { kind: 'unreadable'; detail: string };

/** Whether the token is currently within its validity window, judged by the claims only (the signature is not checked). */
export function expiryStatus(payload: unknown, nowSeconds: number): ExpiryStatus {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return { kind: 'no-expiry' };
  const p = payload as Record<string, unknown>;
  if ('exp' in p && !isEpochSeconds(p['exp'])) return { kind: 'unreadable', detail: 'The exp claim is not a number of seconds, so expiry cannot be worked out.' };
  if ('nbf' in p && isEpochSeconds(p['nbf']) && nowSeconds < p['nbf']) {
    return { kind: 'not-yet-valid', detail: `Not valid for another ${describeDuration(p['nbf'] - nowSeconds)}.` };
  }
  if (!('exp' in p)) return { kind: 'no-expiry' };
  const exp = p['exp'] as number;
  return nowSeconds >= exp
    ? { kind: 'expired', detail: `Expired ${describeDuration(nowSeconds - exp)} ago.` }
    : { kind: 'valid', detail: `Expires in ${describeDuration(exp - nowSeconds)}.` };
}

const HASH: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
export const isHmacAlg = (alg: string) => alg in HASH;

async function hmac(alg: string, secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: HASH[alg] }, false, ['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))));
}

/** Checks an HS256/HS384/HS512 signature against a shared secret, entirely in the browser. */
export async function verifyHmac(token: ParsedJwt, secret: string): Promise<boolean> {
  if (!isHmacAlg(token.alg)) throw new Error('Only HS256, HS384 and HS512 can be checked with a shared secret.');
  const expected = await hmac(token.alg, secret, token.signingInput);
  return expected === token.signature.replace(/=+$/, '');
}

/** Builds a signed HS256 token, used for the example so that it verifies with the example secret. */
export async function signHs256(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = (o: unknown) => bytesToBase64Url(new TextEncoder().encode(JSON.stringify(o)));
  const input = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}`;
  return `${input}.${await hmac('HS256', secret, input)}`;
}
