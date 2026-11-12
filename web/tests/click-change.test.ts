import { describe, expect, it } from 'vitest';
import { clicksBefore, describeChange } from '@/lib/click-change';

describe('describeChange', () => {
  it('reports growth and decline as a percentage', () => {
    expect(describeChange(150, 100, 30)).toBe('50% more than the previous 30 days');
    expect(describeChange(25, 100, 7)).toBe('75% fewer than the previous 7 days');
  });
  it('says so when nothing changed', () => expect(describeChange(40, 40, 7)).toBe('Same as the previous 7 days'));
  it('handles an empty previous period without dividing by zero', () => {
    expect(describeChange(12, 0, 30)).toBe('Up from none in the previous 30 days');
    expect(describeChange(0, 0, 30)).toBeUndefined();
  });
  it('offers no comparison when the previous period is unknown', () => expect(describeChange(12, null, 30)).toBeUndefined());
});

describe('clicksBefore', () => {
  it('sums only the days before the cut-off', () => {
    const s = [{ date: '2026-10-01', clicks: 3 }, { date: '2026-10-02' }, { date: '2026-10-03', clicks: 5 }, { date: '2026-10-04', clicks: 9 }];
    expect(clicksBefore(s, '2026-10-04')).toBe(8);
    expect(clicksBefore(s, '2026-10-01')).toBe(0);
  });
});
