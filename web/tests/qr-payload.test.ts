import { describe, expect, it } from 'vitest';
import { contrastRatio, emailPayload, escapeVcard, escapeWifi, normalizeLink, phonePayload, scanWarning, wifiPayload } from '@/lib/qr-payload';

describe('normalizeLink', () => {
  it('adds https:// to a bare web address', () => {
    expect(normalizeLink('example.com')).toEqual({ value: 'https://example.com', added: true });
    expect(normalizeLink('www.example.com/a?b=1')).toEqual({ value: 'https://www.example.com/a?b=1', added: true });
    expect(normalizeLink('  sub.example.co.uk/path  ').value).toBe('https://sub.example.co.uk/path');
  });
  it('leaves anything that already has a scheme, and plain text, alone', () => {
    for (const v of ['https://x.y', 'http://x.y', 'mailto:a@b.co', 'tel:+123', 'ftp://x.y', 'hello world', 'just text', '']) {
      expect(normalizeLink(v)).toEqual({ value: v.trim(), added: false });
    }
  });
});

describe('wifiPayload', () => {
  it('builds the standard WPA string', () => {
    expect(wifiPayload({ ssid: 'Home', password: 'secret123', security: 'WPA', hidden: false })).toBe('WIFI:T:WPA;S:Home;P:secret123;;');
  });
  it('escapes the special characters backslash, semicolon, comma, colon and quote', () => {
    expect(escapeWifi(String.raw`a;b,c:d"e\f`)).toBe(String.raw`a\;b\,c\:d\"e\\f`);
    expect(wifiPayload({ ssid: 'My;Net', password: 'p:w,d', security: 'WPA', hidden: false })).toBe(String.raw`WIFI:T:WPA;S:My\;Net;P:p\:w\,d;;`);
  });
  it('omits the password for open networks and marks hidden ones', () => {
    expect(wifiPayload({ ssid: 'Cafe', password: 'ignored', security: 'nopass', hidden: false })).toBe('WIFI:T:nopass;S:Cafe;;');
    expect(wifiPayload({ ssid: 'Cafe', password: 'x', security: 'WEP', hidden: true })).toBe('WIFI:T:WEP;S:Cafe;P:x;H:true;;');
  });
  it('needs a network name', () => {
    expect(wifiPayload({ ssid: '', password: 'x', security: 'WPA', hidden: false })).toBe('');
  });
});

describe('emailPayload', () => {
  it('builds mailto links with encoded subject and body', () => {
    expect(emailPayload('a@b.co', '', '')).toBe('mailto:a@b.co');
    expect(emailPayload('a@b.co', 'Hello there', 'Line 1 & 2')).toBe('mailto:a@b.co?subject=Hello%20there&body=Line%201%20%26%202');
  });
  it('rejects invalid addresses', () => {
    for (const v of ['', 'nope', 'a@b', 'a b@c.de']) expect(emailPayload(v, '', '')).toBe('');
  });
});

describe('phonePayload', () => {
  it('keeps digits and a leading plus only', () => {
    expect(phonePayload('+1 (555) 123-4567')).toBe('tel:+15551234567');
    expect(phonePayload('020 7946 0958')).toBe('tel:02079460958');
  });
  it('rejects too-short input', () => {
    expect(phonePayload('')).toBe('');
    expect(phonePayload('12')).toBe('');
  });
});

describe('contrast and scan warnings', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  });
  it('accepts dark on light', () => {
    expect(scanWarning('#000000', '#ffffff')).toBeNull();
    expect(scanWarning('#4f46e5', '#ffffff')).toBeNull();
  });
  it('flags inverted and low-contrast codes', () => {
    expect(scanWarning('#ffffff', '#000000')).toBe('inverted');
    expect(scanWarning('#bbbbbb', '#ffffff')).toBe('low-contrast');
  });
});

describe('escapeVcard', () => {
  it('escapes the characters that break a vCard', () => {
    expect(escapeVcard('Smith; John')).toBe('Smith\\; John');
    expect(escapeVcard('a,b')).toBe('a\\,b');
    expect(escapeVcard('x\\y')).toBe('x\\\\y');
    expect(escapeVcard('line1\r\nline2')).toBe('line1\\nline2');
    expect(escapeVcard('plain text')).toBe('plain text');
  });
});
