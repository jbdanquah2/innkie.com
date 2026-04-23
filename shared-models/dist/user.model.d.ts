import { Timestamp } from './firebase-types';
import { QrTemplate } from './short-url.model';
export interface AppUser {
    uid: string;
    email: string | null;
    userName?: string;
    displayName: string | null;
    photoURL: string | null;
    providerId?: string;
    providerIds?: OauthProvider[];
    emailVerified: boolean;
    role?: 'user' | 'admin';
    createdAt?: Timestamp | Date;
    userCreatedAt?: Timestamp | Date;
    lastLogin?: Timestamp | Date;
    totalUrls?: number;
    maxUrls?: number;
    currentWorkspaceId?: string;
    defaultWorkspaceId?: string;
    workspaceIds?: string[];
    darkMode?: boolean;
    qrTemplates?: QrTemplate[];
    notificationDisabled?: boolean;
    personalBranding?: {
        brandColor?: string;
        brandName?: string;
        logoUrl?: string;
    };
}
export type OauthProvider = 'google.com' | 'password' | 'twitter' | 'github.com';
