import { describe, expect, it } from 'vitest';
import { baseName, describeUnsupported, extForMime, fitWithin, percentSaved, uniqueNames } from '@/lib/image-tools';

describe('baseName', () => {
  it('only removes the last extension', () => {
    expect(baseName('photo.jpg')).toBe('photo');
    expect(baseName('my.photo.v2.png')).toBe('my.photo.v2');
    expect(baseName('archive.tar.gz')).toBe('archive.tar');
    expect(baseName('noext')).toBe('noext');
    expect(baseName('.hidden')).toBe('.hidden');
    expect(baseName('C:\\pics\\a b.jpeg')).toBe('a b');
    expect(baseName('dir/sub/x.webp')).toBe('x');
  });
});

describe('extForMime', () => {
  it('maps common types and survives odd ones', () => {
    expect(extForMime('image/jpeg')).toBe('jpg');
    expect(extForMime('image/png')).toBe('png');
    expect(extForMime('image/webp')).toBe('webp');
    expect(extForMime('image/svg+xml')).toBe('svg');
    expect(extForMime('image/x-icon')).toBe('x-icon');
    expect(extForMime('')).toBe('bin');
  });
});

describe('uniqueNames', () => {
  it('numbers repeats so a zip never overwrites a file', () => {
    expect(uniqueNames(['a.jpg', 'b.jpg', 'a.jpg', 'a.jpg'])).toEqual(['a.jpg', 'b.jpg', 'a-2.jpg', 'a-3.jpg']);
  });
  it('treats names that differ only by case as the same', () => {
    expect(uniqueNames(['Photo.JPG', 'photo.jpg'])).toEqual(['Photo.JPG', 'photo-2.jpg']);
  });
  it('does not collide with a name that already looks numbered', () => {
    const out = uniqueNames(['a.jpg', 'a-2.jpg', 'a.jpg']);
    expect(new Set(out.map((n) => n.toLowerCase())).size).toBe(3);
  });
  it('keeps every name when there are no repeats and handles names without extensions', () => {
    expect(uniqueNames(['x', 'y.png'])).toEqual(['x', 'y.png']);
    expect(uniqueNames(['x', 'x'])).toEqual(['x', 'x-2']);
  });
});

describe('fitWithin', () => {
  it('scales down to fit both limits and keeps proportions', () => {
    expect(fitWithin(4000, 3000, 1920, 1080)).toEqual({ width: 1440, height: 1080, scaled: true });
    expect(fitWithin(4000, 3000, 1920, 1920)).toEqual({ width: 1920, height: 1440, scaled: true });
    expect(fitWithin(3000, 4000, 1920, 1920)).toEqual({ width: 1440, height: 1920, scaled: true });
  });
  it('honours a single limit (the old tool treated a lone height as the longest side)', () => {
    expect(fitWithin(4000, 3000, undefined, 600)).toEqual({ width: 800, height: 600, scaled: true });
    expect(fitWithin(4000, 3000, 800, undefined)).toEqual({ width: 800, height: 600, scaled: true });
  });
  it('never enlarges and leaves small images alone', () => {
    expect(fitWithin(800, 600, 1920, 1920)).toEqual({ width: 800, height: 600, scaled: false });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600, scaled: false });
    expect(fitWithin(800, 600, 0, 0).scaled).toBe(false);
  });
  it('never produces a zero size', () => {
    expect(fitWithin(10000, 1, 100, 100)).toEqual({ width: 100, height: 1, scaled: true });
  });
});

describe('unsupported inputs', () => {
  it('explains GIF, SVG and others, and accepts the three real formats', () => {
    expect(describeUnsupported({ name: 'a.jpg', type: 'image/jpeg' })).toBeNull();
    expect(describeUnsupported({ name: 'a.png', type: 'image/png' })).toBeNull();
    expect(describeUnsupported({ name: 'a.webp', type: 'image/webp' })).toBeNull();
    expect(describeUnsupported({ name: 'a.gif', type: 'image/gif' })).toMatch(/first frame/);
    expect(describeUnsupported({ name: 'a.svg', type: 'image/svg+xml' })).toMatch(/SVG to PNG/);
    expect(describeUnsupported({ name: 'a.heic', type: 'image/heic' })).toMatch(/HEIC/);
    expect(describeUnsupported({ name: 'a.pdf', type: 'application/pdf' })).toMatch(/not an image/);
  });
});

describe('percentSaved', () => {
  it('rounds, can be negative, and is safe for empty files', () => {
    expect(percentSaved(1000, 250)).toBe(75);
    expect(percentSaved(1000, 1100)).toBe(-10);
    expect(percentSaved(0, 10)).toBe(0);
  });
});
