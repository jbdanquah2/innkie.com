import { describe, expect, it } from 'vitest';
import { cleanToken, describeDuration, expiryStatus, isEpochSeconds, parseJwt, signHs256, verifyHmac } from '@/lib/jwt';

// The well-known example token from jwt.io, signed with the secret "your-256-bit-secret".
const JWT_IO = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('cleanToken', () => {
  it('strips Bearer prefixes, header names, quotes and line breaks', () => {
    expect(cleanToken(`  Bearer ${JWT_IO}  `)).toBe(JWT_IO);
    expect(cleanToken(`Authorization: Bearer ${JWT_IO}`)).toBe(JWT_IO);
    expect(cleanToken(`"${JWT_IO}",`)).toBe(JWT_IO);
    expect(cleanToken(JWT_IO.replace(/\./g, '.\n'))).toBe(JWT_IO);
  });
});

describe('parseJwt', () => {
  it('decodes the jwt.io example', () => {
    const r = parseJwt(JWT_IO);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.alg).toBe('HS256');
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
  });
  it('keeps exact numbers and non-ASCII text in the payload', () => {
    const enc = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
    const t = `${enc('{"alg":"none"}')}.${enc('{"id":12345678901234567890,"name":"Zoë 日本"}')}.`;
    const r = parseJwt(t);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payloadText).toContain('12345678901234567890');
      expect(r.payloadText).toContain('Zoë 日本');
    }
  });
  it('explains specific failures', () => {
    const reason = (s: string) => { const r = parseJwt(s); return r.ok ? '' : r.reason; };
    expect(reason('abc.def')).toMatch(/three parts.*has 2/);
    expect(reason('a.b.c.d.e')).toMatch(/encrypted/);
    expect(reason('!!!.eyJhIjoxfQ.sig')).toMatch(/header is not valid Base64URL/);
    expect(reason(`${Buffer.from('not json').toString('base64url')}.eyJhIjoxfQ.sig`)).toMatch(/header decodes, but it is not valid JSON/);
    expect(reason(`${Buffer.from('[1]').toString('base64url')}.eyJhIjoxfQ.sig`)).toMatch(/header must be a JSON object/);
    expect(reason(`eyJhbGciOiJIUzI1NiJ9.${Buffer.from('oops').toString('base64url')}.sig`)).toMatch(/payload decodes, but it is not valid JSON/);
  });
});

describe('expiryStatus', () => {
  const now = 1_000_000;
  it('reports valid, expired and not-yet-valid with durations', () => {
    expect(expiryStatus({ exp: now + 7200 }, now)).toEqual({ kind: 'valid', detail: 'Expires in 2 hours.' });
    expect(expiryStatus({ exp: now - 90_000 }, now)).toEqual({ kind: 'expired', detail: 'Expired 1 day 1 hour ago.' });
    expect(expiryStatus({ nbf: now + 30, exp: now + 999 }, now)).toEqual({ kind: 'not-yet-valid', detail: 'Not valid for another 30 seconds.' });
  });
  it('treats exp of 0 as a real (past) expiry, and exp equal to now as expired', () => {
    expect(expiryStatus({ exp: 0 }, now).kind).toBe('expired');
    expect(expiryStatus({ exp: now }, now).kind).toBe('expired');
  });
  it('handles missing, unreadable and non-object payloads', () => {
    expect(expiryStatus({ sub: 'x' }, now).kind).toBe('no-expiry');
    expect(expiryStatus({ exp: 'tomorrow' }, now).kind).toBe('unreadable');
    expect(expiryStatus({ exp: now * 1000 * 1000 }, now).kind).toBe('unreadable'); // looks like milliseconds
    expect(expiryStatus('text', now).kind).toBe('no-expiry');
  });
});

describe('helpers', () => {
  it('describes durations', () => {
    expect(describeDuration(1)).toBe('1 second');
    expect(describeDuration(59)).toBe('59 seconds');
    expect(describeDuration(61)).toBe('1 minute');
    expect(describeDuration(3 * 3600 + 120)).toBe('3 hours 2 minutes');
    expect(describeDuration(5 * 86400)).toBe('5 days');
  });
  it('recognises epoch seconds', () => {
    expect(isEpochSeconds(1516239022)).toBe(true);
    expect(isEpochSeconds(0)).toBe(true);
    expect(isEpochSeconds(1516239022000)).toBe(false);
    expect(isEpochSeconds('1516239022')).toBe(false);
  });
});

describe('HMAC signature check', () => {
  it('verifies the jwt.io example with its secret, and rejects a wrong secret', async () => {
    const t = parseJwt(JWT_IO);
    if (!t.ok) throw new Error('should parse');
    expect(await verifyHmac(t, 'your-256-bit-secret')).toBe(true);
    expect(await verifyHmac(t, 'wrong-secret')).toBe(false);
  });
  it('round trips tokens it signs, and detects tampering', async () => {
    const token = await signHs256({ sub: 'u1', exp: 4102444800 }, 's3cret');
    const t = parseJwt(token);
    if (!t.ok) throw new Error('should parse');
    expect(await verifyHmac(t, 's3cret')).toBe(true);
    const [h, , s] = token.split('.');
    const forged = parseJwt(`${h}.${Buffer.from('{"sub":"admin","exp":4102444800}').toString('base64url')}.${s}`);
    if (!forged.ok) throw new Error('should parse');
    expect(await verifyHmac(forged, 's3cret')).toBe(false);
  });
  it('refuses algorithms that need a public key', async () => {
    const enc = (s: string) => Buffer.from(s).toString('base64url');
    const t = parseJwt(`${enc('{"alg":"RS256"}')}.${enc('{}')}.abc`);
    if (!t.ok) throw new Error('should parse');
    await expect(verifyHmac(t, 'x')).rejects.toThrow(/HS256/);
  });
});
