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

  updateSeo(title: string, description: string, path: string = '', image: string = 'assets/preview.png', schema?: any, noindex: boolean = false) {
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

    // 4. Twitter
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: `${this.baseUrl}/${image}` });
    this.metaService.updateTag({ name: 'twitter:url', content: url });

    // 5. Canonical Link
    this.updateCanonicalLink(url);

    // 6. JSON-LD Schema
    if (schema) {
      this.updateSchema(schema);
    } else {
      this.removeSchema();
    }

    // 7. Robots
    if (noindex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.removeTag('name="robots"');
    }
  }

  updateSchema(schema: any) {
    let script = this.document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }

  removeSchema() {
    const script = this.document.querySelector('script[type="application/ld+json"]');
    if (script) {
      this.document.head.removeChild(script);
    }
  }

  getBreadcrumbSchema(items: { name: string, url: string }[]) {
    return {
      '@context': 'https://schema.org',
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

  resetSeo() {
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${this.baseUrl}/#website`,
          'url': this.baseUrl,
          'name': 'iNNkie',
          'description': 'Smart URL Shortener & Link Management',
          'potentialAction': [{
            '@type': 'SearchAction',
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': `${this.baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }],
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
          'image': { '@id': `${this.baseUrl}/#logo` }
        }
      ]
    };

    this.updateSeo(
      'Smart URL Shortener & Link Management',
      'Shorten, manage, and track your links effortlessly with iNNkie. Create custom short URLs, monitor clicks, and optimize your sharing strategy.',
      '/',
      'assets/preview.png',
      defaultSchema
    );
  }
}
