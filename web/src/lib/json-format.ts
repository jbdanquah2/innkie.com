/**
 * JSON helpers that never alter your data. JSON.parse followed by JSON.stringify silently rounds large integers,
 * reorders integer-like keys and drops duplicate keys, so formatting here works on the text itself.
 */

const WS = /\s/;

/** Re-indents valid JSON text. Strings, numbers and key order are copied exactly as written. */
export function formatJsonText(src: string, indent: string = '  '): string {
  let out = '';
  let level = 0;
  let i = 0;
  const n = src.length;
  const nl = () => '\n' + indent.repeat(level);
  while (i < n) {
    const c = src[i];
    if (WS.test(c)) { i++; continue; }
    if (c === '"') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') j += 2;
        else if (src[j] === '"') { j++; break; }
        else j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    if (c === '{' || c === '[') {
      let k = i + 1;
      while (k < n && WS.test(src[k])) k++;
      const close = c === '{' ? '}' : ']';
      if (src[k] === close) { out += c + close; i = k + 1; continue; } // empty {} or []
      level++;
      out += c + nl();
      i++;
      continue;
    }
    if (c === '}' || c === ']') { level--; out += nl() + c; i++; continue; }
    if (c === ',') { out += ',' + nl(); i++; continue; }
    if (c === ':') { out += ': '; i++; continue; }
    let j = i;
    while (j < n && !/[\s,:\]}]/.test(src[j])) j++;
    out += src.slice(i, j);
    i = j;
  }
  return out;
}

/** Removes all insignificant whitespace from valid JSON text. */
export function minifyJsonText(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (WS.test(c)) { i++; continue; }
    if (c === '"') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') j += 2;
        else if (src[j] === '"') { j++; break; }
        else j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Whole numbers in the text that JavaScript cannot hold exactly (beyond 2^53 - 1). Skips strings. */
export function unsafeIntegers(src: string): string[] {
  const found: string[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"') {
      i++;
      while (i < n && src[i] !== '"') i += src[i] === '\\' ? 2 : 1;
      i++;
      continue;
    }
    if (c === '-' || (c >= '0' && c <= '9')) {
      let j = i;
      while (j < n && /[0-9eE+\-.]/.test(src[j])) j++;
      const tok = src.slice(i, j);
      if (/^-?\d+$/.test(tok)) {
        try { if (BigInt(tok) > BigInt(Number.MAX_SAFE_INTEGER) || BigInt(tok) < BigInt(Number.MIN_SAFE_INTEGER)) found.push(tok); } catch { /* ignore */ }
      }
      i = j;
      continue;
    }
    i++;
  }
  return found;
}

export interface JsonProblem {
  message: string;
  /** Zero-based index into the text where the problem was found. */
  index: number;
  line: number;
  column: number;
  /** The offending line, for showing under the message. */
  excerpt: string;
}

class JsonSyntaxError extends Error {
  constructor(message: string, public index: number) { super(message); }
}

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/;

