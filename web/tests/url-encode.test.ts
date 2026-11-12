import { describe, expect, it } from 'vitest';
import { decodeText, encodeText, parseUrl } from '@/lib/url-encode';

const enc = (t: string, o: Partial<{ scope: 'component' | 'full'; strict: boolean; spaceAsPlus: boolean }> = {}) => encodeText(t, { scope: 'component', strict: false, spaceAsPlus: false, ...o });
const dec = (t: string, o: Partial<{ scope: 'component' | 'full'; plusAsSpace: boolean }> = {}) => decodeText(t, { scope: 'component', plusAsSpace: false, ...o });

describe('encodeText', () => {
  it('encodes a component, escaping reserved characters', () => {
    expect(enc('a b&c=d/é#').output).toBe('a%20b%26c%3Dd%2F%C3%A9%23');
  });
  it('encodes a full URL but keeps its structure', () => {
    expect(enc('https://x.y/a b?q=é&z=1', { scope: 'full' }).output).toBe('https://x.y/a%20b?q=%C3%A9&z=1');
  });
  it('can also escape ! \' ( ) * (strict RFC 3986)', () => {
    expect(enc("it's (ok)!*").output).toBe("it's%20(ok)!*");
    expect(enc("it's (ok)!*", { strict: true }).output).toBe('it%27s%20%28ok%29%21%2A');
  });
  it('can write spaces as + for form data, escaping a literal + so it survives', () => {
    expect(enc('a b+c', { spaceAsPlus: true }).output).toBe('a+b%2Bc');
    expect(dec('a+b%2Bc', { plusAsSpace: true }).output).toBe('a b+c');
  });
  it('reports text it cannot encode', () => {
    expect(enc('\ud800').error).toMatch(/cannot be encoded/);
    expect(enc('')).toEqual({ output: '', error: null });
  });
});

describe('decodeText', () => {
  it('decodes multi-byte characters and round trips', () => {
    expect(dec('%E6%97%A5%E6%9C%AC%20%F0%9F%9A%80').output).toBe('日本 🚀');
    const v = 'a+b c/ü?&=#é';
    expect(dec(enc(v).output).output).toBe(v);
  });
  it('keeps + literal unless asked to treat it as a space', () => {
    expect(dec('a+b').output).toBe('a+b');
    expect(dec('a+b', { plusAsSpace: true }).output).toBe('a b');
  });
  it('decodes what it can and reports the rest instead of failing', () => {
    const r = dec('caf%E9 ok%20fine');
    expect(r.output).toBe('caf%E9 ok fine');
    expect(r.problems).toEqual([{ index: 3, sequence: '%E9', reason: 'not valid UTF-8' }]);
  });
  it('reports a stray percent sign', () => {
    expect(dec('100%').problems).toMatchObject([{ index: 3, reason: expect.stringMatching(/not followed by two hex/) }]);
    expect(dec('a%2').output).toBe('a%2');
    expect(dec('%E0%A4%A').problems.length).toBeGreaterThan(0);
  });
  it('keeps the valid part of a broken multi-byte sequence', () => {
    const r = dec('ok%E6%97x');
    expect(r.output.startsWith('ok')).toBe(true);
    expect(r.problems.length).toBeGreaterThan(0);
  });
  it('spots double encoding', () => {
    const r = dec('https%253A%252F%252Fx.y');
    expect(r.output).toBe('https%3A%2F%2Fx.y');
    expect(r.doubleEncoded).toBe(true);
    expect(dec('a%20b').doubleEncoded).toBe(false);
    // a sequence that could not be decoded is not a sign of double encoding
    expect(dec('caf%E9 ok%20fine').doubleEncoded).toBe(false);
    expect(dec('caf%E9 and %2541').doubleEncoded).toBe(true);
  });
  it('leaves reserved characters escaped in full-URL scope', () => {
    expect(dec('a%2Fb%20c%3Fq%3D1%26x', { scope: 'full' }).output).toBe('a%2Fb c%3Fq%3D1%26x');
    expect(dec('a%2Fb%20c', { scope: 'component' }).output).toBe('a/b c');
  });
  it('handles empty input and plain text', () => {
    expect(dec('')).toEqual({ output: '', problems: [], doubleEncoded: false });
    expect(dec('plain text').output).toBe('plain text');
  });
});

describe('parseUrl', () => {
  it('splits a URL and decodes its parameters', () => {
    const p = parseUrl('https://user@example.com:8080/a%20b/c?q=hello+world&tag=caf%C3%A9&empty=#frag%20x')!;
    expect(p).toMatchObject({ scheme: 'https', username: 'user', host: 'example.com', port: '8080', path: '/a b/c', hash: 'frag x' });
    expect(p.params).toEqual([{ key: 'q', value: 'hello world' }, { key: 'tag', value: 'café' }, { key: 'empty', value: '' }]);
  });
  it('returns null for things that are not absolute URLs', () => {
    for (const t of ['', 'example.com/x', 'just text', '/path?a=1']) expect(parseUrl(t)).toBeNull();
  });
});
