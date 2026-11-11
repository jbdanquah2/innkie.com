'use client';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { AppUser, OauthProvider } from '@innkie/shared-models';
import { apiFetch } from './api';
import { env } from './env';
import { getDb, getFirebaseAuth } from './firebase';

/** Only same-site paths may be used as a post-login destination (blocks open redirects like //evil.com). */
export function safeReturnUrl(raw: string | null | undefined, fallback = '/dashboard/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (raw.startsWith('/login')) return fallback;
  return raw;
}

/** Maps Firebase errors to messages that are helpful without leaking whether an email is registered. */
export function authErrorMessage(error: any, mode: 'login' | 'register' | 'google'): string {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    default:
      return mode === 'google' ? 'Google sign-in failed. Please try again.' : 'Authentication failed. Please try again.';
  }
}

/** POST /api/apply-custom-claims, then force-refresh the ID token so the claims take effect. Throws on failure. */
export async function applyCustomClaims(cred: UserCredential): Promise<void> {
  const idToken = await cred.user.getIdToken();
  const res = await apiFetch(env.endpoints.applyCustomClaims, { method: 'POST', body: JSON.stringify({ idToken }) });
  if (!res.ok) throw new Error(`apply-custom-claims failed (${res.status})`);
  await cred.user.getIdToken(true);
}

/** Creates users/{uid} on first sign-in; otherwise merges provider ids and refreshes lastLogin. */
export async function addOrUpdateUser(cred: UserCredential, providerId: OauthProvider): Promise<void> {
  const user = cred.user;
  const ref = doc(getDb(), `users/${user.uid}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const appUser: Partial<AppUser> = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      providerIds: [providerId],
      emailVerified: !!user.emailVerified,
      createdAt: Timestamp.now() as any,
      lastLogin: Timestamp.now() as any,
      role: 'user',
      totalUrls: 0,
      maxUrls: 10000,
    };
    await setDoc(ref, appUser);
    await user.getIdToken(true);
    return;
  }

  const data = snap.data() as AppUser;
  const current = data.providerIds || [];
  const patch: Partial<AppUser> = {
    displayName: data.displayName || user.displayName || '',
    photoURL: data.photoURL || user.photoURL || '',
    providerIds: current.includes(providerId) ? current : [...current, providerId],
    emailVerified: !!user.emailVerified,
    lastLogin: Timestamp.now() as any,
  };
  await updateDoc(ref, patch as any);
}

export interface AuthOutcome {
  /** Non-fatal problems the UI should tell the user about (profile sync / claims). */
  warnings: string[];
}

export async function signInWithPassword(email: string, password: string): Promise<AuthOutcome> {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const warnings: string[] = [];
  try {
    await addOrUpdateUser(cred, 'password');
  } catch (e) {
    console.warn('Could not sync user profile in Firestore:', e);
    warnings.push('Signed in, but your profile could not be synced.');
  }
  return { warnings };
}

export async function registerWithPassword(email: string, password: string): Promise<AuthOutcome> {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  const warnings: string[] = [];
  try {
    await applyCustomClaims(cred);
  } catch (e) {
    console.error('Could not apply custom claims:', e);
    warnings.push('Your account was created, but some setup steps failed. If anything looks off, sign out and back in.');
  }
  try {
    await addOrUpdateUser(cred, 'password');
  } catch (e) {
    console.warn('Could not sync user profile in Firestore:', e);
    warnings.push('Your profile could not be saved yet. It will be retried next time you sign in.');
  }
  return { warnings };
}

export async function signInWithGoogle(): Promise<AuthOutcome> {
  const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  const warnings: string[] = [];
  try {
    await applyCustomClaims(cred);
  } catch (e) {
    console.error('Could not apply custom claims:', e);
    warnings.push('Signed in, but some account setup steps failed. If anything looks off, sign out and back in.');
  }
  try {
    await addOrUpdateUser(cred, 'google.com');
  } catch (e) {
    console.warn('Could not sync user profile in Firestore:', e);
    warnings.push('Signed in, but your profile could not be synced.');
  }
  return { warnings };
}

export const sendReset = (email: string) => sendPasswordResetEmail(getFirebaseAuth(), email);
