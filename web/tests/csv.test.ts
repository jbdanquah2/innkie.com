import { describe, expect, it } from 'vitest';
import { coerceCell, csvField, csvToObjects, detectDelimiter, jsonToCsv, parseCsv, toCsv } from '@/lib/csv';

const opts = { delimiter: ',', detectTypes: true, emptyAsNull: false };

describe('parseCsv (RFC 4180)', () => {
  it('splits simple rows, with LF or CRLF, and ignores the final newline', () => {
    expect(parseCsv('a,b\n1,2\n', ',').rows).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a,b\r\n1,2\r\n', ',').rows).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('keeps delimiters, line breaks and doubled quotes inside quoted values', () => {
    expect(parseCsv('a,b\n"x, y","line1\nline2"\n"say ""hi""",z', ',').rows).toEqual([['a', 'b'], ['x, y', 'line1\nline2'], ['say "hi"', 'z']]);
  });
  it('drops a leading BOM and skips blank lines', () => {
    expect(parseCsv('﻿id,name\n\n1,A\n\n', ',').rows).toEqual([['id', 'name'], ['1', 'A']]);
  });
  it('keeps empty cells and handles other delimiters', () => {
    expect(parseCsv('a,,c\n,,', ',').rows).toEqual([['a', '', 'c'], ['', '', '']]);
    expect(parseCsv('a;b\n1;2', ';').rows).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\tb\n1\t2', '\t').rows).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('flags an unclosed quote', () => {
    expect(parseCsv('a\n"oops', ',').unterminated).toBe(true);
    expect(parseCsv('a\n"fine"', ',').unterminated).toBe(false);
  });
  it('treats a quote in the middle of an unquoted value as literal text', () => {
    expect(parseCsv('5" pipe,x', ',').rows).toEqual([['5" pipe', 'x']]);
  });
  it('round trips awkward values through toCsv (property test)', () => {
    const pool = ['', 'plain', 'a,b', 'say "hi"', 'line1\nline2', ' padded ', ';', 'tab\there', '"', ',,', 'é日本'];
    let seed = 11;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (const delimiter of [',', ';', '\t', '|']) {
      for (let t = 0; t < 300; t++) {
        const cols = 1 + Math.floor(rnd() * 4);
        const grid = Array.from({ length: 1 + Math.floor(rnd() * 5) }, () => Array.from({ length: cols }, () => pool[Math.floor(rnd() * pool.length)]));
        // a row that is entirely one empty cell cannot survive a round trip (it is a blank line), so skip that case
        if (cols === 1 && grid.some((r) => r[0] === '')) continue;
        expect(parseCsv(toCsv(grid, delimiter), delimiter).rows).toEqual(grid);
      }
    }
  });
});

describe('detectDelimiter', () => {
  it('finds the delimiter that splits every line the same way', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\n1\t2')).toBe('\t');
    expect(detectDelimiter('a|b\n1|2')).toBe('|');
    expect(detectDelimiter('a;b\n"1,5";2')).toBe(';');
    expect(detectDelimiter('just one column')).toBe(',');
    // quoted values that hold separators or line breaks must not fool it
    expect(detectDelimiter(['id;name;note', '1;"Acme; Inc";"line one', 'line two"', '2;Globex;"say ""hi"""'].join('\n'))).toBe(';');
    expect(detectDelimiter(['a;b;c', '"x,y,z";"1,2";3', '"p,q";r;s'].join('\n'))).toBe(';');
    expect(detectDelimiter(['name\tnote', 'A\t"one, two, three"', 'B\t"x, y"'].join('\n'))).toBe('\t');
    expect(detectDelimiter('﻿id,name\n1,A\n2,B')).toBe(',');
    expect(detectDelimiter('')).toBe(',');
  });
});

describe('coerceCell keeps anything that would not survive being a number', () => {
  it('converts plain numbers and booleans', () => {
    expect(coerceCell('42', opts)).toBe(42);
    expect(coerceCell('-3.5', opts)).toBe(-3.5);
    expect(coerceCell('0.25', opts)).toBe(0.25);
    expect(coerceCell('TRUE', opts)).toBe(true);
    expect(coerceCell('false', opts)).toBe(false);
    expect(coerceCell(' 7 ', opts)).toBe(7);
  });
  it('leaves codes, phone numbers, long IDs and odd forms as text', () => {
    for (const v of ['007', '+15551234567', '12345678901234567890', '1e5', '0x10', '1,5', 'Infinity', 'NaN', '1.', '.5', '12-34']) {
      expect(coerceCell(v, opts)).toBe(v);
    }
  });
  it('respects the options', () => {
    expect(coerceCell('42', { detectTypes: false, emptyAsNull: false })).toBe('42');
    expect(coerceCell('', { detectTypes: true, emptyAsNull: true })).toBeNull();
    expect(coerceCell('', opts)).toBe('');
  });
});

