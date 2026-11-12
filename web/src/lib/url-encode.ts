/** Percent-encoding helpers that explain problems instead of failing, and split URLs into readable parts. */

export type Scope = 'component' | 'full';

export interface EncodeOptions {
  scope: Scope;
  /** Also escape ! ' ( ) *, which encodeURIComponent leaves alone (RFC 3986 strict). */
  strict: boolean;
  /** Write spaces as + (application/x-www-form-urlencoded) instead of %20. Component scope only. */
  spaceAsPlus: boolean;
}

export function encodeText(text: string, o: EncodeOptions): { output: string; error: string | null } {
  if (!text) return { output: '', error: null };
  try {
    let out = o.scope === 'component' ? encodeURIComponent(text) : encodeURI(text);
    if (o.strict) out = out.replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    if (o.spaceAsPlus && o.scope === 'component') out = out.replace(/%20/g, '+');
    return { output: out, error: null };
  } catch {
    return { output: '', error: 'The text contains a character that cannot be encoded (an unpaired surrogate, usually from a broken emoji).' };
  }
}

export interface DecodeOptions {
  scope: Scope;
  /** Read + as a space (form encoding). Component scope only. */
  plusAsSpace: boolean;
}

export interface DecodeProblem {
  /** Zero-based index in the input. */
  index: number;
  sequence: string;
  reason: string;
}

export interface DecodeResult {
  output: string;
  problems: DecodeProblem[];
  /** Decoding produced text that still contains percent sequences, so it was probably encoded twice. */
  doubleEncoded: boolean;
}

const RUN = /(?:%[0-9A-Fa-f]{2})+/g;

/** Decodes one chunk of %XX bytes. The full-URL scope uses decodeURI, which leaves reserved characters escaped. */
function decodeChunk(chunk: string, scope: Scope): string {
  return scope === 'component' ? decodeURIComponent(chunk) : decodeURI(chunk);
}

/**
 * Decodes everything that can be decoded and leaves the rest as written, listing what could not be decoded
 * and why (a stray %, or bytes that are not valid UTF-8, often from an older Latin-1 encoder).
 */
export function decodeText(input: string, o: DecodeOptions): DecodeResult {
  const text = o.plusAsSpace && o.scope === 'component' ? input.replace(/\+/g, ' ') : input;
  const problems: DecodeProblem[] = [];
  let anyDecoded = false;

  const withRuns = text.replace(RUN, (run, offset: number) => {
    try {
      const d = decodeChunk(run, o.scope);
      anyDecoded = true;
      return d;
    } catch {
      // Decode character by character: take 1 to 4 bytes at a time, keep what is not valid UTF-8.
      let out = '';
      const bytes = run.match(/%[0-9A-Fa-f]{2}/g) as string[];
      for (let i = 0; i < bytes.length; ) {
        let done = false;
        for (let len = 1; len <= 4 && i + len <= bytes.length; len++) {
          try {
            out += decodeChunk(bytes.slice(i, i + len).join(''), o.scope);
            anyDecoded = true;
            i += len;
            done = true;
            break;
          } catch { /* try a longer sequence */ }
        }
        if (!done) {
          problems.push({ index: offset + i * 3, sequence: bytes[i], reason: 'not valid UTF-8' });
          out += bytes[i];
          i++;
        }
      }
      return out;
    }
  });

  // A % that is not followed by two hex digits is not an escape at all.
  for (const m of text.matchAll(/%(?![0-9A-Fa-f]{2})/g)) {
    problems.push({ index: m.index ?? 0, sequence: text.slice(m.index ?? 0, (m.index ?? 0) + 3), reason: 'a % that is not followed by two hex digits' });
  }
  problems.sort((a, b) => a.index - b.index);
  // Sequences we deliberately left in place (not valid UTF-8) do not count as a sign of double encoding.
  const leftover = problems.filter((p) => p.reason === 'not valid UTF-8').length;
  const remaining = (withRuns.match(/%[0-9A-Fa-f]{2}/g) ?? []).length;
  return { output: withRuns, problems, doubleEncoded: anyDecoded && remaining > leftover };
}

export interface UrlParts {
  scheme: string;
  username: string;
  host: string;
  port: string;
  path: string;
  hash: string;
  params: { key: string; value: string }[];
}

/** Splits an absolute URL into its parts, with query parameters decoded. null when the text is not an absolute URL. */
export function parseUrl(text: string): UrlParts | null {
  const t = text.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return null;
  try {
    const u = new URL(t);
    const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
    return {
      scheme: u.protocol.replace(/:$/, ''),
      username: safeDecode(u.username),
      host: u.hostname,
      port: u.port,
      path: safeDecode(u.pathname),
      hash: safeDecode(u.hash.replace(/^#/, '')),
      params: Array.from(u.searchParams.entries(), ([key, value]) => ({ key, value })),
    };
  } catch {
    return null;
  }
}
