import { BadRequestException } from '@nestjs/common';
import { isPersonalWorkspace } from '@innkie/shared-models';

/** What the API key identifies: a workspace and the account that owns it. */
export interface KeyWorkspace {
  id: string;
  ownerId?: string;
}

export const API_KEY_FORMAT = /^ik_[0-9a-f]{48}$/;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_ANALYTICS_DAYS = 30;

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && typeof v._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  return null;
}

function expirationOut(e: any) {
  if (!e || typeof e !== 'object') return null;
  const { expiryDate, ...rest } = e;
  return expiryDate ? { ...rest, expiryDate: toIso(expiryDate) } : rest;
}

/**
 * The only shape links leave the API in. An allow-list on purpose: the stored document also holds the password
 * hash and salt, the owner's uid and internal fields that must never reach API clients or webhook receivers.
 */
export function toPublicLink(doc: any, baseUrl: string) {
  const code: string = doc.shortCode ?? doc.id;
  return {
    shortCode: code,
    shortUrl: `${baseUrl.replace(/\/$/, '')}/${code}`,
    originalUrl: doc.originalUrl ?? null,
    customAlias: doc.customAlias ?? null,
    title: doc.title ?? null,
    description: doc.description ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    campaign: doc.campaign ?? null,
    isActive: doc.isActive !== false,
    passwordProtected: !!doc.passwordProtected,
    expiration: expirationOut(doc.expiration),
    clickCount: typeof doc.clickCount === 'number' ? doc.clickCount : 0,
    source: doc.source ?? null,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/** True only when the link belongs to the workspace the API key was issued for. Never matches across workspaces. */
export function linkBelongsToWorkspace(link: any, ws: KeyWorkspace): boolean {
  if (!link || !ws?.id) return false;
  if (!isPersonalWorkspace(ws.id)) return link.workspaceId === ws.id;
  const owner = ws.ownerId || ws.id.replace(/^personal_/, '');
  if (!owner || link.userId !== owner) return false;
  return link.workspaceId === ws.id || link.workspaceId === 'personal' || link.workspaceId == null;
}

export function parsePageSize(v: unknown): number {
  if (v === undefined || v === '') return DEFAULT_PAGE_SIZE;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PAGE_SIZE) {
    throw new BadRequestException(`limit must be a whole number between 1 and ${MAX_PAGE_SIZE}`);
  }
  return n;
}

export function parseDays(v: unknown): number {
  if (v === undefined || v === '') return 7;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ANALYTICS_DAYS) {
    throw new BadRequestException(`days must be a whole number between 1 and ${MAX_ANALYTICS_DAYS}`);
  }
  return n;
}

export function parseCursor(v: unknown): string | undefined {
  if (v === undefined || v === '') return undefined;
  if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(v)) throw new BadRequestException('cursor is invalid');
  return v;
}

/** Accepts `url` (documented) or `originalUrl`, and never a client-chosen workspace: the key decides that. */
export function publicCreateBody(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid body');
  const { workspaceId: _ignored, url, originalUrl, ...rest } = body;
  return { ...rest, originalUrl: url ?? originalUrl };
}
