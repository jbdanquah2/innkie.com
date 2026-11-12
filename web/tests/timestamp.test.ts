import { describe, expect, it } from 'vitest';
import { detectUnit, formatInZone, parseDateInput, parseEpoch, parseEpochInput, relative } from '@/lib/timestamp';

describe('parseEpochInput', () => {
  it('detects seconds, milliseconds, microseconds and nanoseconds', () => {
    const iso = '2026-01-01T00:00:00.000Z';
    expect(parseEpochInput('1767225600')).toMatchObject({ unit: 's' });
    expect(parseEpochInput('1767225600')!.date.toISOString()).toBe(iso);
    expect(parseEpochInput('1767225600000')).toMatchObject({ unit: 'ms' });
    expect(parseEpochInput('1767225600000')!.date.toISOString()).toBe(iso);
    expect(parseEpochInput('1767225600000000')).toMatchObject({ unit: 'us' });
    expect(parseEpochInput('1767225600000000')!.date.toISOString()).toBe(iso);
    expect(parseEpochInput('1767225600000000000')).toMatchObject({ unit: 'ns' });
    expect(parseEpochInput('1767225600000000000')!.date.toISOString()).toBe(iso);
  });
  it('keeps nanosecond precision for integers (BigInt)', () => {
    expect(parseEpochInput('1767225600123456789')!.date.toISOString()).toBe('2026-01-01T00:00:00.123Z');
  });
  it('handles zero, negatives, decimals and an explicit unit', () => {
    expect(parseEpoch('0')!.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseEpoch('-86400')!.toISOString()).toBe('1969-12-31T00:00:00.000Z');
    expect(parseEpoch('2147483647')!.toISOString()).toBe('2038-01-19T03:14:07.000Z');
    expect(parseEpoch('1767225600.5')!.toISOString()).toBe('2026-01-01T00:00:00.500Z');
    expect(parseEpochInput('1767225600', 'ms')!.date.toISOString()).toBe('1970-01-21T10:53:45.600Z');
  });
  it('rejects non-numeric and out-of-range input', () => {
    for (const bad of ['abc', '12 34', '', '1e5', '0x10', '99999999999999999999999']) expect(parseEpochInput(bad)).toBeNull();
  });
  it('detectUnit boundaries', () => {
    expect(detectUnit(99_999_999_999)).toBe('s');
    expect(detectUnit(100_000_000_000)).toBe('ms');
  });
});

describe('parseDateInput reads ISO text exactly', () => {
  it('uses the chosen zone, even for date-only text', () => {
    expect(parseDateInput('2026-01-01', 'utc')!.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parseDateInput('2026-01-01T09:30', 'utc')!.date.toISOString()).toBe('2026-01-01T09:30:00.000Z');
    expect(parseDateInput('2026-01-01 09:30:15.25', 'utc')!.date.toISOString()).toBe('2026-01-01T09:30:15.250Z');
    const local = parseDateInput('2026-03-05T09:30:00', 'local')!.date;
    expect(local.getTime()).toBe(new Date(2026, 2, 5, 9, 30, 0).getTime());
    const localDateOnly = parseDateInput('2026-03-05', 'local')!.date;
    expect(localDateOnly.getTime()).toBe(new Date(2026, 2, 5).getTime());
  });
  it('uses an offset in the text instead of the zone', () => {
    expect(parseDateInput('2026-01-01T00:00:00Z', 'local')).toMatchObject({ hadOffset: true });
    expect(parseDateInput('2026-01-01T00:00:00+05:30', 'utc')!.date.toISOString()).toBe('2025-12-31T18:30:00.000Z');
    expect(parseDateInput('2026-01-01T00:00:00-0800', 'local')!.date.toISOString()).toBe('2026-01-01T08:00:00.000Z');
    expect(parseDateInput('2026-01-01T00:00+02', 'utc')!.date.toISOString()).toBe('2025-12-31T22:00:00.000Z');
  });
  it('rejects impossible dates instead of rolling them over', () => {
    for (const bad of ['2026-13-01', '2026-02-30', '2026-04-31', '2026-01-01T24:00', '2026-01-01T10:60', '2026-01-01T10:00:61', '2026-00-10', '2026-01-01T10:00+25:00']) {
      expect(parseDateInput(bad, 'utc')).toBeNull();
    }
    expect(parseDateInput('2024-02-29', 'utc')!.date.toISOString()).toBe('2024-02-29T00:00:00.000Z'); // leap year
    expect(parseDateInput('2025-02-29', 'utc')).toBeNull();
  });
  it('falls back to the browser for other formats and says so', () => {
    const r = parseDateInput('Thu, 01 Jan 2026 00:00:00 GMT', 'utc');
    expect(r?.byBrowser).toBe(true);
    expect(r?.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parseDateInput('not a date', 'utc')).toBeNull();
    expect(parseDateInput('', 'utc')).toBeNull();
  });
});

describe('helpers', () => {
  it('describes relative time', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    expect(relative(new Date('2026-01-01T09:00:00Z'), now)).toBe('3 hours ago');
    expect(relative(new Date('2026-01-03T12:00:00Z'), now)).toBe('in 2 days');
  });
  it('formats in another time zone and rejects unknown zones', () => {
    const d = new Date('2026-07-01T12:00:00Z');
    expect(formatInZone(d, 'Asia/Tokyo')).toMatch(/9:00:00 PM/);
    expect(formatInZone(d, 'Not/AZone')).toBeNull();
  });
});
