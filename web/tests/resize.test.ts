import { describe, expect, it } from 'vitest';
import { MAX_AREA, PRESETS, ratioLabel, scaledSize, sourceRect, stepSizes, validateSize } from '@/lib/resize';

describe('sourceRect', () => {
  it('stretch uses the whole image', () => {
    expect(sourceRect(400, 200, 1080, 1080, 'stretch')).toEqual({ x: 0, y: 0, width: 400, height: 200 });
  });
  it('crop takes a centred region with the target shape', () => {
    // a 400x200 image into a square: keep the middle 200x200
    expect(sourceRect(400, 200, 1080, 1080, 'crop')).toEqual({ x: 100, y: 0, width: 200, height: 200 });
    // a 200x400 image into a wide target: keep the middle full-width strip
    const r = sourceRect(200, 400, 1600, 400, 'crop');
    expect(r.width).toBe(200);
    expect(r.height).toBe(50);
    expect(r.y).toBe(175);
  });
  it('crop keeps the target proportions and never leaves the image', () => {
    for (const [sw, sh, dw, dh] of [[4000, 3000, 1080, 1350], [1000, 1000, 1584, 396], [300, 900, 640, 480]]) {
      const r = sourceRect(sw, sh, dw, dh, 'crop');
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(sw + 1e-9);
      expect(r.y + r.height).toBeLessThanOrEqual(sh + 1e-9);
      expect(r.width / r.height).toBeCloseTo(dw / dh, 3);
    }
  });
  it('uses the whole image when the shape already matches', () => {
    expect(sourceRect(1600, 900, 1280, 720, 'crop')).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
  });
});

describe('stepSizes', () => {
  it('goes straight to the target for small reductions', () => {
    expect(stepSizes(1000, 800, 600, 480)).toEqual([{ width: 600, height: 480 }]);
  });
  it('halves repeatedly for big reductions and ends exactly on the target', () => {
    const steps = stepSizes(6000, 4000, 300, 200);
    expect(steps[steps.length - 1]).toEqual({ width: 300, height: 200 });
    expect(steps.length).toBeGreaterThan(2);
    for (let i = 1; i < steps.length - 1; i++) expect(steps[i].width).toBeLessThanOrEqual(Math.ceil(steps[i - 1].width / 2));
    // every intermediate step is still at least twice as big as the target, so detail is kept until the last move
    for (const s of steps.slice(0, -1)) expect(s.width).toBeGreaterThan(300);
  });
  it('does not shrink when enlarging', () => {
    expect(stepSizes(100, 100, 400, 400)).toEqual([{ width: 400, height: 400 }]);
  });
});

describe('validateSize', () => {
  it('accepts sensible sizes and explains the rest', () => {
    expect(validateSize(1080, 1080)).toBeNull();
    expect(validateSize(0, 100)).toMatch(/Enter/);
    expect(validateSize(20000, 100)).toMatch(/at most 16,384/);
    expect(validateSize(10000, 10000)).toMatch(/more pixels/);
    expect(validateSize(8192, 8192)).toBeNull();
    expect(8192 * 8192).toBe(MAX_AREA);
  });
});

describe('ratioLabel', () => {
  it('names common shapes', () => {
    expect(ratioLabel(1920, 1080)).toBe('16:9');
    expect(ratioLabel(1080, 1080)).toBe('1:1');
    expect(ratioLabel(1080, 1350)).toBe('4:5');
    expect(ratioLabel(1584, 396)).toBe('4:1');
    expect(ratioLabel(1200, 630)).toBe('1.90:1'); // 40:21 is too unwieldy to show, so a decimal is used
    expect(ratioLabel(1001, 333)).toBe('3.01:1');
    expect(ratioLabel(0, 5)).toBe('');
  });
});

describe('presets and percentages', () => {
  it('has unique ids and sensible sizes', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const p of PRESETS) expect(validateSize(p.width, p.height)).toBeNull();
  });
  it('scales by percent keeping the shape', () => {
    expect(scaledSize(4000, 3000, 50)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(333, 111, 25)).toEqual({ width: 83, height: 28 });
    expect(scaledSize(10, 10, 1)).toEqual({ width: 1, height: 1 });
  });
});
