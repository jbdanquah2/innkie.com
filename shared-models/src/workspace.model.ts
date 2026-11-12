import { Timestamp } from './firebase-types';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  role?: WorkspaceRole; // Current user's role in this workspace
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  plan?: 'free' | 'pro' | 'enterprise';
  customDomain?: string;
  /** Only a non-secret prefix and creation time are ever stored on the workspace; the key itself is shown once. */
  apiKeyPrefix?: string;
  apiKeyCreatedAt?: Timestamp | Date | string;
  hasApiKey?: boolean; // Added by the API on output
  branding?: WorkspaceBranding;
}

export interface WorkspaceBranding {
  logoUrl?: string;
  brandColor?: string;
  brandName?: string;
  websiteUrl?: string;
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Timestamp | Date;
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
