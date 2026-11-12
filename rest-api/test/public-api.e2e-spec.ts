import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FirebaseService } from '../src/services/firebase.service';
import { LongUrlPreviewService } from '../src/services/long-url-preview.service';
import { WebhookDispatcherService } from '../src/services/webhook-dispatcher.service';
import { AnalyticsService } from '../src/services/analytics.service';
import { hashApiKey } from '../src/utils/secrets.util';

/** Minimal in-memory Firestore: just the calls the link code makes. */
class FakeDb {
  docs = new Map<string, any>();
  doc(path: string) {
    const self = this;
    return {
      id: path.split('/').pop()!,
      async get() { const d = self.docs.get(path); return { id: path.split('/').pop()!, exists: d !== undefined, data: () => d }; },
      async set(data: any, opts?: any) { self.docs.set(path, opts?.merge ? { ...(self.docs.get(path) ?? {}), ...data } : data); },
      async update(data: any) {
        const next = { ...(self.docs.get(path) ?? {}) };
        for (const [k, v] of Object.entries(data)) {
          if ((v as any)?.constructor?.name === 'DeleteTransform') delete next[k]; else next[k] = v;
        }
        self.docs.set(path, next);
      },
      async delete() { self.docs.delete(path); },
    };
  }
  collection(name: string) { return new FakeQuery(this, name); }
  batch() {
    const ops: Array<() => Promise<void>> = [];
    const batch = {
      set: (ref: any, data: any) => { ops.push(() => ref.set(data)); return batch; },
      update: (ref: any, data: any) => { ops.push(() => ref.update(data)); return batch; },
      delete: (ref: any) => { ops.push(() => ref.delete()); return batch; },
      commit: async () => { for (const op of ops) await op(); },
    };
    return batch;
  }
}
const ms = (v: any) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v);
class FakeQuery {
  private filters: Array<(d: any) => boolean> = [];
  private order?: { field: string; dir: string };
  private after?: any;
  private max = Infinity;
  constructor(private db: FakeDb, private name: string) {}
  where(field: string, op: string, value: any) {
    this.filters.push((d) => {
      const v = d[field] === undefined ? null : d[field];
      if (op === '==') return v === value;
      if (op === 'in') return (value as any[]).includes(v);
      if (op === 'array-contains') return Array.isArray(d[field]) && d[field].includes(value);
      return true;
    });
    return this;
  }
  orderBy(field: string, dir = 'asc') { this.order = { field, dir }; return this; }
  startAfter(snap: any) { this.after = snap.data(); return this; }
  limit(n: number) { this.max = n; return this; }
  async get() {
    let rows = [...this.db.docs.entries()]
      .filter(([p]) => p.startsWith(`${this.name}/`) && p.split('/').length === 2)
      .map(([p, d]) => ({ id: p.split('/')[1], d }))
      .filter((r) => this.filters.every((f) => f(r.d)));
    if (this.order) {
      const { field, dir } = this.order;
      rows.sort((a, b) => (ms(a.d[field]) - ms(b.d[field])) * (dir === 'desc' ? -1 : 1));
    }
    if (this.after && this.order) {
      const idx = rows.findIndex((r) => r.d === this.after);
      rows = rows.slice(idx + 1);
    }
    rows = rows.slice(0, this.max);
    return { empty: rows.length === 0, docs: rows.map((r) => ({ id: r.id, data: () => r.d })) };
  }
}

const KEY1 = 'ik_' + '1'.repeat(48);
const KEY2 = 'ik_' + '2'.repeat(48);
const KEY3 = 'ik_' + '3'.repeat(48);

