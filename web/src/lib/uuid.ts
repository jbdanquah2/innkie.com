/** UUID generation and inspection using the browser's cryptographic random generator. */

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const format = (b: Uint8Array) => {
  const h = hex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

/** Version 4: 122 random bits. */
export function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = random(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(b);
}

/**
 * Version 7 (RFC 9562): a 48-bit Unix timestamp in milliseconds followed by random bits, so values created later
 * sort later. `generateV7Batch` keeps a counter in the 12 bits after the version, so values made in the same
 * millisecond still come out in increasing order.
 */
export function uuidV7(timestampMs: number, counter: number, tail: Uint8Array): string {
  const b = new Uint8Array(16);
  // 48-bit timestamp, big endian (split because JS bit operations are 32-bit)
  const hi = Math.floor(timestampMs / 2 ** 32);
  const lo = timestampMs >>> 0;
  b[0] = (hi >>> 8) & 0xff; b[1] = hi & 0xff;
  b[2] = (lo >>> 24) & 0xff; b[3] = (lo >>> 16) & 0xff; b[4] = (lo >>> 8) & 0xff; b[5] = lo & 0xff;
  b[6] = 0x70 | ((counter >>> 8) & 0x0f); // version 7 + top 4 bits of the 12-bit counter
  b[7] = counter & 0xff;
  b.set(tail.subarray(0, 8), 8);
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return format(b);
}

export function generateV7Batch(count: number, now: () => number = Date.now): string[] {
  const out: string[] = [];
  let lastMs = -1;
  let counter = 0;
  for (let i = 0; i < count; i++) {
    let ms = now();
    if (ms <= lastMs) {
      counter++;
      ms = lastMs;
      if (counter > 0xfff) { ms = lastMs + 1; counter = 0; } // 4096 in one millisecond: move to the next one
    } else {
      counter = random(2).reduce((a, x) => (a << 8) | x, 0) & 0x3ff; // start low so a batch has room to count up
    }
    lastMs = ms;
    out.push(uuidV7(ms, counter, random(8)));
  }
  return out;
}

export type UuidFormat = 'lines' | 'commas' | 'json';
export interface UuidStyle { upper: boolean; hyphens: boolean; braces: boolean }

export function styleUuid(u: string, s: UuidStyle): string {
  let v = s.hyphens ? u : u.replace(/-/g, '');
  if (s.upper) v = v.toUpperCase();
  return s.braces ? `{${v}}` : v;
}

export function joinUuids(list: string[], format: UuidFormat): string {
  if (format === 'json') return JSON.stringify(list, null, 2);
  return list.join(format === 'commas' ? ', ' : '\n');
}

export interface UuidInfo {
  valid: boolean;
  version?: number;
  variant?: 'RFC 9562 (standard)' | 'NCS (reserved)' | 'Microsoft (reserved)' | 'Reserved';
  /** Creation time, for versions 1 and 7, which contain one. */
  time?: Date;
  nil?: boolean;
  max?: boolean;
}

const UUID_RE = /^\{?([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})\}?$/i;

export function inspectUuid(input: string): UuidInfo {
  const m = UUID_RE.exec(input.trim());
  if (!m) return { valid: false };
  const hexStr = m.slice(1).join('').toLowerCase();
  if (/^0{32}$/.test(hexStr)) return { valid: true, nil: true };
  if (/^f{32}$/.test(hexStr)) return { valid: true, max: true };
  const version = parseInt(hexStr[12], 16);
  const v = parseInt(hexStr[16], 16);
  const variant = v < 8 ? 'NCS (reserved)' : v < 12 ? 'RFC 9562 (standard)' : v < 14 ? 'Microsoft (reserved)' : 'Reserved';
  const info: UuidInfo = { valid: true, version, variant };
  if (variant === 'RFC 9562 (standard)' && version === 7) {
    info.time = new Date(parseInt(hexStr.slice(0, 12), 16));
  } else if (variant === 'RFC 9562 (standard)' && version === 1) {
    const timeHex = hexStr.slice(13, 16) + hexStr.slice(8, 12) + hexStr.slice(0, 8);
    const ms = Number(BigInt('0x' + timeHex) / 10000n) - 12219292800000; // 100 ns ticks since 1582-10-15, to Unix ms
    info.time = new Date(ms);
  }
  return info;
}
