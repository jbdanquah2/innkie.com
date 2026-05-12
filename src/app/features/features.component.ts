import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../shared/services/theme.service';
import { SeoService } from '../shared/services/seo.service';
import { TOOL_REGISTRY, UtilityTool } from '../shared/config/tool-registry';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent implements OnInit {
  private themeService = inject(ThemeService);
  private seo = inject(SeoService);

  tools: UtilityTool[] = TOOL_REGISTRY;

  ngOnInit() {
    this.themeService.resetTheme();
    
    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Features', url: '/features' }
    ]);

    // Programmatic Schema Generation for the Features Page
    const schema = [
      {
        '@type': 'WebPage',
        '@id': 'https://innkie.com/features#webpage',
        'url': 'https://innkie.com/features',
        'name': 'iNNkie Features - All-in-One Utility Platform',
        'description': 'Comprehensive overview of iNNkie utilities including link management, QR studio, image optimization, and developer tools.',
        'breadcrumb': { '@id': 'https://innkie.com/features#breadcrumb' }
      },
      {
        '@type': 'ItemList',
        'name': 'iNNkie Utility Suite',
        'description': 'A professional-grade suite of browser-side tools for digital teams.',
        'itemListElement': this.tools.map((tool, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'SoftwareApplication',
            'name': tool.name,
            'url': `https://innkie.com${tool.route}`,
            'description': tool.description,
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Any'
          }
        }))
      },
      breadcrumbs
    ];

    this.seo.updateSeo(
      'Advanced Features & All-in-One Web Utilities',
      'Discover iNNkie\'s professional suite of browser-side utilities. Secure URL shortening, branded QR codes, batch image optimization, and developer tools built for modern teams.',
      '/features',
      'assets/preview.png',
      schema
    );
  }

  getToolsByCategory(categoryId: string) {
    return this.tools.filter(t => t.category === categoryId);
  }
}
