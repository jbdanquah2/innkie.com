import { describe, expect, it } from 'vitest';
import { dpiForScale, fitScale, formatPageRange, pageFileName, parsePageRange } from '@/lib/pdf-pages';

describe('parsePageRange', () => {
  it('parses pages and ranges, sorted and without duplicates', () => {
    expect(parsePageRange('1-3, 5', 10).pages).toEqual([1, 2, 3, 5]);
    expect(parsePageRange('5 3 1', 10).pages).toEqual([1, 3, 5]);
    expect(parsePageRange('2-4, 3-6', 10).pages).toEqual([2, 3, 4, 5, 6]);
    expect(parsePageRange('7', 10).pages).toEqual([7]);
    expect(parsePageRange(' 1 - 3 ;  9 ', 10).pages).toEqual([1, 2, 3, 9]);
  });
  it('supports open-ended ranges and en dashes', () => {
    expect(parsePageRange('8-', 10).pages).toEqual([8, 9, 10]);
    expect(parsePageRange('1–3', 10).pages).toEqual([1, 2, 3]);
  });
  it('returns nothing for empty input', () => {
    expect(parsePageRange('', 5)).toEqual({ pages: [] });
    expect(parsePageRange('   ', 5)).toEqual({ pages: [] });
  });
  it('explains what is wrong', () => {
    expect(parsePageRange('12', 10).error).toMatch(/Page 12 does not exist.*10 pages/);
    expect(parsePageRange('1-20', 10).error).toMatch(/Page 20 does not exist/);
    expect(parsePageRange('0', 10).error).toMatch(/start at 1/);
    expect(parsePageRange('5-2', 10).error).toMatch(/runs backwards.*2-5/);
    expect(parsePageRange('abc', 10).error).toMatch(/"abc" is not a page/);
    expect(parsePageRange('1,x', 10).error).toMatch(/"x"/);
    expect(parsePageRange('2', 1).error).toMatch(/1 page\./);
  });
});

describe('formatPageRange', () => {
  it('compresses runs', () => {
    expect(formatPageRange([1, 2, 3, 5, 8, 9])).toBe('1-3, 5, 8, 9');
    expect(formatPageRange([4])).toBe('4');
    expect(formatPageRange([])).toBe('');
    expect(formatPageRange([5, 1, 2, 3, 3])).toBe('1-3, 5');
    expect(formatPageRange([1, 2])).toBe('1, 2');
  });
  it('round trips through parsePageRange', () => {
    for (const pages of [[1, 2, 3, 7], [2], [1, 3, 5, 7, 9], [4, 5, 6, 7, 8, 9, 10]]) {
      expect(parsePageRange(formatPageRange(pages), 12).pages).toEqual(pages);
    }
  });
});

describe('pageFileName', () => {
  it('pads page numbers so files sort', () => {
    expect(pageFileName('report', 7, 120, 'png')).toBe('report-page-007.png');
    expect(pageFileName('report', 3, 9, 'jpg')).toBe('report-page-3.jpg');
    expect(pageFileName('a', 12, 40, 'png')).toBe('a-page-12.png');
  });
});

describe('fitScale', () => {
  it('leaves normal pages alone', () => {
    expect(fitScale(612, 792, 2)).toEqual({ scale: 2, reduced: false }); // US Letter at 2x
    expect(fitScale(595, 842, 4)).toEqual({ scale: 4, reduced: false }); // A4 at 4x is about 2380 x 3368
  });
  it('reduces the scale for a huge page so the canvas stays drawable', () => {
    const r = fitScale(2384, 3370, 4); // A0 poster at 4x would be 9536 x 13480 = 128 million pixels
    expect(r.reduced).toBe(true);
    expect(2384 * 3370 * r.scale * r.scale).toBeLessThanOrEqual(67_108_864);
    expect(r.scale).toBeGreaterThan(0.5);
  });
  it('respects the maximum side', () => {
    const r = fitScale(100, 20000, 1);
    expect(r.reduced).toBe(true);
    expect(20000 * r.scale).toBeLessThanOrEqual(16384);
  });
  it('maps scale to DPI', () => {
    expect(dpiForScale(1)).toBe(72);
    expect(dpiForScale(2)).toBe(144);
    expect(dpiForScale(4.166)).toBe(300);
  });
});
