import { describe, expect, it, vi } from 'vitest';

// The widgets import browser-only modules (toast, metrics); only their pure helpers are under test here.
vi.mock('@/lib/metrics', () => ({ logToolUsage: vi.fn() }));
vi.mock('@/lib/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { transform } from '@/components/tools/UrlEncoder';
import { analyze } from '@/components/tools/WordCounter';
import { parseEpoch, relative } from '@/components/tools/TimestampConverter';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

describe('url encoder', () => {
  it('encodes a component, escaping reserved characters', () => {
    expect(transform('a b&c=d/é#', 'encode', 'component').output).toBe('a%20b%26c%3Dd%2F%C3%A9%23');
  });
  it('encodes a full URL but keeps its structure', () => {
    expect(transform('https://x.y/a b?q=é&z=1', 'encode', 'full').output).toBe('https://x.y/a%20b?q=%C3%A9&z=1');
  });
  it('round-trips and does not turn + into a space', () => {
    const v = 'a+b c/ü';
    expect(transform(transform(v, 'encode', 'component').output, 'decode', 'component').output).toBe(v);
    expect(transform('a+b', 'decode', 'component').output).toBe('a+b');
  });
  it('reports malformed input instead of throwing', () => {
    expect(transform('%E0%A4%A', 'decode', 'component').error).toMatch(/Malformed/);
    expect(transform('100%', 'decode', 'component').error).toBeTruthy();
    expect(transform('', 'decode', 'component')).toEqual({ output: '', error: null });
  });
});

describe('word counter', () => {
  it('counts the basics', () => {
    const a = analyze('Hello world. This is a test!\n\nSecond paragraph here.');
    expect(a.words).toBe(9);
    expect(a.sentences).toBe(3);
    expect(a.paragraphs).toBe(2);
    expect(a.chars).toBe('Hello world. This is a test!\n\nSecond paragraph here.'.length);
  });
  it('handles empty and whitespace-only text', () => {
    expect(analyze('')).toMatchObject({ words: 0, chars: 0, sentences: 0, paragraphs: 0, lines: 0 });
    expect(analyze('   \n ').words).toBe(0);
  });
  it('counts emoji as one character and ignores stop words in keywords', () => {
    expect(analyze('a😀b').chars).toBe(3);
    const top = analyze('Apple apple APPLE the the banana').top;
    expect(top[0]).toEqual(['apple', 3]);
    expect(top.find(([w]) => w === 'the')).toBeUndefined();
  });
  it('estimates reading time at 200 wpm', () => {
    expect(analyze('word '.repeat(400)).read).toBeCloseTo(2);
  });
});

describe('timestamp converter', () => {
  it('detects seconds vs milliseconds', () => {
    expect(parseEpoch('1767225600')!.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parseEpoch('1767225600000')!.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parseEpoch('0')!.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseEpoch('-86400')!.toISOString()).toBe('1969-12-31T00:00:00.000Z');
    expect(parseEpoch('2147483647')!.toISOString()).toBe('2038-01-19T03:14:07.000Z');
  });
  it('rejects non-numeric input', () => {
    expect(parseEpoch('abc')).toBeNull();
    expect(parseEpoch('12 34')).toBeNull();
    expect(parseEpoch('')).toBeNull();
  });
  it('describes relative time', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    expect(relative(new Date('2026-01-01T09:00:00Z'), now)).toBe('3 hours ago');
    expect(relative(new Date('2026-01-03T12:00:00Z'), now)).toBe('in 2 days');
  });
});

describe('registry integrity', () => {
  it('every tool has unique id and route and non-empty FAQs', () => {
    const ids = TOOL_REGISTRY.map((t) => t.id);
    const routes = TOOL_REGISTRY.map((t) => t.route);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
    for (const t of TOOL_REGISTRY) expect(t.faqs.length, t.id).toBeGreaterThan(0);
  });
  it('every guide has a unique slug and links to an existing tool', () => {
    const slugs = GUIDE_REGISTRY.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const g of GUIDE_REGISTRY) {
      if (g.relatedToolRoute) expect(TOOL_REGISTRY.some((t) => t.route === g.relatedToolRoute), g.slug).toBe(true);
    }
  });
});
