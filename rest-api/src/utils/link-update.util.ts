import { BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { hashPassword, isReservedWord } from './url.utils';

/** Fields a client may change through PUT /v1/links/:code. Everything else (counters, owner, hashes, ...) is ignored. */
export const EDITABLE_LINK_FIELDS = [
  'title', 'description', 'customAlias', 'isActive', 'tags', 'campaign',
  'expiration', 'passwordProtected', 'password',
] as const;

const EXPIRATION_MODES = ['never', 'clicks', 'duration', 'oneTime', 'date'];
const DURATION_UNITS = ['minutes', 'hours', 'days'];
const UTM_KEYS = ['utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent'];
const ALIAS_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function text(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string') throw new BadRequestException(`${field} must be a string`);
  if (v.length > max) throw new BadRequestException(`${field} must be at most ${max} characters`);
  return v;
}

export function positiveInt(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 1_000_000) {
    throw new BadRequestException(`${field} must be a whole number between 1 and 1000000`);
  }
  return v;
}

export function sanitizeExpiration(v: any) {
  if (!v || typeof v !== 'object' || !EXPIRATION_MODES.includes(v.mode)) {
    throw new BadRequestException('expiration.mode is invalid');
  }
  switch (v.mode) {
    case 'never':
      return { mode: 'never' };
    case 'clicks':
    case 'oneTime':
      return { mode: v.mode, maxClicks: positiveInt(v.maxClicks, 'expiration.maxClicks') };
    case 'duration':
      if (!DURATION_UNITS.includes(v.durationUnit)) throw new BadRequestException('expiration.durationUnit is invalid');
      return { mode: 'duration', durationValue: positiveInt(v.durationValue, 'expiration.durationValue'), durationUnit: v.durationUnit };
    default: {
      const d = new Date(v.expiryDate);
      if (typeof v.expiryDate !== 'string' || isNaN(d.getTime())) throw new BadRequestException('expiration.expiryDate must be an ISO date string');
      return { mode: 'date', expiryDate: Timestamp.fromDate(d) };
    }
  }
}

export function sanitizeCampaign(c: any): Record<string, string | null> | null {
  if (c === null || c === undefined) return null;
  if (typeof c !== 'object' || Array.isArray(c)) throw new BadRequestException('campaign is invalid');
  const out: Record<string, string | null> = {};
  for (const k of UTM_KEYS) {
    if (c[k] != null && c[k] !== '') out[k] = text(c[k], k, 200);
    else if (k in c) out[k] = null;
  }
  return out;
}

export interface SanitizedLinkUpdate {
  updates: Record<string, unknown>;
  /** Plain-text password to hash (set), or null to clear. undefined = leave unchanged. */
  newPassword?: string | null;
}

export function sanitizeLinkUpdate(body: any): SanitizedLinkUpdate {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid body');
  const updates: Record<string, unknown> = {};
  let newPassword: string | null | undefined;

  if ('title' in body) updates['title'] = text(body.title, 'title', 200);
  if ('description' in body) updates['description'] = text(body.description, 'description', 1000);
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') throw new BadRequestException('isActive must be a boolean');
    updates['isActive'] = body.isActive;
  }
  if ('tags' in body) {
    if (!Array.isArray(body.tags) || body.tags.length > 30) throw new BadRequestException('tags must be an array of at most 30 items');
    updates['tags'] = body.tags.map((t: unknown) => text(t, 'tag', 50));
  }
  if ('campaign' in body) updates['campaign'] = sanitizeCampaign(body.campaign);
  if ('expiration' in body) updates['expiration'] = sanitizeExpiration(body.expiration);
  if ('customAlias' in body) {
    const a = body.customAlias;
    if (a === null || a === '') updates['customAlias'] = null;
    else {
      const alias = text(a, 'customAlias', 64);
      if (!ALIAS_RE.test(alias)) throw new BadRequestException('customAlias may only contain letters, numbers, - and _');
      if (isReservedWord(alias)) throw new BadRequestException(`The alias "${alias}" is reserved for system use.`);
      updates['customAlias'] = alias;
    }
  }
  if ('passwordProtected' in body) {
    if (typeof body.passwordProtected !== 'boolean') throw new BadRequestException('passwordProtected must be a boolean');
    updates['passwordProtected'] = body.passwordProtected;
    if (!body.passwordProtected) newPassword = null;
  }
  if (body.password != null && body.password !== '' && body.passwordProtected !== false) {
    const pw = text(body.password, 'password', 128);
    if (pw.length < 4) throw new BadRequestException('password must be at least 4 characters');
    newPassword = pw;
  }
  return { updates, newPassword };
}

/** Applies password hashing (random per-link salt) to a sanitized update. */
export function applyPassword(updates: Record<string, unknown>, newPassword: string | null | undefined) {
  if (newPassword === null) {
    updates['password'] = null;
    updates['passwordSalt'] = null;
  } else if (typeof newPassword === 'string') {
    const salt = crypto.randomUUID();
    updates['password'] = hashPassword(newPassword, salt);
    updates['passwordSalt'] = salt;
  }
}

export interface SanitizedLinkCreate {
  originalUrl: string;
  workspaceId?: string;
  customAlias?: string;
  tags: string[];
  passwordProtected: boolean;
  password?: string;
  expiration: ReturnType<typeof sanitizeExpiration> | null;
  campaign: Record<string, string | null> | null;
}

/** Validates the body of POST /api/shorten-url. Throws BadRequestException with a user-facing message. */
export function sanitizeLinkCreate(body: any): SanitizedLinkCreate {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid body');

  const originalUrl = typeof body.originalUrl === 'string' ? body.originalUrl.trim() : '';
  let parsed: URL | null = null;
  try { parsed = new URL(originalUrl); } catch { /* handled below */ }
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    throw new BadRequestException('Please enter a valid URL starting with http:// or https://');
  }
  if (originalUrl.length > 2048) throw new BadRequestException('URL must be at most 2048 characters');

  let workspaceId: string | undefined;
  if (body.workspaceId != null && body.workspaceId !== '') {
    workspaceId = text(body.workspaceId, 'workspaceId', 128);
  }

  let customAlias: string | undefined;
  if (body.customAlias != null && body.customAlias !== '') {
    const alias = text(body.customAlias, 'customAlias', 64);
    if (!ALIAS_RE.test(alias)) throw new BadRequestException('customAlias may only contain letters, numbers, - and _');
    if (isReservedWord(alias)) throw new BadRequestException(`The alias "${alias}" is reserved for system use.`);
    customAlias = alias;
  }

  let tags: string[] = [];
  if (body.tags != null) {
    if (!Array.isArray(body.tags) || body.tags.length > 30) throw new BadRequestException('tags must be an array of at most 30 items');
    tags = body.tags.map((t: unknown) => text(t, 'tag', 50));
  }

  const passwordProtected = body.passwordProtected === true;
  let password: string | undefined;
  if (passwordProtected && body.password != null && body.password !== '') {
    password = text(body.password, 'password', 128);
    if (password.length < 4) throw new BadRequestException('password must be at least 4 characters');
  }

  return {
    originalUrl,
    workspaceId,
    customAlias,
    tags,
    passwordProtected,
    password,
    expiration: body.expiration ? sanitizeExpiration(body.expiration) : null,
    campaign: sanitizeCampaign(body.campaign),
  };
}
