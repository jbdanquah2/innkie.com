import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="hero">
        <h1 class="brand">Contact Us</h1>
        <p class="tag">We're here to help you get the most out of iNNkie.</p>
      </div>

      <div class="content">
        <section>
          <h2>Get in Touch</h2>
          <p>
            Have a question, feedback, or a feature request? We'd love to hear from you. 
            Our team is dedicated to building the best utility platform on the web, and your 
            input is a vital part of that process.
          </p>
        </section>

        <section>
          <h3>Support Email</h3>
          <p>
            For technical support, account inquiries, or general questions, please email us at:
            <br>
            <a href="mailto:hello@innkie.com" class="font-bold">hello&#64;innkie.com</a>
          </p>
          <p class="muted">We typically respond within 24-48 business hours.</p>
        </section>

        <section>
          <h3>Business & Partnerships</h3>
          <p>
            For business inquiries, enterprise solutions, or partnership opportunities, reach out to:
            <br>
            <a href="mailto:hello@innkie.com" class="font-bold">hello&#64;innkie.com</a>
          </p>
        </section>

        <section>
          <h2>Frequently Asked Questions</h2>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
              <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Is iNNkie free to use?</h4>
              <p>Yes! Our core utility tools like the QR Generator, Image Compressor, and JSON Formatter are 100% free and run in your browser.</p>
            </div>
            <div>
              <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Where is my data stored?</h4>
              <p>For our browser-side tools, your data never leaves your device. For link shortening and account data, we use secure, encrypted Firebase storage.</p>
            </div>
            <div>
              <h4 style="font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">How can I report a bug?</h4>
              <p>Please send a detailed description of the issue, including your browser version and steps to reproduce, to hello&#64;innkie.com.</p>
            </div>
          </div>
        </section>

        <div class="footer">
          <p>&copy; 2024 iNNkie Utility Platform</p>
          <a routerLink="/about">About iNNkie</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../../legal/legal.component.scss']
})
export class ContactComponent implements OnInit {
  private seo = inject(SeoService);
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.resetTheme();
    this.seo.updateSeo(
      'Contact Us | iNNkie Support',
      'Have questions or feedback? Contact the iNNkie team. We provide support for our URL shortener, QR Studio, and free web utilities.',
      '/contact'
    );
  }
}
