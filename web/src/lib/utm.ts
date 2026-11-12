/** Building campaign URLs without disturbing the address they are added to. */

export type UtmKey = 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content';
export const UTM_KEYS: UtmKey[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export interface UtmValues { source: string; medium: string; campaign: string; term: string; content: string }

const KEY_OF: Record<keyof UtmValues, UtmKey> = {
  source: 'utm_source',
  medium: 'utm_medium',
  campaign: 'utm_campaign',
  term: 'utm_term',
  content: 'utm_content',
};

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const LOOKS_LIKE_HOST = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i;

export interface BaseUrl { url: string; addedScheme: boolean; existingUtm: UtmKey[] }

/**
 * The address to tag. A missing scheme gets https://, but only for something that looks like a web address, so a
 * host such as "httpbin.org" is not mistaken for a URL that already has one.
 */
export function normalizeBaseUrl(input: string): BaseUrl | { error: string } {
  const text = input.trim();
  if (!text) return { error: '' };
  let candidate = text;
  let addedScheme = false;
  if (HAS_SCHEME.test(text) && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*:\d+(?:[/?#]|$)/i.test(text)) {
    if (!/^https?:\/\//i.test(text)) return { error: 'Only http:// and https:// addresses can be tagged.' };
  } else if (LOOKS_LIKE_HOST.test(text) || /^localhost(?::\d+)?(?:[/?#]|$)/i.test(text)) {
    candidate = `https://${text}`;
    addedScheme = true;
  } else {
    return { error: 'Enter a full web address, such as https://example.com/page.' };
  }
  try {
    const u = new URL(candidate);
    if (!u.hostname) throw new Error('no host');
  } catch {
    return { error: 'That does not look like a valid web address.' };
  }
  const existing = UTM_KEYS.filter((k) => queryPairs(candidate).some((p) => p.key === k));
  return { url: candidate, addedScheme, existingUtm: existing };
}

function split(url: string): { base: string; query: string; hash: string } {
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const beforeHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const q = beforeHash.indexOf('?');
  return q >= 0 ? { base: beforeHash.slice(0, q), query: beforeHash.slice(q + 1), hash } : { base: beforeHash, query: '', hash };
}

function queryPairs(url: string): { key: string; raw: string }[] {
  const { query } = split(url);
  return query ? query.split('&').filter(Boolean).map((raw) => ({ key: safeDecode(raw.split('=')[0].replace(/\+/g, ' ')), raw })) : [];
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

/** How a value is cleaned up before it is used. Reports differ on "Email" and "email", so lowercase is the safe default. */
export function tidyValue(v: string, tidy: boolean): string {
  const t = v.trim();
  return tidy ? t.toLowerCase().replace(/\s+/g, '-') : t;
}

/**
 * Adds the campaign parameters to the end of the address's own query, ahead of any #fragment. Everything already in
 * the address stays exactly as it was written, except any utm_ parameter being replaced.
 */
export function buildUtmUrl(base: string, values: UtmValues): string {
  const { base: path, query, hash } = split(base);
  const setKeys = new Set(
    (Object.keys(KEY_OF) as (keyof UtmValues)[]).filter((k) => values[k] !== '').map((k) => KEY_OF[k] as string),
  );
  const kept = query ? query.split('&').filter(Boolean).filter((raw) => !setKeys.has(safeDecode(raw.split('=')[0].replace(/\+/g, ' ')))) : [];
  const added = (Object.keys(KEY_OF) as (keyof UtmValues)[])
    .filter((k) => values[k] !== '')
    .map((k) => `${KEY_OF[k]}=${encodeURIComponent(values[k])}`);
  return `${path}?${[...kept, ...added].join('&')}${hash}`;
}

export interface UtmTip { id: string; message: string }

/** Gentle warnings about the values as typed, before they are tidied. */
export function utmTips(values: UtmValues): UtmTip[] {
  const tips: UtmTip[] = [];
  const all = Object.values(values).filter(Boolean);
  if (all.some((v) => /[A-Z]/.test(v))) tips.push({ id: 'case', message: 'Values are case-sensitive in reports, so "Email" and "email" count as different mediums. Lowercase is safest.' });
  if (all.some((v) => /\s/.test(v.trim()))) tips.push({ id: 'space', message: 'Spaces are written as %20 in the link. A hyphen reads better, such as spring-sale.' });
  if (all.some((v) => /@/.test(v))) tips.push({ id: 'pii', message: 'Anyone can read these values in the link. Do not put email addresses or other personal data in them.' });
  return tips;
}

export function missingFields(values: UtmValues): string[] {
  const out: string[] = [];
  if (!values.source) out.push('source');
  if (!values.medium) out.push('medium');
  if (!values.campaign) out.push('campaign name');
  return out;
}

/** The parameters in the built link, for showing as a table. */
export function readUtm(url: string): { key: string; value: string }[] {
  return queryPairs(url)
    .filter((p) => (UTM_KEYS as string[]).includes(p.key))
    .map((p) => ({ key: p.key, value: safeDecode((p.raw.split('=')[1] ?? '').replace(/\+/g, ' ')) }));
}

export interface UtmPreset { id: string; label: string; source: string; medium: string }
export const PRESETS: UtmPreset[] = [
  { id: 'newsletter', label: 'Email newsletter', source: 'newsletter', medium: 'email' },
  { id: 'facebook', label: 'Facebook post', source: 'facebook', medium: 'social' },
  { id: 'linkedin', label: 'LinkedIn post', source: 'linkedin', medium: 'social' },
  { id: 'instagram', label: 'Instagram bio', source: 'instagram', medium: 'social' },
  { id: 'google-ads', label: 'Google Ads', source: 'google', medium: 'cpc' },
  { id: 'qr', label: 'QR code', source: 'qr-code', medium: 'print' },
];
