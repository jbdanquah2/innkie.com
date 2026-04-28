import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  private readonly siteName = 'iNNkie';
  private readonly baseUrl = 'https://innkie.com';

  updateSeo(title: string, description: string, image: string = 'assets/preview.png') {
    const fullTitle = `${title} | ${this.siteName}`;
    
    // 1. Update Title
    this.titleService.setTitle(fullTitle);

    // 2. Primary Meta Tags
    this.metaService.updateTag({ name: 'title', content: fullTitle });
    this.metaService.updateTag({ name: 'description', content: description });

    // 3. Open Graph / Facebook
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: `${this.baseUrl}/${image}` });

    // 4. Twitter
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: `${this.baseUrl}/${image}` });
  }

  resetSeo() {
    this.updateSeo(
      'Smart URL Shortener & Link Management',
      'Shorten, manage, and track your links effortlessly with iNNkie. Create custom short URLs, monitor clicks, and optimize your sharing strategy.'
    );
  }
}
