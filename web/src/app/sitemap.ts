import type { MetadataRoute } from 'next';
import { TOOL_REGISTRY } from '@/lib/config/tool-registry';
import { GUIDE_REGISTRY } from '@/lib/config/guide-registry';
import { BASE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

// Same rules as the old scripts/generate-sitemap.js so the sitemap does not change on cutover:
// weekly changefreq, home without trailing slash, aliases only when they have indexable content,
// priorities 1.0 home / 0.9 tools/* / 0.7 guides/* / 0.8 everything else.
function priority(route: string): number {
  if (route === '') return 1.0;
  if (route !== '/tools/' && route.startsWith('/tools/')) return 0.9;
  if (route !== '/guides/' && route.startsWith('/guides/')) return 0.7;
  return 0.8;
}

export function sitemapRoutes(): string[] {
  const routes: string[] = [
    '', '/features', '/tools', '/privacy', '/terms', '/about', '/contact', '/report-abuse', '/docs',
    '/guides', ...GUIDE_REGISTRY.map((g) => `/guides/${g.slug}`),
  ];
  for (const tool of TOOL_REGISTRY) {
    routes.push(tool.route);
    for (const a of tool.aliases ?? []) {
      if (a.name && a.h1 && a.intro && a.faqs && a.sections) routes.push(a.path);
    }
  }
  return [...new Set(routes.map((r) => (!r || r === '/' ? '' : r.endsWith('/') ? r : `${r}/`)))];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapRoutes().map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: 'weekly' as const,
    priority: priority(route),
  }));
}
