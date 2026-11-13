/**
 * Shortens an IP address so it can still hint at a network (useful for spotting repeat visitors) without identifying a
 * device: IPv4 keeps the first three numbers ("203.0.113.x"), IPv6 keeps the first three groups ("2001:db8:85a3:x").
 * Anything that is not recognisably an IP address becomes "hidden".
 */
export function maskIp(ip: unknown): string {
  if (typeof ip !== 'string') return 'hidden';
  const v = ip.trim();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(v); // IPv4 written in IPv6 form
  const v4 = mapped ? mapped[1] : v;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v4)) return v4.split('.').slice(0, 3).join('.') + '.x';
  if (v.includes(':') && /^[0-9a-f:]+$/i.test(v)) return v.split(':').filter(Boolean).slice(0, 3).join(':') + ':x';
  return 'hidden';
}
