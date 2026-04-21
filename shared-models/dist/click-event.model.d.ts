import { Timestamp } from './firebase-types';
export interface ClickEvent {
    id: string;
    shortUrlId: string;
    workspaceId?: string;
    userId?: string;
    tags?: string[];
    timestamp: Timestamp | Date;
    ipAddress?: string;
    country?: string;
    city?: string;
    referrer?: string;
    userAgent?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot';
}
