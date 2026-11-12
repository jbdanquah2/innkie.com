/** Epoch and date parsing that does not depend on each browser's date-parsing quirks. */

export type EpochUnit = 'auto' | 's' | 'ms' | 'us' | 'ns';
export type ConcreteUnit = Exclude<EpochUnit, 'auto'>;
export const UNIT_LABEL: Record<ConcreteUnit, string> = { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' };

const MAX_MS = 8.64e15; // the range of a JavaScript Date

/** Seconds are 10 digits today, milliseconds 13, microseconds 16 and nanoseconds 19. */
export function detectUnit(absValue: number): ConcreteUnit {
  if (absValue < 1e11) return 's';
  if (absValue < 1e14) return 'ms';
  if (absValue < 1e17) return 'us';
  return 'ns';
}

export interface EpochResult { date: Date; unit: ConcreteUnit }

/** Integer values are handled with BigInt, so nanosecond timestamps keep their precision. */
export function parseEpochInput(raw: string, unit: EpochUnit = 'auto'): EpochResult | null {
  const s = raw.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const isInt = /^-?\d+$/.test(s);
  const chosen: ConcreteUnit = unit === 'auto' ? detectUnit(Math.abs(Number(s))) : unit;
  let ms: number;
  if (isInt) {
    const big = BigInt(s);
    const div = { s: 1n, ms: 1n, us: 1000n, ns: 1_000_000n }[chosen];
    ms = chosen === 's' ? Number(big) * 1000 : Number(big / div);
  } else {
    const n = Number(s);
    ms = { s: n * 1000, ms: n, us: n / 1000, ns: n / 1e6 }[chosen];
  }
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) return null;
  const date = new Date(Math.trunc(ms));
  return isNaN(date.getTime()) ? null : { date, unit: chosen };
}

/** Kept for callers that only need the date, with the unit chosen automatically. */
export function parseEpoch(raw: string): Date | null {
  return parseEpochInput(raw)?.date ?? null;
}

export function relative(from: Date, now: Date): string {
  const diff = Math.round((from.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
  for (const [secs, unit] of units) if (abs >= secs || unit === 'second') return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(diff / secs), unit);
  return '';
}

export type Zone = 'local' | 'utc';

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export interface DateResult {
  date: Date;
  /** True when the text was not ISO 8601, so the browser interpreted it. Other browsers may read it differently. */
  byBrowser: boolean;
  /** True when the text carried its own offset (Z or +hh:mm), so the chosen zone was not used. */
  hadOffset: boolean;
}

/**
 * ISO 8601 text is read exactly, in the chosen zone unless it carries its own offset. That includes date-only text,
 * which JavaScript itself reads as UTC while reading date-and-time text as local time. Anything else falls back to
 * the browser's parser.
 */
export function parseDateInput(text: string, zone: Zone): DateResult | null {
  const t = text.trim();
  if (!t) return null;
  const m = ISO.exec(t);
  if (m) {
    const [y, mo, d, h = 0, mi = 0, sec = 0] = [m[1], m[2], m[3], m[4], m[5], m[6]].map((v) => (v === undefined ? undefined : Number(v))) as number[];
    const ms = m[7] ? Math.round(Number('0.' + m[7]) * 1000) : 0;
    if (mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo) || h > 23 || mi > 59 || sec > 59) return null;
    const offset = m[8];
    let date: Date;
    if (offset) {
      let minutes = 0;
      if (offset.toUpperCase() !== 'Z') {
        const sign = offset[0] === '-' ? -1 : 1;
        const digits = offset.slice(1).replace(':', '');
        const oh = Number(digits.slice(0, 2));
        const om = Number(digits.slice(2) || '0');
        if (oh > 23 || om > 59) return null;
        minutes = sign * (oh * 60 + om);
      }
      date = new Date(Date.UTC(y, mo - 1, d, h, mi, sec, ms) - minutes * 60000);
    } else if (zone === 'utc') {
      date = new Date(Date.UTC(y, mo - 1, d, h, mi, sec, ms));
    } else {
      date = new Date(y, mo - 1, d, h, mi, sec, ms);
    }
    return isNaN(date.getTime()) ? null : { date, byBrowser: false, hadOffset: !!offset };
  }
  const parsed = new Date(t);
  return isNaN(parsed.getTime()) ? null : { date: parsed, byBrowser: true, hadOffset: false };
}

/** Formats a date in an IANA time zone, such as "America/New_York". null if the zone is unknown. */
export function formatInZone(d: Date, timeZone: string): string | null {
  try {
    return d.toLocaleString('en-US', { timeZone, dateStyle: 'full', timeStyle: 'long' });
  } catch {
    return null;
  }
}
