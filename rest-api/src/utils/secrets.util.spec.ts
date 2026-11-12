import { describe, expect, it } from '@jest/globals';
import { apiKeyPrefix, hashApiKey, toWebhookOut, toWorkspaceOut } from './secrets.util';

describe('API key helpers', () => {
  const key = 'ik_' + 'ab12'.repeat(12);
  it('hashes deterministically to 64 hex chars and never contains the key', () => {
    expect(hashApiKey(key)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toContain('ab12ab12');
    expect(hashApiKey(key)).not.toBe(hashApiKey(key + 'x'));
  });
  it('shows only the first seven characters', () => {
    expect(apiKeyPrefix(key)).toBe('ik_ab12');
  });
});

describe('toWorkspaceOut', () => {
  it('removes a legacy plain-text key and reports whether a hashed key exists', () => {
    const out = toWorkspaceOut({ id: 'w', name: 'N', apiKey: 'ik_secret', apiKeyPrefix: 'ik_1234' });
    expect(JSON.stringify(out)).not.toContain('ik_secret');
    expect(out).toMatchObject({ id: 'w', name: 'N', apiKeyPrefix: 'ik_1234', hasApiKey: true });
    expect(toWorkspaceOut({ id: 'w' }).hasApiKey).toBe(false);
    // a legacy key alone does not count as having a (valid) key
    expect(toWorkspaceOut({ id: 'w', apiKey: 'ik_old' }).hasApiKey).toBe(false);
  });
});

describe('toWebhookOut', () => {
  const hook = { id: 'h', url: 'https://x.y', secret: 'whsec_abc' };
  it('includes the secret only when asked', () => {
    expect(toWebhookOut(hook, true).secret).toBe('whsec_abc');
    expect('secret' in toWebhookOut(hook, false)).toBe(false);
  });
});
