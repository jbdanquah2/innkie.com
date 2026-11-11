import { BadRequestException } from '@nestjs/common';
import { text } from './link-update.util';

export const ASSIGNABLE_ROLES = ['admin', 'editor', 'viewer'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
export const WEBHOOK_EVENTS = ['link.created', 'link.clicked', 'link.deleted'] as const;

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export function requireName(v: unknown, field = 'name', max = 100): string {
  const s = text(v, field, max).trim();
  if (!s) throw new BadRequestException(`${field} is required`);
  return s;
}

/** Roles that may be handed out through the members API. `owner` is never assignable here. */
export function assignableRole(v: unknown): AssignableRole {
  if (typeof v !== 'string' || !(ASSIGNABLE_ROLES as readonly string[]).includes(v)) {
    throw new BadRequestException(`role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`);
  }
  return v as AssignableRole;
}

export function requireEmail(v: unknown): string {
  const s = text(v, 'email', 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new BadRequestException('A valid email is required');
  return s;
}

function optionalHttpUrl(v: unknown, field: string): string | null {
  if (v == null || v === '') return null;
  const s = text(v, field, 2048);
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
  } catch { throw new BadRequestException(`${field} must be an http(s) URL`); }
  return s;
}

/** Workspace PUT allow-list: name and branding only. Membership, owner, plan and API key are never client-editable. */
export function sanitizeWorkspaceUpdate(body: any): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid body');
  const out: Record<string, unknown> = {};
  if ('name' in body) out['name'] = requireName(body.name);
  if ('branding' in body) {
    const b = body.branding;
    if (b === null || typeof b !== 'object' || Array.isArray(b)) throw new BadRequestException('branding is invalid');
    const branding: Record<string, string | null> = {};
    if ('brandName' in b) branding['brandName'] = b.brandName ? text(b.brandName, 'brandName', 100) : null;
    if ('brandColor' in b) {
      if (b.brandColor && !HEX_COLOR.test(String(b.brandColor))) throw new BadRequestException('brandColor must be a hex colour');
      branding['brandColor'] = b.brandColor || null;
    }
    if ('logoUrl' in b) branding['logoUrl'] = optionalHttpUrl(b.logoUrl, 'logoUrl');
    if ('websiteUrl' in b) branding['websiteUrl'] = optionalHttpUrl(b.websiteUrl, 'websiteUrl');
    out['branding'] = branding;
  }
  return out;
}

export function sanitizeWebhookInput(body: any) {
  if (!body || typeof body !== 'object') throw new BadRequestException('Invalid body');
  const workspaceId = text(body.workspaceId, 'workspaceId', 128);
  const name = requireName(body.name);
  const url = text(body.url, 'url', 2048);
  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > WEBHOOK_EVENTS.length) {
    throw new BadRequestException('events must be a non-empty list');
  }
  const events = [...new Set(body.events as unknown[])].map((e) => {
    if (typeof e !== 'string' || !(WEBHOOK_EVENTS as readonly string[]).includes(e)) {
      throw new BadRequestException(`Unknown webhook event. Allowed: ${WEBHOOK_EVENTS.join(', ')}`);
    }
    return e;
  });
  return { workspaceId, name, url, events };
}

const MAX_QR_CONFIG_BYTES = 500_000; // Firestore documents are limited to 1 MiB

export function sanitizeQrTemplate(body: any, requireWorkspace: boolean) {
  if (!body || typeof body !== 'object') throw new BadRequestException('Invalid body');
  const name = requireName(body.name);
  const config = body.config;
  if (config === null || typeof config !== 'object' || Array.isArray(config)) throw new BadRequestException('config must be an object');
  if (Buffer.byteLength(JSON.stringify(config)) > MAX_QR_CONFIG_BYTES) throw new BadRequestException('config is too large');
  const workspaceId = body.workspaceId == null || body.workspaceId === '' ? undefined : text(body.workspaceId, 'workspaceId', 128);
  if (requireWorkspace && workspaceId === undefined) { /* personal templates are allowed without a workspace */ }
  return { name, config, workspaceId };
}
