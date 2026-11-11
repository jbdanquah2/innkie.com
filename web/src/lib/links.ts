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

  // COMPATIBILITY (remove once the new API is deployed): an API without password/expiry support ignores those fields
  // on create and returns an unprotected link. Never leave the caller thinking a link is protected when it isn't:
  // apply what was requested with a follow-up update, and fail loudly if that fails.
  if (user) {
    const missingPassword = !!(opts.passwordProtected && opts.password) && !result.passwordProtected;
    const missingExpiration = !!opts.expiration && !result.expiration;
    if (missingPassword || missingExpiration) {
      const followUp: Record<string, unknown> = {};
      if (missingPassword) Object.assign(followUp, { passwordProtected: true }, await legacyHashPassword(opts.password!, result.shortCode));
      if (missingExpiration) followUp['expiration'] = opts.expiration;
      try {
        await linksApi.update(result.shortCode, followUp);
        Object.assign(result, followUp);
        delete (result as any).password;
        delete (result as any).passwordSalt;
      } catch (e: any) {
        throw new Error(`The link was created (${result.shortCode}) but its ${missingPassword ? 'password' : 'expiry'} could not be applied: ${e?.message || 'update failed'}. Edit the link to set it.`);
      }
    }
  }

  if (user) void logToolUsage('link_shortener', 'shorten');
  else saveGuestLink(result);
  return result as CreatedLink;
}

/**
 * TEMPORARY (backend gap): PUT /v1/links/:code stores `password` verbatim, while the redirect check computes
 * sha256(enteredPassword + passwordSalt). Until the API hashes on update, edits must send a pre-hashed password
 * using the legacy scheme (salt = short code). Create does NOT need this: POST /shorten-url hashes server-side.
 * Remove this once the API accepts a plain password on update.
 */
export async function legacyHashPassword(password: string, shortCode: string): Promise<{ password: string; passwordSalt: string }> {
  const data = new TextEncoder().encode(password + shortCode);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { password: hex, passwordSalt: shortCode };
}
