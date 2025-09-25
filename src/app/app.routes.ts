import { Routes } from '@angular/router';
import { HomeComponent } from './core/home/home.component';
import {LoginComponent} from './core/login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {path: 'login',
    loadComponent: () =>
      import('./core/login/login.component').then(c => c.LoginComponent)
  },
  {path: 'dashboard',
  loadComponent: () =>
  import('./core/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features/features.component').then(c => c.FeaturesComponent)

  },
  { path: '**', redirectTo: '' }
];
