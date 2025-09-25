export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  emailVerified: boolean;

  role?: 'user' | 'admin';
  createdAt?: Date;
  lastLogin?: Date;

  totalUrls?: number;       // how many URLs they have created
  maxUrls?: number;         // quota (if you want to limit free accounts)

  darkMode?: boolean;       // optional UX preference
}
