import {serverTimestamp} from '@angular/fire/firestore';
import {ShortUrl} from './short-url.model';
import {Timestamp} from '@angular/fire/firestore';

export interface AppUser extends ShortUrl {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  emailVerified: boolean;

  role?: 'user' | 'admin';
  userCreatedAt?: Timestamp;
  lastLogin?: Timestamp;

  totalUrls?: number;       // how many URLs they have created
  maxUrls?: number;         // quota (if you want to limit free accounts)

  darkMode?: boolean;       // optional UX preference
}





