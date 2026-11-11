'use client';
import { apiFetch } from './api';
import { linksApi } from './api/links';
import { env } from './env';
import { getFirebaseAuth } from './firebase';
import { logToolUsage } from './metrics';

export interface CreatedLink {
  shortCode: string;
  originalUrl?: string;
  [key: string]: unknown;
}

const GUEST_LINKS_KEY = 'innkie_guest_links';

export function getGuestLinks(): CreatedLink[] {
  try {
    const raw = localStorage.getItem(GUEST_LINKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestLink(link: CreatedLink) {
  try {
    // Keep only the last 10 links for guests
    localStorage.setItem(GUEST_LINKS_KEY, JSON.stringify([link, ...getGuestLinks()].slice(0, 10)));
  } catch {}
}

/**
 * Creates a short link via POST /api/shorten-url. Works for guests and signed-in users.
 * Throws an Error with a user-presentable message on failure (callers show the toast).
 * The server owns hashing/validation of optional password + expiration (Phase 4 passes them through).
 */
export interface CreateLinkOptions {
  workspaceId?: string | null;
  customAlias?: string;
  tags?: string[];
  passwordProtected?: boolean;
  /** Plain-text password: hashed and stored by the API (never hash or persist it client-side). */
  password?: string;
  expiration?: { mode: 'oneTime' | 'clicks' | 'duration'; maxClicks?: number; durationValue?: number; durationUnit?: 'hours' | 'days' } | null;
  campaign?: { utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null } | null;
}

export async function createShortUrl(originalUrl: string, opts: CreateLinkOptions = {}): Promise<CreatedLink> {
  const user = getFirebaseAuth().currentUser;
  let workspaceId = opts.workspaceId ?? null;
  if (user && !workspaceId) {
    try {
      workspaceId = localStorage.getItem('activeWorkspaceId');
    } catch {}
  }

  const res = await apiFetch(env.endpoints.shortenUrl, {
    method: 'POST',
    body: JSON.stringify({
      originalUrl,
      userId: user?.uid ?? null,
      workspaceId,
      customAlias: opts.customAlias ?? '',
      tags: opts.tags ?? [],
      ...(opts.passwordProtected && opts.password ? { passwordProtected: true, password: opts.password } : {}),
      ...(opts.expiration ? { expiration: opts.expiration } : {}),
      ...(opts.campaign ? { campaign: opts.campaign } : {}),
    }),
  });
  const result = await res.json().catch(() => null);
  if (!res.ok || !result || result.error) {
    throw new Error(result?.error || result?.message || 'Failed to shorten URL');
  }

  // Never leave the caller thinking a link is protected when the API silently ignored the option.
  if (opts.passwordProtected && opts.password && !result.passwordProtected) {
    throw new Error(`The link was created (${result.shortCode}) but its password was not applied. Edit the link to set it.`);
  }
  if (opts.expiration && !result.expiration) {
    throw new Error(`The link was created (${result.shortCode}) but its expiry was not applied. Edit the link to set it.`);
  }

  if (user) void logToolUsage('link_shortener', 'shorten');
  else saveGuestLink(result);
  return result as CreatedLink;
}
