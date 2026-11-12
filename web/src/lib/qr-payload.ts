/** Pure helpers that turn form fields into the text a QR code should hold, and a colour check. No browser APIs. */

export type QrKind = 'link' | 'text' | 'wifi' | 'email' | 'phone';

/** A scheme such as https:, mailto: or tel: at the start of the text. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/** Looks like a web address typed without a scheme: www.x.y, or host.tld with an optional path. */
const LOOKS_LIKE_DOMAIN = /^(www\.)?[^\s/:@]+\.[a-z]{2,}([/?#]\S*)?$/i;

/** Adds https:// to something that is clearly a web address but has no scheme. Everything else is left alone. */
export function normalizeLink(input: string): { value: string; added: boolean } {
  const v = input.trim();
  if (!v || HAS_SCHEME.test(v) || !LOOKS_LIKE_DOMAIN.test(v)) return { value: v, added: false };
  return { value: `https://${v}`, added: true };
}

/** Wi-Fi QR format: the characters \ ; , : and " are special and must be escaped with a backslash. */
export function escapeWifi(s: string): string {
  return s.replace(/([\\;,:"])/g, '\\$1');
}

export interface WifiFields {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export function wifiPayload(f: WifiFields): string {
  if (!f.ssid) return '';
  const parts = [`T:${f.security}`, `S:${escapeWifi(f.ssid)}`];
  if (f.security !== 'nopass' && f.password) parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailPayload(to: string, subject: string, body: string): string {
  const addr = to.trim();
  if (!EMAIL.test(addr)) return '';
  const params: string[] = [];
  if (subject.trim()) params.push(`subject=${encodeURIComponent(subject.trim())}`);
  if (body.trim()) params.push(`body=${encodeURIComponent(body.trim())}`);
  return `mailto:${addr}${params.length ? `?${params.join('&')}` : ''}`;
}

/** Keeps digits and one leading +, so "+1 (555) 123-4567" becomes tel:+15551234567. */
export function phonePayload(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 3) return '';
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type ScanWarning = 'inverted' | 'low-contrast' | null;

/**
 * Scanners expect dark modules on a light background. Inverted codes (light on dark) fail on some devices, and
 * a low contrast ratio fails on many. 'inverted' is reported first because it is the more specific problem.
 */
export function scanWarning(fg: string, bg: string): ScanWarning {
  if (luminance(fg) > luminance(bg)) return 'inverted';
  return contrastRatio(fg, bg) < 4 ? 'low-contrast' : null;
}