/** A small strict JSON parser used only to explain *where* and *why* text is not valid JSON. */
function check(text: string): void {
  let i = 0;
  const n = text.length;
  const skip = () => {
    for (;;) {
      while (i < n && WS.test(text[i])) i++;
      if (text.startsWith('//', i) || text.startsWith('/*', i)) throw new JsonSyntaxError('JSON does not allow comments', i);
      return;
    }
  };
  const describe = (c: string | undefined) => (c === undefined ? 'the end of the text' : `"${c}"`);

  const value = (): void => {
    skip();
    const c = text[i];
    if (c === undefined) throw new JsonSyntaxError('Unexpected end of JSON: a value is missing', i);
    if (c === '{') return object();
    if (c === '[') return array();
    if (c === '"') return string();
    if (c === "'") throw new JsonSyntaxError('Strings must use double quotes ("), not single quotes (\')', i);
    if (text.startsWith('true', i)) { i += 4; return; }
    if (text.startsWith('false', i)) { i += 5; return; }
    if (text.startsWith('null', i)) { i += 4; return; }
    if (/^(NaN|Infinity|-Infinity|undefined)/.test(text.slice(i))) throw new JsonSyntaxError('NaN, Infinity and undefined are not valid JSON values', i);
    const m = NUMBER.exec(text.slice(i));
    if (m) { i += m[0].length; return; }
    if (c === '-' || (c >= '0' && c <= '9')) throw new JsonSyntaxError('Invalid number', i);
    throw new JsonSyntaxError(`Unexpected ${describe(c)}: expected a value`, i);
  };

  const string = (): void => {
    const start = i;
    i++; // opening quote
    while (i < n) {
      const c = text[i];
      if (c === '"') { i++; return; }
      if (c === '\\') {
        const e = text[i + 1];
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) throw new JsonSyntaxError('Invalid \\u escape: it needs four hex digits', i);
          i += 6;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i += 2;
        else throw new JsonSyntaxError(`Invalid escape sequence "\\${e ?? ''}"`, i);
        continue;
      }
      if (c < ' ') throw new JsonSyntaxError('Strings cannot contain raw line breaks or tabs; write them as \\n or \\t', i);
      i++;
    }
    throw new JsonSyntaxError('Unterminated string: the closing double quote is missing', start);
  };

  const object = (): void => {
    i++; // {
    skip();
    if (text[i] === '}') { i++; return; }
    for (;;) {
      skip();
      const c = text[i];
      if (c === '}') throw new JsonSyntaxError('Trailing comma: remove the comma before "}"', i);
      if (c !== '"') {
        if (c === "'") throw new JsonSyntaxError('Property names must use double quotes (")', i);
        throw new JsonSyntaxError(c === undefined ? 'Unexpected end of JSON inside an object' : `Property names must be in double quotes, found ${describe(c)}`, i);
      }
      string();
      skip();
      if (text[i] !== ':') throw new JsonSyntaxError(`Expected ":" after the property name, found ${describe(text[i])}`, i);
      i++;
      value();
      skip();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '}') { i++; return; }
      throw new JsonSyntaxError(text[i] === undefined ? 'Unexpected end of JSON: the object is not closed with "}"' : `Expected "," or "}" but found ${describe(text[i])}. A comma may be missing`, i);
    }
  };

  const array = (): void => {
    i++; // [
    skip();
    if (text[i] === ']') { i++; return; }
    for (;;) {
      skip();
      if (text[i] === ']') throw new JsonSyntaxError('Trailing comma: remove the comma before "]"', i);
      value();
      skip();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === ']') { i++; return; }
      throw new JsonSyntaxError(text[i] === undefined ? 'Unexpected end of JSON: the array is not closed with "]"' : `Expected "," or "]" but found ${describe(text[i])}. A comma may be missing`, i);
    }
  };

  value();
  skip();
  if (i < n) throw new JsonSyntaxError(`Unexpected ${describe(text[i])} after the end of the JSON value`, i);
}

/** null when the text is valid JSON, otherwise where and why it is not. */
export function findJsonProblem(text: string): JsonProblem | null {
  try {
    check(text);
    return null;
  } catch (e) {
    if (!(e instanceof JsonSyntaxError)) throw e;
    const before = text.slice(0, e.index);
    const line = before.split('\n').length;
    const column = e.index - before.lastIndexOf('\n');
    const excerpt = text.split('\n')[line - 1] ?? '';
    return { message: e.message, index: e.index, line, column, excerpt };
  }
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** A TypeScript interface for a JSON value. Keys that are not identifiers are quoted; arrays become unions. */
export function jsonToTypeScript(value: unknown, name = 'Root', indent = '  '): string {
  const gen = (v: unknown, depth: number): string => {
    if (v === null) return 'null';
    if (Array.isArray(v)) {
      if (v.length === 0) return 'unknown[]';
      const types = [...new Set(v.map((x) => gen(x, depth)))];
      const body = types.length === 1 ? types[0] : types.join(' | ');
      return types.length === 1 && !body.includes('|') ? `${body}[]` : `(${body})[]`;
    }
    if (typeof v === 'object') {
      const keys = Object.keys(v as object);
      if (keys.length === 0) return 'Record<string, unknown>';
      const pad = indent.repeat(depth + 1);
      const lines = keys.map((k) => `${pad}${IDENT.test(k) ? k : JSON.stringify(k)}: ${gen((v as Record<string, unknown>)[k], depth + 1)};`);
      return `{\n${lines.join('\n')}\n${indent.repeat(depth)}}`;
    }
    return typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string' ? typeof v : 'unknown';
  };
  const safeName = IDENT.test(name) ? name : 'Root';
  const top = gen(value, 0);
  return top.startsWith('{') ? `export interface ${safeName} ${top}` : `export type ${safeName} = ${top};`;
}