describe('csvToObjects', () => {
  it('builds objects with typed values and keeps multi-line cells in one row', () => {
    const r = csvToObjects('id,name,note,active\n101,"Acme, Inc","two\nlines",true\n102,Globex,,false', opts);
    expect(r.rows).toEqual([
      { id: 101, name: 'Acme, Inc', note: 'two\nlines', active: true },
      { id: 102, name: 'Globex', note: '', active: false },
    ]);
    expect(r.warnings).toEqual([]);
  });
  it('removes the BOM from the first column name', () => {
    expect(csvToObjects('﻿id,x\n1,2', opts).columns).toEqual(['id', 'x']);
  });
  it('names blank and repeated columns, and reports ragged rows', () => {
    const r = csvToObjects('a,,a\n1,2,3,4\n5', opts);
    expect(r.columns).toEqual(['a', 'column_2', 'a_2', 'column_4']);
    expect(r.rows[0]).toEqual({ a: 1, column_2: 2, a_2: 3, column_4: 4 });
    expect(r.rows[1]).toEqual({ a: 5, column_2: '', a_2: '' });
    expect(r.warnings.join(' ')).toMatch(/more cells/);
    expect(r.warnings.join(' ')).toMatch(/fewer cells/);
    expect(r.warnings.join(' ')).toMatch(/repeat/);
  });
  it('returns no rows for a header-only file and nothing for empty input', () => {
    expect(csvToObjects('a,b', opts)).toMatchObject({ rows: [], columns: ['a', 'b'] });
    expect(csvToObjects('', opts).rows).toEqual([]);
  });
});

describe('csvField / toCsv', () => {
  it('quotes only when needed and doubles quotes', () => {
    expect(csvField('plain', ',')).toBe('plain');
    expect(csvField('a,b', ',')).toBe('"a,b"');
    expect(csvField('a,b', ';')).toBe('a,b');
    expect(csvField('say "hi"', ',')).toBe('"say ""hi"""');
    expect(csvField('l1\nl2', ',')).toBe('"l1\nl2"');
    expect(csvField(' x', ',')).toBe('" x"');
  });
});

describe('jsonToCsv', () => {
  const run = (j: string, extra: Partial<{ delimiter: string; flatten: boolean }> = {}) => jsonToCsv(j, { delimiter: ',', flatten: true, ...extra });
  it('flattens nested objects with dotted column names and keeps first-seen column order', () => {
    const r = run('[{"id":1,"stats":{"clicks":120,"conv":5}},{"id":2,"extra":true,"stats":{"clicks":450}}]');
    expect(r.columns).toEqual(['id', 'stats.clicks', 'stats.conv', 'extra']);
    expect(r.csv).toBe('id,stats.clicks,stats.conv,extra\r\n1,120,5,\r\n2,450,,true');
    expect(r.rowCount).toBe(2);
  });
  it('writes strings with CSV escaping, not JSON escaping', () => {
    const r = run('[{"q":"say \\"hi\\"","n":"a,b","m":"l1\\nl2"}]');
    expect(r.csv).toBe('q,n,m\r\n"say ""hi""","a,b","l1\nl2"');
    expect(parseCsv(r.csv, ',').rows[1]).toEqual(['say "hi"', 'a,b', 'l1\nl2']);
  });
  it('uses the chosen delimiter', () => {
    expect(run('[{"a":"x;y","b":1}]', { delimiter: ';' }).csv).toBe('a;b\r\n"x;y";1');
  });
  it('keeps big numbers and decimals exactly as written', () => {
    expect(run('[{"id":12345678901234567890,"p":1.10,"e":1e21}]').csv).toBe('id,p,e\r\n12345678901234567890,1.10,1e21');
  });
  it('puts arrays and (when not flattening) objects in one cell as JSON', () => {
    expect(run('[{"tags":["a","b"],"o":{"x":1}}]').csv).toBe('tags,o.x\r\n"[""a"",""b""]",1');
    expect(run('[{"o":{"x":1}}]', { flatten: false }).csv).toBe('o\r\n"{""x"":1}"');
  });
  it('handles a single object, primitives, nulls and empty input', () => {
    expect(run('{"a":1,"b":null}').csv).toBe('a,b\r\n1,');
    expect(run('[1,"two",true]').csv).toBe('value\r\n1\r\ntwo\r\ntrue');
    expect(run('[]').csv).toBe('');
  });
  it('explains invalid JSON with a position', () => {
    const r = run('[{"a":1,}]');
    expect(r.csv).toBe('');
    expect(r.error).toMatch(/Line 1, column 9.*Trailing comma/);
  });
});
