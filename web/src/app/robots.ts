import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

// Ported from src/robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/features', '/privacy', '/terms', '/about', '/contact'],
      disallow: ['/dashboard', '/links', '/analytics', '/qr-studio', '/developer-api', '/settings', '/r/', '/api/', '/__/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
