import { describe, expect, it, vi } from 'vitest';

// The widgets import browser-only modules (toast, metrics); only their pure helpers are under test here.
vi.mock('@/lib/metrics', () => ({ logToolUsage: vi.fn() }));
vi.mock('@/lib/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';

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
