'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { AppUser } from '@innkie/shared-models';
import { getDb, getFirebaseAuth } from './firebase';

interface AuthState {
  /** Firebase Auth user (instant). */
  user: User | null;
  /** users/{uid} profile from Firestore; starts as a quick profile built from the auth user. */
  profile: AppUser | null;
  /** false until Firebase has reported the initial auth state (avoids guest-UI flicker). */
  ready: boolean;
  /** true once the users/{uid} document has been fetched (or failed) for the signed-in user; always true when signed out. */
  profileReady: boolean;
  logout: () => Promise<void>;
  /** Optimistic profile update, written to Firestore and rolled back if the write fails. */
  patchProfile: (updates: Partial<AppUser>) => Promise<void>;
}

const noop = async () => {};
const AuthContext = createContext<AuthState>({ user: null, profile: null, ready: false, profileReady: false, logout: noop, patchProfile: noop });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const profileRef = useRef<AppUser | null>(null);
  profileRef.current = profile;

  useEffect(() => {
    let alive = true;
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setProfileReady(true);
        setReady(true);
        return;
      }
      setProfileReady(false);
      // Optimistic profile first (so the UI has a name/avatar immediately), then the Firestore document.
      const quick = { uid: u.uid, displayName: u.displayName ?? '', email: u.email ?? '', photoURL: u.photoURL ?? '' } as AppUser;
      setProfile(quick);
      setReady(true);
      try {
        const snap = await getDoc(doc(getDb(), `users/${u.uid}`));
        if (alive && getFirebaseAuth().currentUser?.uid === u.uid) setProfile(snap.exists() ? (snap.data() as AppUser) : quick);
      } catch (e) {
        console.error('Error loading user details', e);
      } finally {
        if (alive) setProfileReady(true);
      }
    });
    return () => { alive = false; unsub(); };
  }, []);

  const patchProfile = useCallback(async (updates: Partial<AppUser>) => {
    const current = profileRef.current;
    if (!current?.uid) return;
    setProfile({ ...current, ...updates });
    try {
      await updateDoc(doc(getDb(), `users/${current.uid}`), updates as any);
    } catch (e) {
      console.error('Firestore update failed, rolling back user:', e);
      setProfile(current);
      throw e;
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, profile, ready, profileReady, logout: () => signOut(getFirebaseAuth()), patchProfile }),
    [user, profile, ready, profileReady, patchProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
