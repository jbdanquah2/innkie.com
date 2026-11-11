'use client';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { toDateSafe } from './utils/urls';

/** "3 minutes ago" for Firestore timestamps / dates / ISO strings; '' when unparseable. */
export function timeAgo(value: unknown): string {
  const d = toDateSafe(value);
  return d && !isNaN(d.getTime()) ? formatDistanceToNowStrict(d, { addSuffix: true }) : '';
}

/** Same, re-rendering every minute so labels stay fresh (Angular's impure TimeAgoPipe). */
export function useTimeAgo(value: unknown): string {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  return timeAgo(value);
}
