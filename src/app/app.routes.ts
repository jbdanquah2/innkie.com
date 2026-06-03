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
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(c => c.AboutComponent)
  },
  {
    path: 'guides',
    loadComponent: () => import('./pages/guides/guides-hub.component').then(c => c.GuidesHubComponent)
  },
  {
    path: 'guides/:slug',
    loadComponent: () => import('./pages/guides/guide-detail.component').then(c => c.GuideDetailComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(c => c.ContactComponent)
  },
  {
    path: 'tools',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/tools/tools-hub.component').then(c => c.ToolsHubComponent),
      },
      {
        path: 'link-shortener',
        loadComponent: () => import('./pages/tools/link-shortener/link-shortener.component').then(c => c.LinkShortenerComponent)
      },
      {
        path: 'custom-short-links',
        loadComponent: () => import('./pages/tools/link-shortener/link-shortener.component').then(c => c.LinkShortenerComponent)
      },
      {
        path: 'qr-generator',
        loadComponent: () => import('./pages/tools/qr-generator/qr-generator.component').then(c => c.QrGeneratorComponent)
      },
      {
        path: 'image-compressor',
        loadComponent: () => import('./pages/tools/image-compressor/image-compressor.component').then(c => c.ImageCompressorComponent)
      },
      {
        path: 'compress-images-for-shopify',
        loadComponent: () => import('./pages/tools/image-compressor/image-compressor.component').then(c => c.ImageCompressorComponent)
      },
      {
        path: 'image-resizer',
        loadComponent: () => import('./pages/tools/image-resizer/image-resizer.component').then(c => c.ImageResizerComponent)
      },
      {
        path: 'resize-linkedin-banner',
        loadComponent: () => import('./pages/tools/image-resizer/image-resizer.component').then(c => c.ImageResizerComponent)
      },
      {
        path: 'png-to-jpeg',
        loadComponent: () => import('./pages/tools/png-to-jpeg/png-to-jpeg.component').then(c => c.PngToJpegComponent)
      },
      {
        path: 'svg-to-png',
        loadComponent: () => import('./pages/tools/svg-to-png/svg-to-png.component').then(c => c.SvgToPngComponent)
      },
      {
        path: 'pdf-to-image',
        loadComponent: () => import('./pages/tools/pdf-to-image/pdf-to-image.component').then(c => c.PdfToImageComponent)
      },
      {
        path: 'image-to-pdf',
        loadComponent: () => import('./pages/tools/image-to-pdf/image-to-pdf.component').then(c => c.ImageToPdfComponent)
      },
      {
        path: 'json-formatter',
        loadComponent: () => import('./pages/tools/json-formatter/json-formatter.component').then(c => c.JsonFormatterComponent)
      },
      {
        path: 'utm-builder',
        loadComponent: () => import('./pages/tools/utm-builder/utm-builder.component').then(c => c.UtmBuilderComponent)
      },
      {
        path: 'jwt-decoder',
        loadComponent: () => import('./pages/tools/jwt-decoder/jwt-decoder.component').then(c => c.JwtDecoderComponent)
      },
      {
        path: 'csv-json-converter',
        loadComponent: () => import('./pages/tools/data-converter/data-converter.component').then(c => c.DataConverterComponent)
      },
      {
        path: 'base64-encoder',
        loadComponent: () => import('./pages/tools/base64-encoder/base64-encoder.component').then(c => c.Base64EncoderComponent)
      },
      {
        path: 'data-converter',
        redirectTo: 'csv-json-converter',
        pathMatch: 'full'
      },
      {
        path: 'qr-studio',
        loadComponent: () => import('./pages/qr-studio/qr-studio.component').then(c => c.QrStudioComponent)
      }
    ]
  },
  {
    path: 'r/:shortcode',
    loadComponent: () =>
      import('./redirect/redirect.component').then(c => c.RedirectComponent),
    canActivate: [PasswordGuard],
    data: {hideLayout: true}
  },
  {
    path: '404',
    loadComponent: () =>
      import('./not-found/not-found.component').then(c => c.NotFoundComponent),
    data: { hideLayout: true }
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
    loadComponent: () =>
      import('./not-found/not-found.component').then(c => c.NotFoundComponent),
    data: { hideLayout: true }
  }
];
