import { describe, expect, it, vi } from 'vitest';

// The widgets import browser-only modules (toast, metrics); only their pure helpers are under test here.
vi.mock('@/lib/metrics', () => ({ logToolUsage: vi.fn() }));
vi.mock('@/lib/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { analyze } from '@/components/tools/WordCounter';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

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
