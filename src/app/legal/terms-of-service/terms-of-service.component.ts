import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.scss']
})
export class TermsOfServiceComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Terms of Service', url: '/terms' }
    ]);
    this.seo.updateSeo(
      'Terms of Service', 
      'Read our terms of service to understand the rules and guidelines for using iNNkie.', 
      '/terms',
      'assets/preview.png',
      breadcrumbs
    );
  }

  printSection() {
    window.print();
  }
}
