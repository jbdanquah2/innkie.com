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
    this.seo.updateSeo(
      'Platform Features',
      'Discover iNNkie’s advanced features: smart campaign tracking, branded links, detailed analytics, and global performance infrastructure.'
    );
  }
}
