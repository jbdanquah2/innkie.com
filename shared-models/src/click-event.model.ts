import { Timestamp } from './firebase-types';

export interface ClickEvent {
  id: string;                // shortCode
  shortUrlId: string;        // Reference to ShortUrl.id
  workspaceId?: string;      // Reference to Workspace.id
  userId?: string;           // Reference to AppUser.uid
  tags?: string[];           // Copied from ShortUrl for aggregation
  timestamp: Timestamp | Date; // Click time
  ipAddress?: string;
  country?: string;
  city?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot';
}
