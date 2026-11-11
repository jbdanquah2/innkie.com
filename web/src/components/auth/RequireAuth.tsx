'use client';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Client-side gate for the signed-in app (a static export has no middleware).
 * Renders nothing until Firebase reports the auth state, then redirects guests to /login/?returnUrl=...
 * The real protection is the API + Firestore rules; this only keeps guests out of the UI.
 */
export function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      const returnUrl = window.location.pathname + window.location.search;
      window.location.replace(`/login/?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [ready, user]);

  if (!ready || !user) return <>{fallback}</>;
  return <>{children}</>;
}
