import type { Metadata } from 'next';
import { TOOL_REGISTRY } from './config/tool-registry';

export const SITE_NAME = 'iNNkie';
export const BASE_URL = 'https://innkie.com';
export const DEFAULT_IMAGE = 'assets/preview.png';

const DEFAULT_KEYWORDS = [
  'URL shortener', 'QR maker', 'image compressor', 'PDF tools',
  'JSON formatter', 'iNNkie', 'simple tools', 'link manager',
];

export interface SeoConfig {
  title: string;
  description: string;
  /** Canonical path, e.g. '/tools/qr-studio' */
  path?: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
}

/** '/about' -> '/about/'; '' or '/' -> '/' (same canonical convention as the Angular SeoService). */
export function normalizePublicPath(path: string): string {
  if (!path || path === '/') return '/';
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.endsWith('/') ? p : `${p}/`;
}

export function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}/${value.replace(/^\/+/, '')}`;
}

export function getFullTitle(title: string): string {
  const t = title.trim();
  return t.toLowerCase().endsWith(`| ${SITE_NAME}`.toLowerCase()) ? t : `${t} | ${SITE_NAME}`;
}

function getRegistrySeo(path: string) {
  const normalized = (path.startsWith('/') ? path : `/${path}`).replace(/\/$/, '') || '/';
  const tool = TOOL_REGISTRY.find(
    (t) => t.route === normalized || t.aliases?.some((a) => a.path === normalized),
  );
  const alias = tool?.aliases?.find((a) => a.path === normalized);
  return { keywords: tool?.seo.keywords, image: alias?.image || tool?.seo.image };
}

/** Next.js Metadata for a page: title, description, keywords, canonical, OG, Twitter, robots. */
export function buildMetadata(config: SeoConfig): Metadata {
  const pagePath = normalizePublicPath(config.path ?? '/');
  const registry = getRegistrySeo(pagePath);
  const imageValue =
    config.image && config.image !== DEFAULT_IMAGE ? config.image : registry.image || config.image || DEFAULT_IMAGE;
  const fullTitle = getFullTitle(config.title);
  const url = `${BASE_URL}${pagePath}`;
  const imageUrl = absoluteUrl(imageValue);
  const keywords = config.keywords?.length ? config.keywords : registry.keywords?.length ? registry.keywords : DEFAULT_KEYWORDS;

  return {
    title: { absolute: fullTitle },
    description: config.description,
    keywords,
    alternates: { canonical: url },
    robots: config.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      title: fullTitle,
      description: config.description,
      url,
      siteName: SITE_NAME,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: config.description,
      images: [imageUrl],
    },
    other: { title: fullTitle },
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[], path?: string) {
  return {
    '@type': 'BreadcrumbList',
    ...(path ? { '@id': `${BASE_URL}${path.startsWith('/') ? path : '/' + path}#breadcrumb` } : {}),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url.startsWith('/') ? item.url : '/' + item.url}`,
    })),
  };
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** Unified @graph: WebSite + Organization on every page, plus page-specific nodes. */
export function buildGraph(pageSchema?: unknown | unknown[]) {
  const graph: unknown[] = [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_NAME,
      alternateName: ['iNNkie Platform', 'iNNkie.com', 'Innkie'],
      description: 'All-in-One Utility Platform',
      publisher: { '@id': `${BASE_URL}/#organization` },
      inLanguage: 'en-US',
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/tools?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        '@id': `${BASE_URL}/#logo`,
        url: `${BASE_URL}/favicon.svg`,
        contentUrl: `${BASE_URL}/favicon.svg`,
        width: 512,
        height: 512,
        caption: SITE_NAME,
      },
      image: { '@id': `${BASE_URL}/#logo` },
      sameAs: ['https://www.linkedin.com/company/innkie/'],
    },
  ];
  if (pageSchema) {
    if (Array.isArray(pageSchema)) graph.push(...pageSchema);
    else graph.push(pageSchema);
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** SoftwareApplication + BreadcrumbList nodes used by every tool page. */
export function buildToolSchema(opts: { route: string; appName: string; crumb: string; description: string; category?: string }) {
  const url = `${BASE_URL}${opts.route}`;
  return [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: opts.appName,
      url,
      operatingSystem: 'Any',
      applicationCategory: opts.category ?? 'DeveloperApplication',
      description: opts.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Tools', url: '/tools' }, { name: opts.crumb, url: opts.route }]),
  ];
}
