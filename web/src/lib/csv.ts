import { findJsonProblem } from './json-format';

/** CSV <-> JSON conversion that follows RFC 4180 and never alters values it is not asked to. */

export type Delimiter = ',' | ';' | '\t' | '|';
export const DELIMITERS: { id: Delimiter; label: string }[] = [
  { id: ',', label: 'Comma' },
  { id: ';', label: 'Semicolon' },
  { id: '\t', label: 'Tab' },
  { id: '|', label: 'Pipe' },
];

export interface CsvParse {
  rows: string[][];
  /** True when a quoted value was never closed. */
  unterminated: boolean;
}

/** Quoted values may contain delimiters, line breaks and doubled quotes. A leading BOM (from Excel) is dropped. */
export function parseCsv(text: string, delimiter: string): CsvParse {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = src.length;
  const endRow = () => { row.push(field); rows.push(row); row = []; field = ''; };
  while (i < n) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === '') { inQuotes = true; i++; continue; }
    if (c === delimiter) { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { if (src[i + 1] === '\n') i++; endRow(); i++; continue; }
    if (c === '\n') { endRow(); i++; continue; }
    field += c;
    i++;
  }
  if (field !== '' || row.length > 0 || inQuotes) { row.push(field); rows.push(row); }
  return { rows: rows.filter((r) => !(r.length === 1 && r[0] === '')), unterminated: inQuotes };
}

/**
 * Picks the separator that turns the start of the text into a regular table: the same number of columns (at least two)
 * on as many rows as possible. It parses with each candidate, so quoted values that contain separators or line
 * breaks do not confuse it. Comma when nothing fits.
 */
export function detectDelimiter(text: string): Delimiter {
  const LIMIT = 20000;
  const sample = text.replace(/^﻿/, '').slice(0, LIMIT);
  let best: Delimiter = ',';
  let bestScore = 0;
  for (const d of DELIMITERS) {
    let rows = parseCsv(sample, d.id).rows;
    if (text.length > LIMIT) rows = rows.slice(0, -1); // the sample may end in the middle of a row
    if (rows.length === 0) continue;
    const counts = new Map<number, number>();
    for (const r of rows) counts.set(r.length, (counts.get(r.length) ?? 0) + 1);
    let cols = 0;
    let freq = 0;
    for (const [c, f] of counts) if (f > freq || (f === freq && c > cols)) { cols = c; freq = f; }
    if (cols < 2) continue;
    const score = (freq / rows.length) * 100 + cols; // regularity first, then more columns
    if (score > bestScore) { best = d.id; bestScore = score; }
  }
  return best;
}

export interface CsvToJsonOptions {
  delimiter: string;
  /** Turn plain numbers and true/false into JSON numbers and booleans. */
  detectTypes: boolean;
  emptyAsNull: boolean;
}

const PLAIN_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/**
 * Only numbers that survive the trip unchanged become numbers: no leading zeros (007), no plus sign (+1555),
 * nothing beyond 15 digits, which JavaScript cannot hold exactly. Everything else stays text.
 */
export function coerceCell(cell: string, opts: Pick<CsvToJsonOptions, 'detectTypes' | 'emptyAsNull'>): string | number | boolean | null {
  if (cell === '') return opts.emptyAsNull ? null : '';
  if (!opts.detectTypes) return cell;
  const t = cell.trim();
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
  if (PLAIN_NUMBER.test(t) && t.replace(/[-.]/g, '').length <= 15) return Number(t);
  return cell;
}

export interface CsvToJsonResult {
  rows: Record<string, string | number | boolean | null>[];
  columns: string[];
  warnings: string[];
}

