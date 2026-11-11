// Ported from src/app/shared/utils/utils.urls.ts (framework-free parts only).

/** Reserved single-segment paths that must never be treated as short codes. */
export const APP_PATHS = ['/',
  'dashboard', 'home', 'admin', 'login', 'logout', 'signin', 'signup', 'register',
  'profile', 'settings', 'account', 'user', 'users', 'me', 'my', 'auth',
  'api', 'backend', 'server', 'system', 'config', 'docs', 'swagger',
  'graphql', 'rest', 'v1', 'v2', 'api-docs',
  'about', 'contact', 'help', 'support', 'faq', 'privacy', 'terms',
  'blog', 'news', 'careers', 'jobs', 'status',
  '404', '500', 'error', 'maintenance', 'offline', 'redirect',
  'root', 'super', 'owner', 'master', 'manage', 'cms', 'console', 'reports',
  'pricing', 'plans', 'billing', 'payment', 'checkout', 'subscribe', 'unsubscribe',
  'webhook', 'hooks', 'callback', 'integration', 'oauth', 'token', 'keys',
  'ads.txt', 'robots.txt', 'sitemap.xml',
];

/** Normalises Firestore Timestamp / {seconds,nanoseconds} / {_seconds} / Date / number / string. */
export function toDateSafe(value: any): Date | null {
  if (!value) return null;

  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return value < 1e12 ? new Date(value * 1000) : new Date(value);
  }
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (!isNaN(asNum)) return toDateSafe(asNum);
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export const FALLBACK_FAVICON = '/assets/logo-mark.svg';