describe('Public API (e2e, in-memory database)', () => {
  let app: INestApplication;
  let db: FakeDb;
  const dispatch = jest.fn();
  const http = () => request(app.getHttpServer());
  const link = (code: string, ws: string | null, user: string, ageMin: number, extra: any = {}) => {
    db.docs.set(`shortUrls/${code}`, {
      id: code, shortCode: code, originalUrl: `https://example.com/${code}`, workspaceId: ws, userId: user,
      createdAt: Timestamp.fromMillis(Date.now() - ageMin * 60000), isActive: true, clickCount: 0, tags: [],
      password: 'SECRET-HASH', passwordSalt: 'SECRET-SALT', ...extra,
    });
  };

  beforeAll(async () => {
    db = new FakeDb();
    const fakeFirebase = {
      db,
      getDocData: async (path: string) => db.docs.get(path) ?? null,
      auth: { verifyIdToken: async (t: string) => { if (!t.startsWith('user-')) throw new Error('bad'); return { uid: t.slice(5) }; } },
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FirebaseService).useValue(fakeFirebase)
      .overrideProvider(LongUrlPreviewService).useValue({ getPreview: async () => ({}) })
      .overrideProvider(WebhookDispatcherService).useValue({ dispatch })
      .overrideProvider(AnalyticsService).useValue({ getClicksOverTime: async () => [{ date: '2026-11-10', clicks: 2 }, { date: '2026-11-11', clicks: 3 }] })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    db.docs.clear();
    dispatch.mockClear();
    const member = (uid: string, role: string) => ({ uid, email: `${uid}@x.test`, role });
    db.docs.set('workspaces/w1', {
      id: 'w1', ownerId: 'u1', memberUids: ['u1', 'a1', 'e1', 'v1'], apiKeyPrefix: KEY1.slice(0, 7),
      members: [member('u1', 'owner'), member('a1', 'admin'), member('e1', 'editor'), member('v1', 'viewer')],
      apiKey: 'ik_LEGACY_PLAINTEXT_MUST_NEVER_LEAK',
    });
    db.docs.set('workspaces/w2', { id: 'w2', ownerId: 'u2', members: [], memberUids: ['u2'] });
    db.docs.set('workspaces/personal_u3', { id: 'personal_u3', ownerId: 'u3', members: [] });
    // keys exist only as hashes
    db.docs.set(`apiKeys/${hashApiKey(KEY1)}`, { workspaceId: 'w1', prefix: KEY1.slice(0, 7) });
    db.docs.set(`apiKeys/${hashApiKey(KEY2)}`, { workspaceId: 'w2', prefix: KEY2.slice(0, 7) });
    db.docs.set(`apiKeys/${hashApiKey(KEY3)}`, { workspaceId: 'personal_u3', prefix: KEY3.slice(0, 7) });
    for (const u of ['u1', 'u2', 'u3', 'u9', 'a1', 'e1', 'v1']) db.docs.set(`users/${u}`, { totalUrls: 0 });
    link('mine1', 'w1', 'u1', 30);
    link('mine2', 'w1', 'u1', 20);
    link('mine3', 'w1', 'u1', 10);
    link('theirs', 'w2', 'u2', 5);
    link('p1', 'personal_u3', 'u3', 3);
    link('legacy', null, 'u3', 2);
  });

  describe('authentication', () => {
    it('requires a key', async () => { await http().get('/api/v1/links').expect(401); });
    it('rejects malformed and unknown keys', async () => {
      await http().get('/api/v1/links').set('x-api-key', 'nope').expect(401);
      await http().get('/api/v1/links').set('x-api-key', 'ik_' + '9'.repeat(48)).expect(401);
    });
  });

  describe('POST /api/v1/links', () => {
    it('creates a link in the key\'s workspace and never leaks internals', async () => {
      const res = await http().post('/api/v1/links').set('x-api-key', KEY1)
        .send({ url: 'https://example.com/new', customAlias: 'Spring-Sale', tags: ['a', 'b'] }).expect(201);
      expect(res.body).toMatchObject({ shortCode: 'spring-sale', originalUrl: 'https://example.com/new', tags: ['a', 'b'], source: 'api', alreadyExisted: false, passwordProtected: false });
      expect(res.body.shortUrl.endsWith('/spring-sale')).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/u1|SECRET|passwordSalt|"password"|workspaceId/);
      expect(db.docs.get('shortUrls/spring-sale').workspaceId).toBe('w1');
      expect(dispatch).toHaveBeenCalledWith('w1', 'link.created', expect.not.objectContaining({ password: expect.anything() }));
    });
    it('ignores a client-supplied workspace', async () => {
      await http().post('/api/v1/links').set('x-api-key', KEY1).send({ url: 'https://example.com/x1', workspaceId: 'w2' }).expect(201);
      const stored = [...db.docs.values()].find((d) => d.originalUrl === 'https://example.com/x1');
      expect(stored.workspaceId).toBe('w1');
    });
    it('supports password protection without returning the hash', async () => {
      const res = await http().post('/api/v1/links').set('x-api-key', KEY1)
        .send({ url: 'https://example.com/pw', passwordProtected: true, password: 'hunter22' }).expect(201);
      expect(res.body.passwordProtected).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/hunter22/);
      expect(db.docs.get(`shortUrls/${res.body.shortCode}`).password).not.toBe('hunter22');
    });
    it('returns the existing link for a URL already shortened in the workspace', async () => {
      const res = await http().post('/api/v1/links').set('x-api-key', KEY1).send({ url: 'https://example.com/mine1' }).expect(201);
      expect(res.body).toMatchObject({ shortCode: 'mine1', alreadyExisted: true });
    });
    it.each([
      ['missing url', {}],
      ['javascript url', { url: 'javascript:alert(1)' }],
      ['reserved alias', { url: 'https://example.com/a', customAlias: 'guides' }],
      ['bad alias', { url: 'https://example.com/a', customAlias: 'a b' }],
    ])('rejects %s', async (_n, body) => { await http().post('/api/v1/links').set('x-api-key', KEY1).send(body).expect(400); });
    it('reports a taken alias as a conflict', async () => {
      await http().post('/api/v1/links').set('x-api-key', KEY1).send({ url: 'https://example.com/c', customAlias: 'mine1' }).expect(409);
    });
  });

  describe('GET /api/v1/links', () => {
    it('lists only the key\'s workspace, newest first', async () => {
      const res = await http().get('/api/v1/links').set('x-api-key', KEY1).expect(200);
      expect(res.body.data.map((l: any) => l.shortCode)).toEqual(['mine3', 'mine2', 'mine1']);
      expect(res.body.nextCursor).toBeNull();
      expect(JSON.stringify(res.body)).not.toMatch(/theirs|SECRET/);
    });
    it('paginates with a cursor', async () => {
      const p1 = await http().get('/api/v1/links?limit=2').set('x-api-key', KEY1).expect(200);
      expect(p1.body.data.map((l: any) => l.shortCode)).toEqual(['mine3', 'mine2']);
      expect(p1.body.nextCursor).toBe('mine2');
      const p2 = await http().get('/api/v1/links?limit=2&cursor=mine2').set('x-api-key', KEY1).expect(200);
      expect(p2.body.data.map((l: any) => l.shortCode)).toEqual(['mine1']);
      expect(p2.body.nextCursor).toBeNull();
    });
    it('refuses a cursor that points at another workspace', async () => {
      await http().get('/api/v1/links?cursor=theirs').set('x-api-key', KEY1).expect(400);
      await http().get('/api/v1/links?cursor=missing').set('x-api-key', KEY1).expect(400);
    });
    it('validates paging input', async () => {
      await http().get('/api/v1/links?limit=0').set('x-api-key', KEY1).expect(400);
      await http().get('/api/v1/links?limit=101').set('x-api-key', KEY1).expect(400);
      await http().get('/api/v1/links?cursor=../x').set('x-api-key', KEY1).expect(400);
    });
    it('works for a personal-workspace key, including legacy links, without crossing owners', async () => {
      const res = await http().get('/api/v1/links').set('x-api-key', KEY3).expect(200);
      expect(res.body.data.map((l: any) => l.shortCode).sort()).toEqual(['legacy', 'p1']);
    });
  });

  describe('GET /api/v1/links/:code', () => {
    it('returns an own link', async () => {
      const res = await http().get('/api/v1/links/mine1').set('x-api-key', KEY1).expect(200);
      expect(res.body.shortCode).toBe('mine1');
      expect(JSON.stringify(res.body)).not.toMatch(/SECRET/);
    });
    it('treats another workspace\'s link exactly like a missing one', async () => {
      const other = await http().get('/api/v1/links/theirs').set('x-api-key', KEY1).expect(404);
      const none = await http().get('/api/v1/links/nothere').set('x-api-key', KEY1).expect(404);
      expect(other.body.message).toBe(none.body.message);
    });
  });

  describe('PATCH /api/v1/links/:code', () => {
    it('updates allowed fields', async () => {
      const res = await http().patch('/api/v1/links/mine1').set('x-api-key', KEY1).send({ tags: ['x'], isActive: false, title: 'Hello' }).expect(200);
      expect(res.body).toMatchObject({ tags: ['x'], isActive: false, title: 'Hello' });
    });
    it('cannot change the destination, owner or counters', async () => {
      await http().patch('/api/v1/links/mine1').set('x-api-key', KEY1)
        .send({ originalUrl: 'https://evil.example', workspaceId: 'w2', userId: 'u2', clickCount: 9999 }).expect(200);
      expect(db.docs.get('shortUrls/mine1')).toMatchObject({ originalUrl: 'https://example.com/mine1', workspaceId: 'w1', userId: 'u1', clickCount: 0 });
    });
    it('cannot touch another workspace', async () => {
      await http().patch('/api/v1/links/theirs').set('x-api-key', KEY1).send({ isActive: false }).expect(404);
      expect(db.docs.get('shortUrls/theirs').isActive).toBe(true);
    });
    it('validates input', async () => {
      await http().patch('/api/v1/links/mine1').set('x-api-key', KEY1).send({ isActive: 'no' }).expect(400);
    });
  });

  describe('GET /api/v1/links/:code/clicks', () => {
    it('returns a series and total for an own link', async () => {
      const res = await http().get('/api/v1/links/mine1/clicks?days=14').set('x-api-key', KEY1).expect(200);
      expect(res.body).toMatchObject({ shortCode: 'mine1', days: 14, total: 5 });
      expect(res.body.data).toHaveLength(2);
    });
    it('caps the window and hides other workspaces', async () => {
      await http().get('/api/v1/links/mine1/clicks?days=31').set('x-api-key', KEY1).expect(400);
      await http().get('/api/v1/links/theirs/clicks').set('x-api-key', KEY1).expect(404);
    });
  });

  describe('DELETE /api/v1/links/:code', () => {
    it('deletes an own link and fires link.deleted with a safe payload', async () => {
      const res = await http().delete('/api/v1/links/mine1').set('x-api-key', KEY1).expect(200);
      expect(res.body).toEqual({ deleted: true, shortCode: 'mine1' });
      expect(db.docs.has('shortUrls/mine1')).toBe(false);
      expect(dispatch).toHaveBeenCalledWith('w1', 'link.deleted', expect.objectContaining({ shortCode: 'mine1' }));
      expect(JSON.stringify(dispatch.mock.calls[0][2])).not.toMatch(/SECRET/);
    });
    it('cannot delete another workspace\'s link', async () => {
      await http().delete('/api/v1/links/theirs').set('x-api-key', KEY1).expect(404);
      expect(db.docs.has('shortUrls/theirs')).toBe(true);
    });
    it('still serves signed-in web users, and still refuses anonymous callers', async () => {
      await http().delete('/api/v1/links/p1').expect(401);
      await http().delete('/api/v1/links/p1').set('Authorization', 'Bearer garbage').expect(401);
      db.docs.set('shortUrls/web1', { id: 'web1', shortCode: 'web1', workspaceId: 'personal_u9', userId: 'u9', originalUrl: 'https://example.com/w' });
      await http().delete('/api/v1/links/web1').set('Authorization', 'Bearer user-u9').expect(200);
      expect(db.docs.has('shortUrls/web1')).toBe(false);
      await http().delete('/api/v1/links/p1').set('Authorization', 'Bearer user-u9').expect(403);
    });
    it('does not let an API key reach the web-app-only routes', async () => {
      await http().put('/api/v1/links/mine1').set('x-api-key', KEY1).send({ isActive: false }).expect(401);
      await http().get('/api/v1/links/workspace/w1').set('x-api-key', KEY1).expect(401);
    });
  });

  describe('shortening a URL that was already shortened (web endpoint, guest)', () => {
    const shorten = (body: any) => http().post('/api/shorten-url').send({ originalUrl: 'https://www.merriam-webster.com/dictionary/hope', ...body });

    it('returns the existing link when nothing special is asked for', async () => {
      const first = await shorten({}).expect(201);
      const again = await shorten({}).expect(201);
      expect(again.body.shortCode).toBe(first.body.shortCode);
    });
    it('honours a custom ending even though the URL already has a link', async () => {
      const first = await shorten({}).expect(201);
      const custom = await shorten({ customAlias: 'comin' }).expect(201);
      expect(custom.body.shortCode).toBe('comin');
      expect(custom.body.shortCode).not.toBe(first.body.shortCode);
      expect(db.docs.get('shortUrls/comin')).toMatchObject({ originalUrl: 'https://www.merriam-webster.com/dictionary/hope', customAlias: 'comin' });
      expect(db.docs.has(`shortUrls/${first.body.shortCode}`)).toBe(true);
    });
    it('asking for the same custom ending again returns that link instead of an error', async () => {
      await shorten({ customAlias: 'comin' }).expect(201);
      const again = await shorten({ customAlias: 'comin' }).expect(201);
      expect(again.body.shortCode).toBe('comin');
    });
    it('still refuses an ending that belongs to a different URL', async () => {
      await shorten({ customAlias: 'comin' }).expect(201);
      await shorten({ originalUrl: 'https://example.com/other', customAlias: 'comin' }).expect(409);
    });
    it('applies a password or expiry instead of silently reusing a plain link', async () => {
      const plain = await shorten({}).expect(201);
      const protectedLink = await shorten({ passwordProtected: true, password: 'hunter22' }).expect(201);
      expect(protectedLink.body.shortCode).not.toBe(plain.body.shortCode);
      expect(protectedLink.body.passwordProtected).toBe(true);
      const expiring = await shorten({ expiration: { mode: 'clicks', maxClicks: 3 } }).expect(201);
      expect(expiring.body.shortCode).not.toBe(plain.body.shortCode);
      expect(expiring.body.expiration).toMatchObject({ mode: 'clicks', maxClicks: 3 });
    });
  });

  describe('API key lifecycle and secrecy', () => {
    const asUser = (uid: string) => ({ Authorization: `Bearer user-${uid}` });
    const OLD_PLAINTEXT = 'ik_' + '7'.repeat(48);

    it('issues a key once, returns it only in that response, and stores only its hash', async () => {
      const res = await http().post('/api/v1/workspaces/w1/api-key').set(asUser('a1')).expect(201);
      expect(res.body.apiKey).toMatch(/^ik_[0-9a-f]{48}$/);
      expect(res.body.prefix).toBe(res.body.apiKey.slice(0, 7));
      expect(res.headers['cache-control']).toBe('no-store');
      // the plain key appears nowhere in the database
      const everything = JSON.stringify([...db.docs.entries()]);
      expect(everything).not.toContain(res.body.apiKey);
      expect(db.docs.has(`apiKeys/${hashApiKey(res.body.apiKey)}`)).toBe(true);
      // the workspace keeps only the prefix, and the legacy plain-text value is gone
      expect(db.docs.get('workspaces/w1').apiKey).toBeUndefined();
      expect(db.docs.get('workspaces/w1').apiKeyPrefix).toBe(res.body.prefix);
      // the new key works
      await http().get('/api/v1/links').set('x-api-key', res.body.apiKey).expect(200);
    });

    it('revokes the previous key when a new one is issued', async () => {
      await http().get('/api/v1/links').set('x-api-key', KEY1).expect(200);
      await http().post('/api/v1/workspaces/w1/api-key').set(asUser('u1')).expect(201);
      await http().get('/api/v1/links').set('x-api-key', KEY1).expect(401);
    });

    it('only owners and admins can issue keys', async () => {
      await http().post('/api/v1/workspaces/w1/api-key').set(asUser('e1')).expect(403);
      await http().post('/api/v1/workspaces/w1/api-key').set(asUser('v1')).expect(403);
      await http().post('/api/v1/workspaces/w1/api-key').expect(401);
      await http().get('/api/v1/links').set('x-api-key', KEY1).expect(200); // untouched
    });

    it('does not honour a legacy plain-text key', async () => {
      db.docs.set('workspaces/w2', { ...db.docs.get('workspaces/w2'), apiKey: OLD_PLAINTEXT });
      await http().get('/api/v1/links').set('x-api-key', OLD_PLAINTEXT).expect(401);
    });

    it('never returns key material in workspace responses, whatever the role', async () => {
      for (const uid of ['v1', 'e1', 'a1', 'u1']) {
        const list = await http().get('/api/v1/workspaces').set(asUser(uid)).expect(200);
        expect(JSON.stringify(list.body)).not.toMatch(/LEGACY_PLAINTEXT|ik_[0-9a-f]{48}/);
        const w1 = list.body.find((w: any) => w.id === 'w1');
        expect(w1).toMatchObject({ hasApiKey: true, apiKeyPrefix: KEY1.slice(0, 7) });
        expect('apiKey' in w1).toBe(false);
        const one = await http().get('/api/v1/workspaces/w1').set(asUser(uid)).expect(200);
        expect(JSON.stringify(one.body)).not.toMatch(/LEGACY_PLAINTEXT/);
      }
    });

    it('shows webhook signing secrets to owners and admins only', async () => {
      db.docs.set('webhooks/h1', { id: 'h1', workspaceId: 'w1', name: 'Hook', url: 'https://example.com/h', events: ['link.clicked'], isActive: true, secret: 'whsec_TOPSECRET' });
      for (const uid of ['v1', 'e1']) {
        const res = await http().get('/api/webhooks?workspaceId=w1').set(asUser(uid)).expect(200);
        expect(res.body).toHaveLength(1);
        expect(JSON.stringify(res.body)).not.toContain('TOPSECRET');
      }
      for (const uid of ['a1', 'u1']) {
        const res = await http().get('/api/webhooks?workspaceId=w1').set(asUser(uid)).expect(200);
        expect(res.body[0].secret).toBe('whsec_TOPSECRET');
      }
    });
  });
});
