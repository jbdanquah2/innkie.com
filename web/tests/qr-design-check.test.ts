import { describe, expect, it } from 'vitest';
import { byteLength, designIssues, qrFileName, QR_MAX_BYTES } from '@/lib/qr-design-check';
import { DEFAULT_DESIGN, type QrDesign } from '@/lib/qr-config';

const d = (o: Partial<QrDesign> = {}): QrDesign => ({ ...DEFAULT_DESIGN, ...o });

describe('designIssues', () => {
  it('passes the default design', () => {
    expect(designIssues(d(), 'https://example.com')).toEqual([]);
  });
  it('flags content that cannot fit', () => {
    expect(designIssues(d(), 'a'.repeat(QR_MAX_BYTES))).toEqual([]);
    expect(designIssues(d(), 'a'.repeat(QR_MAX_BYTES + 1))).toContain('too-long');
  });
  it('counts bytes, not characters', () => {
    expect(byteLength('é')).toBe(2);
    expect(designIssues(d(), 'é'.repeat(700))).toContain('too-long');
  });
  it('flags light-on-dark and low contrast', () => {
    expect(designIssues(d({ selectedColor: '#ffffff', backgroundColor: '#000000' }), 'x')).toContain('inverted');
    expect(designIssues(d({ selectedColor: '#cccccc', backgroundColor: '#ffffff' }), 'x')).toContain('low-contrast');
  });
  it('checks both ends of a gradient', () => {
    expect(designIssues(d({ colorMode: 'gradient', startColor: '#000000', endColor: '#f5f5f5' }), 'x')).toContain('low-contrast');
    expect(designIssues(d({ colorMode: 'gradient', startColor: '#4F46E5', endColor: '#111111' }), 'x')).toEqual([]);
  });
  it('ignores the single colour while in gradient mode', () => {
    expect(designIssues(d({ colorMode: 'gradient', selectedColor: '#ffffff', startColor: '#000', endColor: '#222' }), 'x')).toEqual([]);
  });
  it('warns about a big logo, or a logo on dense content', () => {
    const logo = { name: 'X', src: '/x.png' };
    expect(designIssues(d({ logo, logoSize: 0.3 }), 'https://a.co')).toEqual([]);
    expect(designIssues(d({ logo, logoSize: 0.5 }), 'https://a.co')).toContain('big-logo');
    expect(designIssues(d({ logo, logoSize: 0.3 }), 'a'.repeat(500))).toContain('dense-logo');
    expect(designIssues(d({ logoSize: 0.5 }), 'https://a.co')).toEqual([]); // no logo, no warning
  });
});

describe('qrFileName', () => {
  it('uses the site name for links', () => {
    expect(qrFileName('https://www.example.com/a/b')).toBe('qr-example.com');
  });
  it('falls back for text', () => {
    expect(qrFileName('hello world')).toBe('qr-code');
  });
});
