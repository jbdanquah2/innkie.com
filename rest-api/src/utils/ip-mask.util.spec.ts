import { maskIp } from './ip-mask.util';

describe('maskIp', () => {
  it('keeps the first three numbers of an IPv4 address', () => expect(maskIp('203.0.113.7')).toBe('203.0.113.x'));
  it('treats IPv4-mapped IPv6 like IPv4', () => expect(maskIp('::ffff:198.51.100.22')).toBe('198.51.100.x'));
  it('keeps the first three groups of an IPv6 address', () => expect(maskIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:x'));
  it('hides anything that is not an IP', () => {
    expect(maskIp('not-an-ip')).toBe('hidden');
    expect(maskIp(undefined)).toBe('hidden');
    expect(maskIp('')).toBe('hidden');
  });
});
