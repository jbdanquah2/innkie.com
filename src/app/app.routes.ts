import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {authGuard} from './shared/guards/auth.guard';
import {PasswordGuard} from './shared/guards/short-password.guard';

export const routes: Routes = [
  { path: '',
    component: HomeComponent,
  },
  {path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(c => c.LoginComponent),
    canActivate: [authGuard]

  },
  {path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features/features.component').then(c => c.FeaturesComponent),
  },
  {
    path: 'r/:shortcode',
    loadComponent: () =>
      import('./redirect/redirect.component').then(c => c.RedirectComponent),
    canActivate: [PasswordGuard],
    data: {hideLayout: true}
  },
  {
    path: ':shortcode',
    loadComponent: () =>
      import('./redirect/redirect.component').then(c => c.RedirectComponent),
    canActivate: [PasswordGuard],
    data: { hideLayout: true }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
