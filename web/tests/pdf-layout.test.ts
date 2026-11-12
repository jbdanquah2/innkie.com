import { describe, expect, it } from 'vitest';
import { containRect, embedSize, nextRotation, pageDims, pxToMm } from '@/lib/pdf-layout';

describe('pageDims', () => {
  it('A4 follows each image in auto mode', () => {
    expect(pageDims(4000, 3000, 'a4', 'auto', 10)).toEqual({ width: 297, height: 210, orientation: 'l' });
    expect(pageDims(3000, 4000, 'a4', 'auto', 10)).toEqual({ width: 210, height: 297, orientation: 'p' });
    expect(pageDims(1000, 1000, 'a4', 'auto', 10).orientation).toBe('p');
  });
  it('can force an orientation', () => {
    expect(pageDims(4000, 3000, 'a4', 'portrait', 10)).toEqual({ width: 210, height: 297, orientation: 'p' });
    expect(pageDims(3000, 4000, 'letter', 'landscape', 10)).toEqual({ width: 279.4, height: 215.9, orientation: 'l' });
  });
  it('fit mode is the image size in millimetres plus margins, not the pixel count', () => {
    const d = pageDims(960, 480, 'fit', 'auto', 0); // 96 DPI: 10 inches x 5 inches
    expect(d).toEqual({ width: 254, height: 127, orientation: 'l' });
    const withMargin = pageDims(960, 480, 'fit', 'auto', 5);
    expect(withMargin.width).toBe(264);
    expect(withMargin.height).toBe(137);
    // the old tool would have made this page 960 x 480 millimetres
    expect(d.width).toBeLessThan(300);
  });
  it('converts pixels to millimetres', () => {
    expect(pxToMm(96)).toBeCloseTo(25.4);
    expect(pxToMm(300, 300)).toBeCloseTo(25.4);
  });
});

describe('containRect', () => {
  it('fits and centres an image inside the margins without distorting it', () => {
    const r = containRect({ width: 210, height: 297 }, 4000, 3000, 10);
    expect(r.width).toBe(190);
    expect(r.height).toBe(142.5);
    expect(r.x).toBe(10);
    expect(r.y).toBe(77.25);
    expect(r.width / r.height).toBeCloseTo(4000 / 3000, 2);
  });
  it('is limited by height for a tall image', () => {
    const r = containRect({ width: 210, height: 297 }, 1000, 3000, 10);
    expect(r.height).toBe(277);
    expect(r.width / r.height).toBeCloseTo(1 / 3, 2);
    expect(r.y).toBe(10);
  });
  it('fills a fit-to-image page exactly', () => {
    const page = pageDims(960, 480, 'fit', 'auto', 5);
    const r = containRect(page, 960, 480, 5);
    expect(r).toEqual({ x: 5, y: 5, width: 254, height: 127 });
  });
  it('survives a margin bigger than the page', () => {
    const r = containRect({ width: 100, height: 100 }, 50, 50, 80);
    expect(r.width).toBeGreaterThan(0);
    expect(Number.isFinite(r.x)).toBe(true);
  });
});

describe('embedSize', () => {
  it('swaps sides for quarter turns', () => {
    expect(embedSize(400, 200, 0, 'original')).toEqual({ width: 400, height: 200 });
    expect(embedSize(400, 200, 90, 'original')).toEqual({ width: 200, height: 400 });
    expect(embedSize(400, 200, 180, 'original')).toEqual({ width: 400, height: 200 });
    expect(embedSize(400, 200, 270, 'original')).toEqual({ width: 200, height: 400 });
  });
  it('scales down to the quality limit but never up', () => {
    expect(embedSize(4960, 3508, 0, 'balanced')).toEqual({ width: 2480, height: 1754 });
    expect(embedSize(4000, 6000, 0, 'small')).toEqual({ width: 1067, height: 1600 });
    expect(embedSize(800, 600, 0, 'balanced')).toEqual({ width: 800, height: 600 });
    expect(embedSize(8000, 6000, 0, 'original')).toEqual({ width: 8000, height: 6000 });
  });
});

describe('rotation', () => {
  it('cycles through quarter turns', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });
});
