import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../shared/services/theme.service';
import { SeoService } from '../shared/services/seo.service';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent implements OnInit {
  private themeService = inject(ThemeService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.themeService.resetTheme();
    const tools = [
      { name: 'URL Shortener', url: '/tools/link-shortener' },
      { name: 'UTM Builder', url: '/tools/utm-builder' },
      { name: 'QR Generator', url: '/tools/qr-generator' },
      { name: 'QR Studio', url: '/tools/qr-studio' },
      { name: 'Image Compressor', url: '/tools/image-compressor' },
      { name: 'Image Resizer', url: '/tools/image-resizer' },
      { name: 'PNG to JPEG', url: '/tools/png-to-jpeg' },
      { name: 'SVG to PNG', url: '/tools/svg-to-png' },
      { name: 'PDF to Image', url: '/tools/pdf-to-image' },
      { name: 'Image to PDF', url: '/tools/image-to-pdf' },
      { name: 'JSON Formatter', url: '/tools/json-formatter' },
      { name: 'JWT Decoder', url: '/tools/jwt-decoder' },
      { name: 'Base64 Encoder', url: '/tools/base64-encoder' },
      { name: 'CSV JSON Converter', url: '/tools/csv-json-converter' }
    ];
    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Features', url: '/features' }
    ]);
    const schema = [{
      '@type': 'CollectionPage',
      '@id': 'https://innkie.com/features#features',
      'name': 'iNNkie Features and Web Utilities',
      'url': 'https://innkie.com/features',
      'description': 'Explore iNNkie features and utilities for links, QR codes, media, documents, developer workflows, workspaces, analytics, and API access.',
      'mainEntity': {
        '@type': 'ItemList',
        'itemListElement': tools.map((tool, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'name': tool.name,
          'url': `https://innkie.com${tool.url}`
        }))
      }
    }, breadcrumbs];

    this.seo.updateSeo(
      'Platform Features',
      'Explore iNNkie web utilities for links, QR codes, media, documents, developer workflows, workspaces, analytics, and API access.',
      '/features',
      'assets/preview.png',
      schema
    );
  }
}
