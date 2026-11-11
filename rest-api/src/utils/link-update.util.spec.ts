import { applyPassword, sanitizeLinkUpdate } from './link-update.util';
import { hashPassword } from './url.utils';

describe('sanitizeLinkUpdate', () => {
  it('drops fields clients must not set', () => {
    const { updates } = sanitizeLinkUpdate({ title: 'a', userId: 'x', clickCount: 99, workspaceId: 'w', passwordSalt: 's', originalUrl: 'http://evil' });
    expect(updates).toEqual({ title: 'a' });
  });
  it('rejects bad types and reserved aliases', () => {
    expect(() => sanitizeLinkUpdate({ isActive: 'yes' })).toThrow();
    expect(() => sanitizeLinkUpdate({ customAlias: 'login' })).toThrow();
    expect(() => sanitizeLinkUpdate({ customAlias: 'a b' })).toThrow();
    expect(() => sanitizeLinkUpdate({ expiration: { mode: 'oneTime', maxClicks: -1 } })).toThrow();
    expect(() => sanitizeLinkUpdate([])).toThrow();
  });
  it('accepts the editor payload', () => {
    const { updates } = sanitizeLinkUpdate({
      title: 't', customAlias: 'my-link', description: '', isActive: true, tags: ['a'],
      campaign: { utmSource: 'x', utmMedium: null, utmCampaign: null },
      expiration: { mode: 'duration', durationValue: 3, durationUnit: 'days' }, passwordProtected: false,
    });
    expect(updates['customAlias']).toBe('my-link');
  });
  it('hashes a plain password with a fresh salt, clears on unprotect', () => {
    const r = sanitizeLinkUpdate({ passwordProtected: true, password: 'secret1' });
    expect(r.newPassword).toBe('secret1');
    applyPassword(r.updates, r.newPassword);
    expect(r.updates['password']).toBe(hashPassword('secret1', r.updates['passwordSalt'] as string));
    const off = sanitizeLinkUpdate({ passwordProtected: false, password: 'ignored' });
    applyPassword(off.updates, off.newPassword);
    expect(off.updates['password']).toBeNull();
  });
});
