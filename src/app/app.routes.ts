import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import {LoginComponent} from './features/login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(c => c.LoginComponent)
  },
  {path: 'dashboard',
  loadComponent: () =>
  import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  { path: '**', redirectTo: '' }
];
