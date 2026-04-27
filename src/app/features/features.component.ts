import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../shared/services/theme.service';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.resetTheme();
  }
}
