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
    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Features', url: '/features' }
    ]);
    this.seo.updateSeo(
      'Platform Features | iNNkie',
      'Discover iNNkie’s unified suite of digital utilities: high-performance link management, QR Studio, media optimization, and developer-first APIs.',
      '/features',
      'assets/preview.png',
      breadcrumbs
    );
  }
}
