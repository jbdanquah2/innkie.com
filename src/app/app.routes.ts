import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {LoginComponent} from './login/login.component';
import {authGuard} from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '',
    component: HomeComponent
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
    path: 'password',
    loadComponent: () =>
      import('./password-dialog/password-dialog.component').then(c => c.PasswordDialogComponent),

  },
  { path: '**', redirectTo: '' ,
    component: HomeComponent
  }
];
