import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-innkie',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
afterAll(async () => { await env.cleanup(); });

const newUser = (uid: string) => ({ uid, email: 'a@b.c', displayName: 'A', role: 'user', totalUrls: 0, maxUrls: 10000, createdAt: 1 });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), newUser('alice'));
    await setDoc(doc(db, 'shortUrls/open1'), { userId: 'alice', originalUrl: 'https://x.y', passwordProtected: false, clickCount: 3 });
    await setDoc(doc(db, 'shortUrls/locked1'), { userId: 'alice', workspaceId: 'ws1', originalUrl: 'https://x.y', passwordProtected: true });
    await setDoc(doc(db, 'workspaces/ws1'), { memberUids: ['bob'] });
    await setDoc(doc(db, 'stats/global'), { totalLinks: 1 });
  });
});

const as = (uid?: string) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

describe('users', () => {
  it('owner can read, others cannot', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice')));
    await assertFails(getDoc(doc(as('mallory'), 'users/alice')));
    await assertFails(getDoc(doc(as(), 'users/alice')));
  });
  it('can create own profile only as a plain user with default limits', async () => {
    await assertSucceeds(setDoc(doc(as('carol'), 'users/carol'), newUser('carol')));
    await assertFails(setDoc(doc(as('dave'), 'users/dave'), { ...newUser('dave'), role: 'admin' }));
    await assertFails(setDoc(doc(as('erin'), 'users/erin'), { ...newUser('erin'), maxUrls: 999999 }));
    await assertFails(setDoc(doc(as('mallory'), 'users/frank'), newUser('frank')));
  });
  it('can edit profile fields but never role/limits/counters/identity', async () => {
    const ref = doc(as('alice'), 'users/alice');
    await assertSucceeds(updateDoc(ref, { displayName: 'New Name', lastLogin: 2 }));
    await assertFails(updateDoc(ref, { role: 'admin' }));
    await assertFails(updateDoc(ref, { maxUrls: 1e9 }));
    await assertFails(updateDoc(ref, { totalUrls: -1 }));
    await assertFails(updateDoc(ref, { uid: 'someone-else' }));
    await assertFails(updateDoc(ref, { createdAt: 5 }));
  });
  it('cannot be deleted from the client', async () => {
    await assertFails(deleteDoc(doc(as('alice'), 'users/alice')));
  });
});

describe('shortUrls', () => {
  it('unprotected links are publicly readable; protected ones are not', async () => {
    await assertSucceeds(getDoc(doc(as(), 'shortUrls/open1')));
    await assertFails(getDoc(doc(as(), 'shortUrls/locked1')));
    await assertSucceeds(getDoc(doc(as('alice'), 'shortUrls/locked1')));
    await assertSucceeds(getDoc(doc(as('bob'), 'shortUrls/locked1'))); // workspace member
    await assertFails(getDoc(doc(as('mallory'), 'shortUrls/locked1')));
  });
  it('clients cannot create, update or delete links (even their own)', async () => {
    await assertFails(setDoc(doc(as('alice'), 'shortUrls/new1'), { userId: 'alice', originalUrl: 'https://x.y', clickCount: 999 }));
    await assertFails(updateDoc(doc(as('alice'), 'shortUrls/open1'), { clickCount: 0 }));
    await assertFails(updateDoc(doc(as('alice'), 'shortUrls/open1'), { password: 'plain' }));
    await assertFails(deleteDoc(doc(as('alice'), 'shortUrls/open1')));
    await assertFails(updateDoc(doc(as('mallory'), 'shortUrls/open1'), { originalUrl: 'https://evil' }));
  });
  it('click records are not client-writable', async () => {
    await assertFails(setDoc(doc(as('alice'), 'shortUrls/open1/clicks/c1'), { a: 1 }));
  });
});

describe('workspaces and stats', () => {
  it('only members read workspaces; nobody writes', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'workspaces/ws1')));
    await assertFails(getDoc(doc(as('mallory'), 'workspaces/ws1')));
    await assertFails(updateDoc(doc(as('bob'), 'workspaces/ws1'), { memberUids: ['bob', 'mallory'] }));
  });
  it('stats/global is public-read, server-write only', async () => {
    await assertSucceeds(getDoc(doc(as(), 'stats/global')));
    await assertFails(updateDoc(doc(as('alice'), 'stats/global'), { totalLinks: 1e9 }));
    await assertFails(setDoc(doc(as(), 'stats/other'), { x: 1 }));
  });
});
