import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  private readonly siteName = 'iNNkie';
  private readonly baseUrl = 'https://innkie.com';

  /**
   * Updates the SEO metadata for the current page.
   * @param title Page title (will be suffixed with | iNNkie)
   * @param description Meta description
   * @param path Canonical path (e.g., '/tools/qr-studio')
   * @param image Preview image path
   * @param pageSchema Specific JSON-LD for this page (e.g., SoftwareApplication or BreadcrumbList)
   * @param noindex Whether to set robots to noindex
   */
  updateSeo(title: string, description: string, path: string = '', image: string = 'assets/preview.png', pageSchema?: any | any[], noindex: boolean = false) {
    const fullTitle = `${title} | ${this.siteName}`;
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    
    // 1. Update Title
    this.titleService.setTitle(fullTitle);

    // 2. Primary Meta Tags
    this.metaService.updateTag({ name: 'title', content: fullTitle });
    this.metaService.updateTag({ name: 'description', content: description });

    // 3. Open Graph / Facebook
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: `${this.baseUrl}/${image}` });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // 4. Twitter
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: `${this.baseUrl}/${image}` });

    // 5. Canonical Link
    this.updateCanonicalLink(url);

    // 6. JSON-LD Schema (Unified @graph approach)
    this.updateUnifiedSchema(pageSchema);

    // 7. Robots
    if (noindex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.removeTag('name="robots"');
    }
  }

  /**
   * Builds and injects a unified @graph JSON-LD script.
   * This prevents page-level schema from overwriting Organization/WebSite signals.
   */
  private updateUnifiedSchema(pageSchema?: any | any[]) {
    const graph: any[] = [
      {
        '@type': 'WebSite',
        '@id': `${this.baseUrl}/#website`,
        'url': this.baseUrl,
        'name': 'iNNkie',
        'description': 'All-in-One Utility Platform',
        'publisher': { '@id': `${this.baseUrl}/#organization` },
        'inLanguage': 'en-US'
      },
      {
        '@type': 'Organization',
        '@id': `${this.baseUrl}/#organization`,
        'name': 'iNNkie',
        'url': this.baseUrl,
        'logo': {
          '@type': 'ImageObject',
          '@id': `${this.baseUrl}/#logo`,
          'url': `${this.baseUrl}/favicon.svg`,
          'contentUrl': `${this.baseUrl}/favicon.svg`,
          'width': 512,
          'height': 512,
          'caption': 'iNNkie'
        },
        'image': { '@id': `${this.baseUrl}/#logo` },
        'sameAs': [
          'https://www.linkedin.com/company/innkie/'
        ]
      }
    ];

    // Add page-specific schema if provided
    if (pageSchema) {
      if (Array.isArray(pageSchema)) {
        graph.push(...pageSchema);
      } else {
        graph.push(pageSchema);
      }
    }

    const unifiedSchema = {
      '@context': 'https://schema.org',
      '@graph': graph
    };

    let script = this.document.querySelector('script[id="innkie-schema"]') as HTMLScriptElement;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'innkie-schema';
      this.document.head.appendChild(script);
    }
    script.text = JSON.stringify(unifiedSchema);
  }

  getBreadcrumbSchema(items: { name: string, url: string }[]) {
    return {
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': `${this.baseUrl}${item.url.startsWith('/') ? item.url : '/' + item.url}`
      }))
    };
  }

  private updateCanonicalLink(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Reset to homepage SEO defaults.
   */
  resetSeo() {
    this.updateSeo(
      'All-in-One Utility Platform',
      'Supercharge your digital productivity with iNNkie. A unified suite of utilities including smart URL shortening, QR Studio, image optimization, and developer tools.',
      '/',
      'assets/preview.png'
    );
  }
}
