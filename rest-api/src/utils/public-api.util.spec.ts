import { linkBelongsToWorkspace, parseCursor, parseDays, parsePageSize, publicCreateBody, toPublicLink, API_KEY_FORMAT } from './public-api.util';

describe('toPublicLink', () => {
  const doc = {
    id: 'abc', shortCode: 'abc', originalUrl: 'https://x.y/z', userId: 'secret-uid', workspaceId: 'w1',
    password: 'HASH', passwordSalt: 'SALT', passwordProtected: true, clickCount: 3, tags: ['a'],
    createdAt: { toDate: () => new Date('2026-01-02T03:04:05Z') },
    expiration: { mode: 'date', expiryDate: { toDate: () => new Date('2027-01-01T00:00:00Z') } },
  };
  it('never exposes hashes, salts or the owner uid', () => {
    const out = toPublicLink(doc, 'https://innkie.com/');
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/HASH|SALT|secret-uid|userId|workspaceId|password"/);
    expect(out.shortUrl).toBe('https://innkie.com/abc');
    expect(out.passwordProtected).toBe(true);
    expect(out.createdAt).toBe('2026-01-02T03:04:05.000Z');
    expect(out.expiration).toEqual({ mode: 'date', expiryDate: '2027-01-01T00:00:00.000Z' });
  });
});

describe('linkBelongsToWorkspace', () => {
  it('matches team workspaces strictly by id', () => {
    expect(linkBelongsToWorkspace({ workspaceId: 'w1' }, { id: 'w1' })).toBe(true);
    expect(linkBelongsToWorkspace({ workspaceId: 'w2' }, { id: 'w1' })).toBe(false);
    expect(linkBelongsToWorkspace({ workspaceId: null, userId: 'u1' }, { id: 'w1', ownerId: 'u1' })).toBe(false);
  });
  it('matches personal workspaces by owner, including legacy links', () => {
    const ws = { id: 'personal_u1', ownerId: 'u1' };
    expect(linkBelongsToWorkspace({ workspaceId: 'personal_u1', userId: 'u1' }, ws)).toBe(true);
    expect(linkBelongsToWorkspace({ workspaceId: 'personal', userId: 'u1' }, ws)).toBe(true);
    expect(linkBelongsToWorkspace({ workspaceId: undefined, userId: 'u1' }, ws)).toBe(true);
    expect(linkBelongsToWorkspace({ workspaceId: 'personal_u1', userId: 'u2' }, ws)).toBe(false);
    expect(linkBelongsToWorkspace({ workspaceId: 'personal_u2', userId: 'u1' }, ws)).toBe(false);
  });
  it('rejects missing data', () => {
    expect(linkBelongsToWorkspace(null, { id: 'w1' })).toBe(false);
    expect(linkBelongsToWorkspace({ workspaceId: 'w1' }, { id: '' })).toBe(false);
  });
});

describe('query parsing', () => {
  it('bounds page size, days and cursor', () => {
    expect(parsePageSize(undefined)).toBe(25);
    expect(parsePageSize('100')).toBe(100);
    for (const v of ['0', '101', 'abc', '1.5']) expect(() => parsePageSize(v)).toThrow();
    expect(parseDays(undefined)).toBe(7);
    expect(parseDays('30')).toBe(30);
    for (const v of ['0', '31', '-1', 'x']) expect(() => parseDays(v)).toThrow();
    expect(parseCursor('abc_12-X')).toBe('abc_12-X');
    for (const v of ['a/b', 'x'.repeat(65), '../x', ['a']]) expect(() => parseCursor(v as any)).toThrow();
  });
});

describe('publicCreateBody', () => {
  it('maps url and drops any client workspaceId', () => {
    expect(publicCreateBody({ url: 'https://a.b', workspaceId: 'someone-else', tags: ['x'] })).toEqual({ originalUrl: 'https://a.b', tags: ['x'] });
  });
  it('rejects non-object bodies', () => {
    expect(() => publicCreateBody(null)).toThrow();
    expect(() => publicCreateBody([])).toThrow();
  });
});

describe('API key format', () => {
  it('accepts generated keys and rejects junk before any database read', () => {
    expect(API_KEY_FORMAT.test('ik_' + 'a'.repeat(48))).toBe(true);
    for (const k of ['', 'ik_short', 'sk_' + 'a'.repeat(48), 'ik_' + 'g'.repeat(48)]) expect(API_KEY_FORMAT.test(k)).toBe(false);
  });
});
