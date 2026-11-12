import { describe, expect, it } from 'vitest';
import { searchQuality } from '@/lib/image-compress';

/** A made-up encoder whose output grows with quality, like a real one. */
const fake = (calls: number[] = []) => async (q: number) => { calls.push(q); return Math.round(1000 + 9000 * q * q); };

describe('searchQuality', () => {
  it('returns the requested quality when it already fits', async () => {
    const r = await searchQuality(fake(), 10_000, 0.8);
    expect(r).toMatchObject({ quality: 0.8, met: true });
  });
  it('finds the highest quality that fits the target', async () => {
    const r = await searchQuality(fake(), 4000, 0.95, 0.1, 10);
    expect(r.met).toBe(true);
    expect(r.size).toBeLessThanOrEqual(4000);
    // within a small step of the true optimum: 1000 + 9000q^2 = 4000  ->  q ~ 0.577
    expect(r.quality).toBeGreaterThan(0.55);
    expect(r.quality).toBeLessThanOrEqual(0.58);
  });
  it('reports that the limit cannot be met, at the lowest quality', async () => {
    const r = await searchQuality(fake(), 500, 0.9);
    expect(r).toMatchObject({ quality: 0.1, met: false });
  });
  it('uses a bounded number of encodes', async () => {
    const calls: number[] = [];
    await searchQuality(fake(calls), 3000, 0.95, 0.1, 6);
    expect(calls.length).toBeLessThanOrEqual(8);
  });
});
