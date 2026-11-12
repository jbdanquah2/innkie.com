import { describe, expect, it } from 'vitest';
import { clampOutput, looksLikeSvg, outputSize, parseLength, rootTag, svgIntrinsicSize, withSize } from '@/lib/svg';

describe('looksLikeSvg / rootTag', () => {
  it('recognises svg markup and rejects other text', () => {
    expect(looksLikeSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(true);
    expect(looksLikeSvg('<?xml version="1.0"?>\n<!-- c --><SVG width="1"/>')).toBe(true);
    expect(looksLikeSvg('<html><body>hi</body></html>')).toBe(false);
    expect(looksLikeSvg('<svgfoo>')).toBe(false);
    expect(looksLikeSvg('')).toBe(false);
    expect(rootTag('<?xml?><svg a="1" b=\'2\'><g/></svg>')).toBe('<svg a="1" b=\'2\'>');
  });
});

describe('parseLength', () => {
  it('converts CSS absolute units to pixels', () => {
    expect(parseLength('100')).toBe(100);
    expect(parseLength('100px')).toBe(100);
    expect(parseLength('72pt')).toBeCloseTo(96);
    expect(parseLength('1in')).toBe(96);
    expect(parseLength('25.4mm')).toBeCloseTo(96);
    expect(parseLength('2.54cm')).toBeCloseTo(96);
    expect(parseLength('1pc')).toBe(16);
    expect(parseLength(' 12.5 ')).toBe(12.5);
    expect(parseLength('1e2')).toBe(100);
  });
  it('rejects what cannot be resolved without layout', () => {
    for (const v of ['100%', '2em', '3ex', 'auto', '', null, '-5', '0', 'abc', '1 2']) expect(parseLength(v as string | null)).toBeNull();
  });
});

describe('svgIntrinsicSize', () => {
  it('uses width and height when both are given, in any unit', () => {
    expect(svgIntrinsicSize('<svg width="200" height="100">')).toEqual({ width: 200, height: 100, source: 'attributes' });
    expect(svgIntrinsicSize('<svg width="1in" height="0.5in">')).toEqual({ width: 96, height: 48, source: 'attributes' });
  });
  it('uses the viewBox when there is no size, and when percentages are given', () => {
    expect(svgIntrinsicSize('<svg viewBox="0 0 24 24">')).toEqual({ width: 24, height: 24, source: 'viewBox' });
    expect(svgIntrinsicSize('<svg width="100%" height="100%" viewBox="0 0 640 480">')).toEqual({ width: 640, height: 480, source: 'viewBox' });
    expect(svgIntrinsicSize('<svg viewBox="0,0,10,5">')).toEqual({ width: 10, height: 5, source: 'viewBox' });
  });
  it('derives the missing side from the viewBox shape', () => {
    expect(svgIntrinsicSize('<svg width="300" viewBox="0 0 100 50">')).toEqual({ width: 300, height: 150, source: 'attributes' });
    expect(svgIntrinsicSize('<svg height="40" viewBox="0 0 100 50">')).toEqual({ width: 80, height: 40, source: 'attributes' });
  });
  it('falls back to the browser default of 300 x 150', () => {
    expect(svgIntrinsicSize('<svg>')).toEqual({ width: 300, height: 150, source: 'default' });
    expect(svgIntrinsicSize('not svg')).toEqual({ width: 300, height: 150, source: 'default' });
    expect(svgIntrinsicSize('<svg width="400">')).toEqual({ width: 400, height: 200, source: 'default' });
  });
  it('ignores an invalid viewBox', () => {
    expect(svgIntrinsicSize('<svg viewBox="0 0 0 0">').source).toBe('default');
    expect(svgIntrinsicSize('<svg viewBox="a b c d">').source).toBe('default');
  });
});

describe('outputSize and clampOutput', () => {
  it('scales by a factor or to a width, keeping proportions', () => {
    expect(outputSize({ width: 100, height: 50 }, { mode: 'scale', scale: 3, width: 0 })).toEqual({ width: 300, height: 150 });
    expect(outputSize({ width: 100, height: 50 }, { mode: 'width', scale: 1, width: 512 })).toEqual({ width: 512, height: 256 });
    expect(outputSize({ width: 3, height: 1 }, { mode: 'width', scale: 1, width: 1 })).toEqual({ width: 1, height: 1 });
  });
  it('leaves reasonable sizes alone', () => {
    expect(clampOutput(4000, 3000)).toEqual({ width: 4000, height: 3000, reduced: false });
  });
  it('reduces sizes a browser could not draw, keeping the shape', () => {
    const r = clampOutput(32000, 16000);
    expect(r.reduced).toBe(true);
    expect(r.width).toBeLessThanOrEqual(16384);
    expect(Math.abs(r.width / r.height - 2)).toBeLessThan(0.01);
    const area = clampOutput(12000, 12000);
    expect(area.reduced).toBe(true);
    expect(area.width * area.height).toBeLessThanOrEqual(67_108_864);
  });
});

describe('withSize', () => {
  it('sets width and height and adds a viewBox so the artwork scales', () => {
    const out = withSize('<svg xmlns="http://www.w3.org/2000/svg" width="10mm" height="5mm"><rect/></svg>', 800, 400, { width: 37.8, height: 18.9 });
    expect(out).toContain('width="800"');
    expect(out).toContain('height="400"');
    expect(out).toContain('viewBox="0 0 37.8 18.9"');
    expect(out).toContain('<rect/></svg>');
  });
  it('keeps an existing viewBox and adds missing width and height', () => {
    const out = withSize('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>', 96, 96, { width: 24, height: 24 });
    expect(out).toContain('viewBox="0 0 24 24"');
    expect(out).toMatch(/width="96"/);
    expect(out.match(/viewBox/g)).toHaveLength(1);
  });
  it('replaces percentage sizes', () => {
    const out = withSize('<svg width="100%" height="100%" viewBox="0 0 10 10">', 50, 50, { width: 10, height: 10 });
    expect(out).toBe('<svg width="50" height="50" viewBox="0 0 10 10">');
  });
  it('does not touch an svg element nested inside', () => {
    const out = withSize('<svg width="10" height="10"><svg width="5" height="5"/></svg>', 20, 20, { width: 10, height: 10 });
    expect(out).toContain('<svg width="5" height="5"/>');
  });
});
