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

  updateSeo(title: string, description: string, path: string = '', image: string = 'assets/preview.png') {
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
    this.updateSeo(
      'Smart URL Shortener & Link Management',
      'Shorten, manage, and track your links effortlessly with iNNkie. Create custom short URLs, monitor clicks, and optimize your sharing strategy.',
      '/'
    );
  }
}
