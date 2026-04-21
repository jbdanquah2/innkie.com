import { Timestamp } from './firebase-types';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  plan: 'free' | 'pro' | 'enterprise';
  customDomain?: string;
  apiKey?: string; // For the Public API feature
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
