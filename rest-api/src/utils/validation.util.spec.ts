import { sanitizeLinkCreate, sanitizeLinkUpdate } from './link-update.util';
import { assignableRole, requireEmail, sanitizeQrTemplate, sanitizeWebhookInput, sanitizeWorkspaceUpdate } from './validation.util';

describe('sanitizeLinkCreate', () => {
  const ok = { originalUrl: 'https://example.com/a?b=1', workspaceId: 'personal_u1', customAlias: '', tags: [], campaign: null };
  it('accepts the web client payload', () => {
    const r = sanitizeLinkCreate({ ...ok, passwordProtected: true, password: 'secret', expiration: { mode: 'duration', durationValue: 2, durationUnit: 'days' } });
    expect(r.originalUrl).toBe('https://example.com/a?b=1');
    expect(r.customAlias).toBeUndefined();
    expect(r.expiration).toEqual({ mode: 'duration', durationValue: 2, durationUnit: 'days' });
  });
  const bad: Array<[string, any]> = [
    ['javascript url', { originalUrl: 'javascript:alert(1)' }],
    ['ftp url', { originalUrl: 'ftp://x.y/z' }],
    ['not a url', { originalUrl: 'hello' }],
    ['missing url', {}],
    ['url too long', { originalUrl: 'https://x.y/' + 'a'.repeat(3000) }],
    ['bad alias chars', { ...ok, customAlias: 'a b!' }],
    ['reserved alias', { ...ok, customAlias: 'guides' }],
    ['tags not array', { ...ok, tags: 'x' }],
    ['too many tags', { ...ok, tags: Array(31).fill('t') }],
    ['short password', { ...ok, passwordProtected: true, password: 'abc' }],
    ['bad expiration', { ...ok, expiration: { mode: 'forever' } }],
    ['campaign not object', { ...ok, campaign: 'x' }],
  ];
  for (const [name, body] of bad) {
    it(`rejects ${name}`, () => {
      expect(() => sanitizeLinkCreate(body)).toThrow();
    });
  }
});

describe('workspace validation', () => {
  it('only name and branding survive a workspace update', () => {
    const r = sanitizeWorkspaceUpdate({ name: ' Team ', ownerId: 'me', memberUids: ['me'], members: [], plan: 'enterprise', apiKey: 'k', branding: { brandColor: '#aabbcc', brandName: 'X', extra: 1 } });
    expect(r).toEqual({ name: 'Team', branding: { brandColor: '#aabbcc', brandName: 'X' } });
  });
  it('rejects bad branding values', () => {
    expect(() => sanitizeWorkspaceUpdate({ branding: { brandColor: 'red; background:url(x)' } })).toThrow();
    expect(() => sanitizeWorkspaceUpdate({ branding: { logoUrl: 'javascript:alert(1)' } })).toThrow();
    expect(() => sanitizeWorkspaceUpdate({ name: '   ' })).toThrow();
  });
  it('never allows handing out owner', () => {
    expect(assignableRole('editor')).toBe('editor');
    expect(() => assignableRole('owner')).toThrow();
    expect(() => assignableRole('root')).toThrow();
    expect(() => assignableRole(undefined)).toThrow();
  });
  it('validates emails', () => {
    expect(requireEmail(' A@B.co ')).toBe('a@b.co');
    expect(() => requireEmail('nope')).toThrow();
  });
});

describe('webhook and QR validation', () => {
  it('accepts known events only', () => {
    expect(sanitizeWebhookInput({ workspaceId: 'w', name: 'n', url: 'https://x.y/h', events: ['link.created', 'link.created'] }).events).toEqual(['link.created']);
    expect(() => sanitizeWebhookInput({ workspaceId: 'w', name: 'n', url: 'https://x.y', events: ['link.exploded'] })).toThrow();
    expect(() => sanitizeWebhookInput({ workspaceId: 'w', name: 'n', url: 'https://x.y', events: [] })).toThrow();
  });
  it('bounds QR template payloads', () => {
    expect(sanitizeQrTemplate({ name: 'a', config: { x: 1 } }, false).name).toBe('a');
    expect(() => sanitizeQrTemplate({ name: 'a', config: 'str' }, false)).toThrow();
    expect(() => sanitizeQrTemplate({ name: 'a', config: { blob: 'x'.repeat(600_000) } }, false)).toThrow();
  });
});


describe('sanitizeLinkUpdate: qrConfig (saved QR design)', () => {
  it('accepts a design object, and null to clear it', () => {
    const cfg = { dotsOptions: { type: 'rounded', color: '#4f46e5' }, backgroundOptions: { color: '#ffffff' } };
    expect(sanitizeLinkUpdate({ qrConfig: cfg }).updates['qrConfig']).toEqual(cfg);
    expect(sanitizeLinkUpdate({ qrConfig: null }).updates['qrConfig']).toBeNull();
  });
  for (const [name, v] of [['a string', 'x'], ['an array', [1]], ['a number', 5]] as Array<[string, any]>) {
    it(`rejects ${name}`, () => {
      expect(() => sanitizeLinkUpdate({ qrConfig: v })).toThrow();
    });
  }
  it('rejects a design that is too large for a Firestore document', () => {
    expect(() => sanitizeLinkUpdate({ qrConfig: { logoSrc: 'x'.repeat(600_000) } })).toThrow();
  });
  it('still ignores fields that are not editable', () => {
    expect(Object.keys(sanitizeLinkUpdate({ qrConfig: {}, clickCount: 5, userId: 'x', originalUrl: 'https://evil.example' }).updates)).toEqual(['qrConfig']);
  });
});
