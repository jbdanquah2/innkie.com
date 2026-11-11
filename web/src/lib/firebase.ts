'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from './env';

function app() {
  return getApps().length ? getApp() : initializeApp(env.firebase);
}

// Lazy getters: nothing initialises during static prerender unless a client effect calls them.
export const getFirebaseAuth = () => getAuth(app());
export const getDb = () => getFirestore(app());
