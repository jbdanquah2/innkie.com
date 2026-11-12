import { TOOL_REGISTRY, type ToolAlias, type ToolContentSection, type ToolFaq, type UtilityTool } from './config/tool-registry';
import { TOOL_CONTENT } from './config/tool-content';
import { BASE_URL, buildMetadata, getBreadcrumbSchema, getFaqSchema } from './seo';

export interface ResolvedToolPage {
  path: string;
  tool: UtilityTool;
  alias?: ToolAlias;
  /** <title> / meta title (without the site suffix) */
  title: string;
  description: string;
  /** H1 text + intro paragraph shown on the page */
  heading: string;
  intro: string;
  faqs: ToolFaq[];
  sections: ToolContentSection[];
  image?: string;
}

/** Registry lookup for a route or one of its aliases (replaces `router.url` matching in the Angular components). */
export function resolveToolPage(path: string): ResolvedToolPage {
  const tool = TOOL_REGISTRY.find((t) => t.route === path || t.aliases?.some((a) => a.path === path));
  if (!tool) throw new Error(`No tool registered for ${path}`);
  const alias = tool.aliases?.find((a) => a.path === path);
  return {
    path,
    tool,
    alias,
    title: alias?.title || tool.seo.title,
    description: alias?.description || tool.seo.description,
    heading: alias?.h1 || alias?.name || tool.name,
    intro: alias?.intro || alias?.description || tool.description,
    faqs: alias?.faqs || TOOL_CONTENT[tool.id]?.faqs || tool.faqs || [],
    sections: alias?.sections || [],
    image: alias?.image || tool.seo.image,
  };
}

export function registryMetadata(p: ResolvedToolPage) {
  return buildMetadata({ title: p.title, description: p.description, path: p.path, image: p.image, keywords: p.tool.seo.keywords });
}

/** SoftwareApplication + FAQPage + BreadcrumbList for registry-driven tool pages. */
export function registrySchema(p: ResolvedToolPage, category = 'UtilityApplication') {
  const url = `${BASE_URL}${p.path}`;
  return [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: p.title,
      url,
      operatingSystem: 'Any',
      applicationCategory: category,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: p.description,
    },
    getFaqSchema(p.faqs),
    getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Tools', url: '/tools' }, { name: p.alias?.name || p.tool.name, url: p.path }]),
  ];
}
