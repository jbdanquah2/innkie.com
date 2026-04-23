import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import {authGuard} from './shared/guards/auth.guard';
import {PasswordGuard} from './shared/guards/short-password.guard';
import { LayoutComponent } from './layout/layout.component';
import { DashboardOverviewComponent } from './pages/dashboard-overview/dashboard-overview.component';
import { AnalyticsHubComponent } from './pages/analytics-hub/analytics-hub.component';
import { QrStudioComponent } from './pages/qr-studio/qr-studio.component';
import { DeveloperApiComponent } from './pages/developer-api/developer-api.component';

export const routes: Routes = [
  { path: '',
    component: HomeComponent,
  },
  {path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(c => c.LoginComponent),
    canActivate: [authGuard]

  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    data: { hideLayout: true },
    children: [
      {
        path: 'dashboard',
        component: DashboardOverviewComponent
      },
      {
        path: 'links',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
      },
      {
        path: 'analytics',
        component: AnalyticsHubComponent
      },
      {
        path: 'qr-studio',
        component: QrStudioComponent
      },
      {
        path: 'developer-api',
        component: DeveloperApiComponent
      },
      {
        path: 'dashboard/details/:shortCode',
        loadComponent: () => import('./dashboard/short-url-details/short-url-details.component').then(c => c.ShortUrlDetailsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings.component').then(c => c.SettingsComponent),
      }
    ]
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs.component').then(c => c.DocsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./legal/privacy-policy/privacy-policy.component').then(c => c.PrivacyPolicyComponent)
  },
  {
    path: 'terms',
    loadComponent: () =>
    import('./legal/terms-of-service/terms-of-service.component').then(c => c.TermsOfServiceComponent)
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
