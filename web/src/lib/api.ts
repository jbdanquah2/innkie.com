'use client';
import { getFirebaseAuth } from './firebase';
import { env } from './env';

/**
 * fetch wrapper replacing the Angular AuthInterceptor: attaches the Firebase ID token, but only
 * to our own API origin so the token is never sent to a third party.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (input.startsWith(env.apiUrl)) {
    const user = getFirebaseAuth().currentUser;
    if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** JSON request helper: attaches the token, throws ApiError(message from the API body) on non-2xx. */
export async function apiJson<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await apiFetch(url, { ...rest, body: json !== undefined ? JSON.stringify(json) : rest.body });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || data?.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
