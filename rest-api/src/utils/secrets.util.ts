import * as crypto from 'crypto';

/** SHA-256 of an API key, hex. Keys are 192 random bits, so a fast hash is sufficient (nothing to brute-force). */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/** The non-secret leading characters shown in the UI to recognise a key (e.g. `ik_3fa9`). */
export function apiKeyPrefix(key: string): string {
  return key.slice(0, 7);
}

/**
 * The shape workspaces leave the API in. Drops any `apiKey` (legacy plain-text value) so key material can never
 * reach a client, and tells the UI whether a key exists via `hasApiKey`.
 */
export function toWorkspaceOut<T extends Record<string, any>>(ws: T): Omit<T, 'apiKey'> & { hasApiKey: boolean } {
  const { apiKey: _legacy, ...rest } = ws;
  return { ...rest, hasApiKey: !!rest['apiKeyPrefix'] };
}

/** Webhook signing secrets are for owners and admins only. */
export function toWebhookOut<T extends Record<string, any>>(hook: T, includeSecret: boolean): Omit<T, 'secret'> & { secret?: string } {
  const { secret, ...rest } = hook;
  return includeSecret ? { ...rest, secret } : rest;
}
