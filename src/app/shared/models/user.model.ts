import {FieldValue, serverTimestamp} from '@angular/fire/firestore';
import {ShortUrl} from './short-url.model';
import {Timestamp} from '@angular/fire/firestore';

export interface AppUser extends ShortUrl {
  uid: string;
  email: string | null;
  userName?: string;
  displayName: string | null;
  photoURL: string | null;
  providerIds: provider[] | FieldValue
  emailVerified: boolean;

  role?: 'user' | 'admin';
  userCreatedAt?: Timestamp;
  lastLogin?: Timestamp;

  notificationDisabled?: boolean;

  totalUrls?: number;       // how many URLs they have created
  maxUrls?: number;

  darkMode?: boolean;       // optional UX preference
}

type provider = 'google.com' | 'password' | 'twitter'





