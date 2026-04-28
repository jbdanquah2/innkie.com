import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.updateSeo('Privacy Policy', 'Read our privacy policy to understand how iNNkie handles and protects your data.');
  }

  printSection() {
    window.print();
  }
}