export function csvToObjects(text: string, opts: CsvToJsonOptions): CsvToJsonResult {
  const { rows: grid, unterminated } = parseCsv(text, opts.delimiter);
  const warnings: string[] = [];
  if (unterminated) warnings.push('A quoted value is never closed, so the last row may be incomplete. Check for a missing closing quote.');
  if (grid.length === 0) return { rows: [], columns: [], warnings };

  const seen = new Map<string, number>();
  const columns = grid[0].map((h, i) => {
    const base = h.trim() || `column_${i + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
  if (new Set(grid[0].map((h) => h.trim()).filter(Boolean)).size < grid[0].filter((h) => h.trim()).length) {
    warnings.push('Some column names repeat, so later ones were renamed with a number (name_2).');
  }

  let longer = 0;
  let shorter = 0;
  const allColumns = [...columns];
  const rows = grid.slice(1).map((cells) => {
    if (cells.length > columns.length) longer++;
    if (cells.length < columns.length) shorter++;
    const obj: Record<string, string | number | boolean | null> = {};
    columns.forEach((c, idx) => { obj[c] = coerceCell(cells[idx] ?? '', opts); });
    for (let j = columns.length; j < cells.length; j++) {
      const name = `column_${j + 1}`;
      if (!allColumns.includes(name)) allColumns.push(name);
      obj[name] = coerceCell(cells[j], opts);
    }
    return obj;
  });
  if (longer) warnings.push(`${longer} row${longer === 1 ? ' has' : 's have'} more cells than the header, so the extra values were kept as column_N.`);
  if (shorter) warnings.push(`${shorter} row${shorter === 1 ? ' has' : 's have'} fewer cells than the header; the missing values are empty.`);
  return { rows, columns: allColumns, warnings };
}

/** RFC 4180: quote a field that contains the delimiter, a quote, a line break or edge spaces, and double any quotes. */
export function csvField(value: string, delimiter: string): string {
  const needsQuotes = value.includes(delimiter) || /["\r\n]/.test(value) || /^\s|\s$/.test(value);
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(grid: string[][], delimiter: string): string {
  return grid.map((row) => row.map((v) => csvField(v, delimiter)).join(delimiter)).join('\r\n');
}

// ---- JSON -> CSV, reading numbers as the text they were written with ----

class RawNumber { constructor(public raw: string) {} }
type Raw = string | boolean | null | RawNumber | Raw[] | { entries: [string, Raw][] };

/** Parses valid JSON text, keeping every number exactly as written (so 12345678901234567890 and 1.10 survive). */
function parseRaw(text: string): Raw {
  let i = 0;
  const ws = () => { while (i < text.length && /\s/.test(text[i])) i++; };
  const str = (): string => {
    const start = i;
    i++;
    while (text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    i++;
    return JSON.parse(text.slice(start, i)) as string;
  };
  const val = (): Raw => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      const entries: [string, Raw][] = [];
      ws();
      if (text[i] === '}') { i++; return { entries }; }
      for (;;) {
        ws();
        const k = str();
        ws(); i++; // :
        entries.push([k, val()]);
        ws();
        if (text[i] === ',') { i++; continue; }
        i++; // }
        return { entries };
      }
    }
    if (c === '[') {
      i++;
      const arr: Raw[] = [];
      ws();
      if (text[i] === ']') { i++; return arr; }
      for (;;) {
        arr.push(val());
        ws();
        if (text[i] === ',') { i++; continue; }
        i++; // ]
        return arr;
      }
    }
    if (c === '"') return str();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i))!;
    i += m[0].length;
    return new RawNumber(m[0]);
  };
  return val();
}

function compact(v: Raw): string {
  if (v === null) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof RawNumber) return v.raw;
  if (Array.isArray(v)) return `[${v.map(compact).join(',')}]`;
  return `{${v.entries.map(([k, x]) => `${JSON.stringify(k)}:${compact(x)}`).join(',')}}`;
}

function cellText(v: Raw): string {
  if (v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return String(v);
  if (v instanceof RawNumber) return v.raw;
  return compact(v); // arrays, and objects that were not flattened
}

const isObject = (v: Raw): v is { entries: [string, Raw][] } => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RawNumber);

function flatten(entries: [string, Raw][], prefix: string, out: [string, Raw][]): void {
  for (const [k, v] of entries) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isObject(v) && v.entries.length > 0) flatten(v.entries, key, out);
    else out.push([key, v]);
  }
}

export interface JsonToCsvResult { csv: string; rowCount: number; columns: string[]; error?: string }

export function jsonToCsv(text: string, opts: { delimiter: string; flatten: boolean }): JsonToCsvResult {
  const problem = findJsonProblem(text);
  if (problem) return { csv: '', rowCount: 0, columns: [], error: `Line ${problem.line}, column ${problem.column}: ${problem.message}` };
  const root = parseRaw(text);
  const items: Raw[] = Array.isArray(root) ? root : [root];
  if (items.length === 0) return { csv: '', rowCount: 0, columns: [] };

  const records = items.map((item) => {
    const pairs: [string, Raw][] = [];
    if (isObject(item)) {
      if (opts.flatten) flatten(item.entries, '', pairs);
      else pairs.push(...item.entries);
    } else pairs.push(['value', item]);
    return pairs;
  });
  const columns: string[] = [];
  for (const r of records) for (const [k] of r) if (!columns.includes(k)) columns.push(k);
  const grid = [columns, ...records.map((r) => {
    const m = new Map(r);
    return columns.map((c) => (m.has(c) ? cellText(m.get(c) as Raw) : ''));
  })];
  return { csv: toCsv(grid, opts.delimiter), rowCount: records.length, columns };
}
