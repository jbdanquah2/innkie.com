import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <h1 class="brand">About iNNkie</h1>
        <p class="tag">The All-in-One Utility Platform for Modern Creators.</p>
      </div>

      <div class="content">
        <section>
          <h2>Our Mission</h2>
          <p>
            iNNkie was born out of a simple frustration: the web is full of utility tools that are either cluttered with intrusive ads, 
            require slow file uploads, or compromise user privacy. We set out to build a "Swiss Army Knife" for the modern web—a suite 
            of high-performance tools that are fast, beautiful, and run entirely in your browser.
          </p>
        </section>

        <section>
          <h2>Privacy First, Always</h2>
          <p>
            Unlike many other platforms, iNNkie's tools (like our Image Optimizer and QR Generator) process your data locally on your device. 
            Your images and sensitive data never touch our servers. We believe that your productivity should not come at the cost of your privacy.
          </p>
        </section>

        <section>
          <h2>The iNNkie Ecosystem</h2>
          <p>
            iNNkie is more than just a collection of tools. It's an integrated ecosystem designed for teams and individuals:
          </p>
          <ul>
            <li><strong>Smart Link Management:</strong> High-fidelity redirection with real-time analytics and branded short domains.</li>
            <li><strong>QR Studio:</strong> Professional-grade QR design with custom branding, logos, and gradients.</li>
            <li><strong>Media Optimization:</strong> Zero-latency image compression and conversion, all handled client-side.</li>
            <li><strong>Developer Utilities:</strong> Clean, precise tools for JSON formatting, UTM building, and more.</li>
          </ul>
        </section>

        <section>
          <h2>Built for Speed</h2>
          <p>
            iNNkie is optimized for the highest possible performance. 
            Whether you're a developer needing a quick JSON format or a marketer building a complex campaign, iNNkie is built 
            to keep you in your flow.
          </p>
        </section>

        <div class="footer">
          <p>&copy; 2024 iNNkie Utility Platform</p>
          <a routerLink="/features">See Features</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../../legal/legal.component.scss']
})
export class AboutComponent implements OnInit {
  private seo = inject(SeoService);
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.resetTheme();

    const breadcrumbs = this.seo.getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' }
    ], '/about');

    this.seo.updateSeo(
      'About Our Mission & Privacy',
      'Learn about iNNkie, the privacy-focused utility platform. Discover our mission to provide high-performance, browser-side tools for creators and developers.',
      '/about',
      'assets/preview.png',
      breadcrumbs
    );
  }
}
