import { describe, expect, it } from 'vitest';
import { findJsonProblem, formatJsonText, jsonToTypeScript, minifyJsonText, unsafeIntegers } from '@/lib/json-format';

describe('formatJsonText keeps your data exactly as written', () => {
  it('indents nested structures', () => {
    expect(formatJsonText('{"a":1,"b":[1,2,{"c":null}],"d":{}}')).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    {\n      "c": null\n    }\n  ],\n  "d": {}\n}');
  });
  it('supports other indents', () => {
    expect(formatJsonText('{"a":[1]}', '    ')).toBe('{\n    "a": [\n        1\n    ]\n}');
    expect(formatJsonText('{"a":1}', '\t')).toBe('{\n\t"a": 1\n}');
  });
  it('does not round big integers, reorder keys or drop duplicates', () => {
    const src = '{"id":12345678901234567890,"2":"x","1":"y","a":1,"a":2,"f":1.10}';
    const out = formatJsonText(src);
    expect(out).toContain('12345678901234567890');
    expect(out.indexOf('"2"')).toBeLessThan(out.indexOf('"1"'));
    expect(out.match(/"a"/g)).toHaveLength(2);
    expect(out).toContain('1.10');
    // the standard round trip would have changed all of that
    expect(JSON.stringify(JSON.parse(src))).not.toContain('12345678901234567890');
  });
  it('leaves strings untouched, including braces, commas, colons and escapes', () => {
    const src = '{"k":"a, b: {c} [d] \\" \\\\ ","e":"\\u00e9"}';
    expect(JSON.parse(formatJsonText(src))).toEqual(JSON.parse(src));
    expect(formatJsonText(src)).toContain('"a, b: {c} [d] \\" \\\\ "');
  });
  it('round trips with minify', () => {
    const src = '{"a":[1,2,{"b":"x y"}],"c":true}';
    expect(minifyJsonText(formatJsonText(src))).toBe(src);
    expect(minifyJsonText('{ "a" : "x y" ,\n "b" : [ 1 , 2 ] }')).toBe('{"a":"x y","b":[1,2]}');
  });
  it('formats scalars and empty containers', () => {
    expect(formatJsonText('  42 ')).toBe('42');
    expect(formatJsonText('[]')).toBe('[]');
    expect(formatJsonText('"hi"')).toBe('"hi"');
  });
});

describe('unsafeIntegers', () => {
  it('finds whole numbers beyond 2^53 outside strings only', () => {
    expect(unsafeIntegers('{"a":9007199254740993,"b":"12345678901234567890","c":[1,-9007199254740993],"d":1.5e30}')).toEqual(['9007199254740993', '-9007199254740993']);
    expect(unsafeIntegers('{"a":9007199254740991}')).toEqual([]);
  });
});

describe('findJsonProblem explains what is wrong and where', () => {
  it('accepts valid JSON', () => {
    for (const ok of ['{}', '[]', '1', '"x"', 'null', ' {"a":[1,2.5e3,-0.1,true,false,null,"\\u00e9\\n"]} ', '[[[]]]']) expect(findJsonProblem(ok)).toBeNull();
  });
  const cases: Array<[string, string, RegExp]> = [
    ['trailing comma in object', '{"a":1,}', /Trailing comma/],
    ['trailing comma in array', '[1,2,]', /Trailing comma/],
    ['single quotes', "{'a':1}", /double quotes/],
    ['unquoted key', '{a:1}', /double quotes/],
    ['missing comma', '{"a":1 "b":2}', /comma may be missing/],
    ['comment', '{"a":1 // x\n}', /comments/],
    ['NaN', '{"a":NaN}', /NaN, Infinity/],
    ['unterminated string', '{"a":"x', /Unterminated/],
    ['raw newline in string', '{"a":"x\ny"}', /line breaks/],
    ['bad escape', '{"a":"\\q"}', /escape/],
    ['unclosed object', '{"a":1', /not closed/],
    ['unclosed array', '[1,2', /not closed/],
    ['extra text', '{"a":1} x', /after the end/],
    ['empty', '', /end of JSON/],
    ['leading zero', '[01]', /after the end|Expected/],
  ];
  for (const [name, text, re] of cases) {
    it(`reports ${name}`, () => {
      const p = findJsonProblem(text);
      expect(p).not.toBeNull();
      expect(p!.message).toMatch(re);
    });
  }
  it('gives line and column', () => {
    const p = findJsonProblem('{\n  "a": 1,\n  "b": ,\n}')!;
    expect(p.line).toBe(3);
    expect(p.column).toBe(8);
    expect(p.excerpt).toBe('  "b": ,');
  });
  it('agrees with JSON.parse on whether text is valid (random mutations)', () => {
    const base = '{"a":[1,2,{"b":"x","c":null}],"d":true,"e":-1.5e2}';
    const junk = ['', ',', '}', ']', '"', "'", ':', '{', '[', 'x', '1', ' ', '\n', '\\', 'null'];
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let t = 0; t < 4000; t++) {
      let s = base;
      for (let m = 0; m < 1 + Math.floor(rnd() * 3); m++) {
        const pos = Math.floor(rnd() * (s.length + 1));
        s = rnd() < 0.5 ? s.slice(0, pos) + junk[Math.floor(rnd() * junk.length)] + s.slice(pos) : s.slice(0, pos) + s.slice(pos + 1);
      }
      let valid = true;
      try { JSON.parse(s); } catch { valid = false; }
      expect([s, findJsonProblem(s) === null]).toEqual([s, valid]);
    }
  });
});

describe('jsonToTypeScript', () => {
  it('builds an interface and quotes keys that are not identifiers', () => {
    const ts = jsonToTypeScript({ id: 1, 'user-id': 'x', 'first name': 'y', '1st': true, nested: { ok: true } }, 'User');
    expect(ts).toContain('export interface User {');
    expect(ts).toContain('id: number;');
    expect(ts).toContain('"user-id": string;');
    expect(ts).toContain('"first name": string;');
    expect(ts).toContain('"1st": boolean;');
    expect(ts).toContain('nested: {\n    ok: boolean;\n  };');
  });
  it('uses unions for mixed arrays and handles empties and null', () => {
    expect(jsonToTypeScript({ a: [1, 'x'], b: [], c: null, d: {}, e: [1, 2] })).toBe(
      'export interface Root {\n  a: (number | string)[];\n  b: unknown[];\n  c: null;\n  d: Record<string, unknown>;\n  e: number[];\n}',
    );
  });
  it('handles non-object roots and invalid names', () => {
    expect(jsonToTypeScript([1, 2], 'Items')).toBe('export type Items = number[];');
    expect(jsonToTypeScript('x')).toBe('export type Root = string;');
    expect(jsonToTypeScript({ a: 1 }, 'not valid')).toContain('interface Root');
  });
});
