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

function text(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string') throw new BadRequestException(`${field} must be a string`);
  if (v.length > max) throw new BadRequestException(`${field} must be at most ${max} characters`);
  return v;
}

function positiveInt(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 1_000_000) {
    throw new BadRequestException(`${field} must be a whole number between 1 and 1000000`);
  }
  return v;
}

function sanitizeExpiration(v: any) {
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
  if ('campaign' in body) {
    const c = body.campaign;
    if (c !== null && (typeof c !== 'object' || Array.isArray(c))) throw new BadRequestException('campaign is invalid');
    const out: Record<string, string | null> = {};
    for (const k of UTM_KEYS) {
      if (c && c[k] != null && c[k] !== '') out[k] = text(c[k], k, 200);
      else if (c && k in c) out[k] = null;
    }
    updates['campaign'] = c === null ? null : out;
  }
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
