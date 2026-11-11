// Single place that reads NEXT_PUBLIC_* variables (inlined at build time).
// Replaces src/environments/environment*.ts from the Angular app.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.innkie.com/api';

export const env = {
  apiUrl,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://innkie.com',
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '',
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  // Endpoint URLs the Angular environment files exposed individually.
  endpoints: {
    shortenUrl: `${apiUrl}/shorten-url`,
    applyCustomClaims: `${apiUrl}/apply-custom-claims`,
    previewLongUrl: `${apiUrl}/preview-url`,
    redirectUrl: `${apiUrl}/redirect-url`,
  },
} as const;

export const isProduction = process.env.NODE_ENV === 'production';
