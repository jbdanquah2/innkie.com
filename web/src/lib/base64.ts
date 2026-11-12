/** Base64 helpers that work on bytes, so text, images and any other file survive exactly. All local. */

export interface EncodeOptions {
  /** Use - and _ instead of + and / (Base64URL, as in JWTs and URLs). */
  urlSafe: boolean;
  /** Keep the trailing = padding. */
  padding: boolean;
}

export function bytesToBase64(bytes: Uint8Array, opts: EncodeOptions = { urlSafe: false, padding: true }): string {
  let bin = '';
  const CHUNK = 0x8000; // avoids "too many arguments" for large inputs
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  let out = btoa(bin);
  if (opts.urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_');
  if (!opts.padding) out = out.replace(/=+$/, '');
  return out;
}

export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export interface DecodedBase64 {
  bytes: Uint8Array;
  /** The input used - and _ rather than + and /. */
  urlSafe: boolean;
  /** Set when the input was a data: URI. */
  mime: string | null;
}
export interface Base64Failure { error: string }

const DATA_URI = /^data:([^;,]*)((?:;[^;,]*)*);base64,/i;

/**
 * Accepts standard and URL-safe Base64, with or without padding, with whitespace and line breaks,
 * and a leading data: URI prefix. Returns a specific reason when the text cannot be decoded.
 */
export function base64ToBytes(input: string): DecodedBase64 | Base64Failure {
  let text = input.trim();
  let mime: string | null = null;
  const m = DATA_URI.exec(text);
  if (m) { mime = m[1] || null; text = text.slice(m[0].length); }
  text = text.replace(/\s+/g, '');
  const body = text.replace(/=+$/, '');
  const bad = /[^A-Za-z0-9+/_-]/.exec(body);
  if (bad) {
    const where = bad.index + 1;
    return { error: `The character "${bad[0]}" at position ${where} is not valid in Base64. Base64 uses letters, digits, + and / (or - and _), with = at the end.` };
  }
  if (text.length - body.length > 2) return { error: 'There are too many = padding characters at the end.' };
  if (body.length % 4 === 1) return { error: 'The length is not valid for Base64. A character may be missing or extra.' };
  const urlSafe = /[-_]/.test(body) && !/[+/]/.test(body);
  let std = body.replace(/-/g, '+').replace(/_/g, '/');
  while (std.length % 4) std += '=';
  try {
    const bin = atob(std);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, urlSafe, mime };
  } catch {
    return { error: 'This is not valid Base64.' };
  }
}

export type BytesKind =
  | { kind: 'text'; text: string }
  | { kind: 'binary'; mime: string | null; extension: string; label: string };

const SIGNATURES: { test: (b: Uint8Array) => boolean; mime: string; ext: string; label: string }[] = [
  { test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47, mime: 'image/png', ext: 'png', label: 'PNG image' },
  { test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, mime: 'image/jpeg', ext: 'jpg', label: 'JPEG image' },
  { test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38, mime: 'image/gif', ext: 'gif', label: 'GIF image' },
  { test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, mime: 'image/webp', ext: 'webp', label: 'WebP image' },
  { test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, mime: 'application/pdf', ext: 'pdf', label: 'PDF document' },
  { test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04, mime: 'application/zip', ext: 'zip', label: 'ZIP archive' },
  { test: (b) => b[0] === 0x1f && b[1] === 0x8b, mime: 'application/gzip', ext: 'gz', label: 'gzip data' },
];

/** Text if the bytes are valid UTF-8 without control-character noise, otherwise a guess at what the binary data is. */
export function classifyBytes(bytes: Uint8Array, declaredMime: string | null = null): BytesKind {
  const sig = SIGNATURES.find((s) => s.test(bytes));
  if (!sig) {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      let noise = 0;
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c < 32 && c !== 9 && c !== 10 && c !== 13) noise++;
      }
      if (noise === 0 || noise / Math.max(1, text.length) < 0.01) return { kind: 'text', text };
    } catch { /* not UTF-8 */ }
  }
  if (sig) return { kind: 'binary', mime: declaredMime || sig.mime, extension: sig.ext, label: sig.label };
  return { kind: 'binary', mime: declaredMime, extension: 'bin', label: 'Binary data' };
}

export function hexPreview(bytes: Uint8Array, count = 48): string {
  return Array.from(bytes.subarray(0, count), (b) => b.toString(16).padStart(2, '0')).join(' ') + (bytes.length > count ? ' …' : '');
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n.toLocaleString('en-US')} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
