import { ForbiddenException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';

const VISITORS = [{ id: '203.0.113.7_abc', ipAddress: '203.0.113.7', city: 'Accra', country: 'Ghana', visitCount: 4 }];

function setup(role: 'owner' | 'admin' | 'editor' | 'viewer' | null, workspaceId = 'ws1') {
  const rank = { owner: 4, admin: 3, editor: 2, viewer: 1 } as const;
  const workspaceService = { verifyAccess: jest.fn(async (_w: string, _u: string, req: (keyof typeof rank)[]) => !!role && req.some((r) => rank[role] >= rank[r])) };
  const analytics = { getLinkVisitors: jest.fn(async () => VISITORS.map((v) => ({ ...v }))) };
  const shorten = { getShortUrl: jest.fn(async () => ({ workspaceId, userId: 'creator' })) };
  const c = new AnalyticsController(analytics as any, workspaceService as any, shorten as any);
  return (uid = 'u1') => c.getLinkVisitors('abc', { user: { uid } });
}

describe('link visitors: IP addresses', () => {
  it('gives owners and admins the full address', async () => {
    for (const role of ['owner', 'admin'] as const) {
      const [v] = (await setup(role)()) as any[];
      expect(v.ipAddress).toBe('203.0.113.7');
      expect(v.id).toBe('203.0.113.7_abc');
    }
  });

  it('shortens the address, and drops the id that contains it, for editors and viewers', async () => {
    for (const role of ['editor', 'viewer'] as const) {
      const [v] = (await setup(role)()) as any[];
      expect(v.ipAddress).toBe('203.0.113.x');
      expect(v.id).toBeUndefined();
      expect(JSON.stringify(v)).not.toContain('203.0.113.7');
      expect(v.city).toBe('Accra'); // location and counts stay
    }
  });

  it('gives the owner of a personal workspace the full address', async () => {
    const [v] = (await setup(null, 'personal_u1')('u1')) as any[];
    expect(v.ipAddress).toBe('203.0.113.7');
  });

  it('still refuses people who are not members', async () => {
    await expect(setup(null)()).rejects.toBeInstanceOf(ForbiddenException);
  });
});
