import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, classifyBytes, hexPreview, textToBytes } from '@/lib/base64';

const dec = (s: string) => { const r = base64ToBytes(s); if ('error' in r) throw new Error(r.error); return r; };

describe('encoding', () => {
  it('encodes text exactly, including surrounding whitespace and emoji', () => {
    expect(bytesToBase64(textToBytes('Man'))).toBe('TWFu');
    expect(bytesToBase64(textToBytes('hello\n'))).toBe('aGVsbG8K'); // the trailing newline is part of the data
    expect(bytesToBase64(textToBytes(' hi '))).not.toBe(bytesToBase64(textToBytes('hi')));
    expect(bytesToBase64(textToBytes('iNNkie 🚀'))).toBe('aU5Oa2llIPCfmoA=');
  });
  it('supports URL-safe output and removing padding', () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe, 0x3e]); // standard form has + and /
    expect(bytesToBase64(bytes)).toBe('+//+Pg==');
    expect(bytesToBase64(bytes, { urlSafe: true, padding: true })).toBe('-__-Pg==');
    expect(bytesToBase64(bytes, { urlSafe: true, padding: false })).toBe('-__-Pg');
  });
  it('handles large inputs without overflowing the call stack', () => {
    const big = new Uint8Array(3_000_000).map((_, i) => i % 251);
    const back = dec(bytesToBase64(big)).bytes;
    expect(back.length).toBe(big.length);
    expect(back[2_999_999]).toBe(big[2_999_999]);
  });
});

describe('decoding', () => {
  it('accepts standard, URL-safe and unpadded input, and reports which it was', () => {
    expect(new TextDecoder().decode(dec('TWFu').bytes)).toBe('Man');
    expect(dec('+//+Pg==').urlSafe).toBe(false);
    const u = dec('-__-Pg');
    expect(Array.from(u.bytes)).toEqual([0xfb, 0xff, 0xfe, 0x3e]);
    expect(u.urlSafe).toBe(true);
    expect(Array.from(dec('+//+Pg').bytes)).toEqual([0xfb, 0xff, 0xfe, 0x3e]);
  });
  it('ignores whitespace and line breaks (MIME style)', () => {
    expect(new TextDecoder().decode(dec('aGVs\r\nbG8g\n d29y bGQ=').bytes)).toBe('hello world');
  });
  it('reads a data: URI and reports its type', () => {
    const r = dec('data:image/png;base64,iVBORw0KGgo=');
    expect(r.mime).toBe('image/png');
    expect(r.bytes[0]).toBe(0x89);
    expect(dec('data:text/plain;charset=utf-8;base64,SGk=').mime).toBe('text/plain');
  });
  it('gives specific reasons for invalid input', () => {
    const err = (s: string) => { const r = base64ToBytes(s); return 'error' in r ? r.error : ''; };
    expect(err('ab$d')).toMatch(/"\$" at position 3/);
    expect(err('abcde')).toMatch(/length/);
    expect(err('ab===')).toMatch(/padding/);
    expect(err('QQ=A')).toMatch(/"=" at position 3/);
  });
  it('round trips random bytes in every mode (property test)', () => {
    let seed = 5;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let t = 0; t < 500; t++) {
      const bytes = Uint8Array.from({ length: Math.floor(rnd() * 200) }, () => Math.floor(rnd() * 256));
      for (const opts of [{ urlSafe: false, padding: true }, { urlSafe: true, padding: false }, { urlSafe: true, padding: true }, { urlSafe: false, padding: false }]) {
        expect(Array.from(dec(bytesToBase64(bytes, opts)).bytes)).toEqual(Array.from(bytes));
      }
    }
  });
});

describe('classifyBytes', () => {
  it('returns text for UTF-8 and keeps it exactly', () => {
    expect(classifyBytes(textToBytes('{"a":12345678901234567890}\n'))).toEqual({ kind: 'text', text: '{"a":12345678901234567890}\n' });
    expect(classifyBytes(textToBytes('Zoë 日本 🚀'))).toEqual({ kind: 'text', text: 'Zoë 日本 🚀' });
    expect(classifyBytes(new Uint8Array([]))).toEqual({ kind: 'text', text: '' });
  });
  it('recognises common file types by their first bytes', () => {
    expect(classifyBytes(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toMatchObject({ kind: 'binary', mime: 'image/png', extension: 'png' });
    expect(classifyBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toMatchObject({ extension: 'jpg' });
    expect(classifyBytes(textToBytes('%PDF-1.7 ...'))).toMatchObject({ extension: 'pdf' });
    expect(classifyBytes(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]))).toMatchObject({ extension: 'zip' });
  });
  it('treats invalid UTF-8 and control-heavy data as binary', () => {
    expect(classifyBytes(Uint8Array.from([0xff, 0xfe, 0xfd]))).toMatchObject({ kind: 'binary', extension: 'bin' });
    expect(classifyBytes(Uint8Array.from([0, 1, 2, 3, 4, 5, 65, 66]))).toMatchObject({ kind: 'binary' });
  });
  it('prefers the type a data: URI declared', () => {
    expect(classifyBytes(Uint8Array.from([0xff, 0xfe]), 'application/x-thing')).toMatchObject({ mime: 'application/x-thing' });
  });
});

describe('hexPreview', () => {
  it('shows the first bytes', () => {
    expect(hexPreview(Uint8Array.from([0, 255, 16]))).toBe('00 ff 10');
    expect(hexPreview(new Uint8Array(100), 4)).toBe('00 00 00 00 …');
  });
});
