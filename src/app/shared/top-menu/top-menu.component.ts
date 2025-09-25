import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';

@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-menu.component.html',
  styleUrl: './top-menu.component.scss'
})
export class TopMenuComponent {

  router= inject(Router);

  isMenuOpen = false;

  // This would typically come from an auth service
  isLoggedIn = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goToLogin() {
    console.log('Go to login');

    this.router.navigate(['/login']);

    console.log('Done');

  }
}
