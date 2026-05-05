import { Timestamp } from './firebase-types';
export type PlatformToolType = 'link_shortener' | 'qr_studio' | 'image_optimizer' | 'json_formatter' | 'utm_builder';
export interface PlatformUsageEvent {
    id?: string;
    workspaceId: string;
    userId: string;
    toolType: PlatformToolType;
    action: string;
    metadata?: any;
    timestamp: Timestamp | Date;
}
export interface WorkspaceDailySummary {
    workspaceId: string;
    date: string;
    metrics: {
        linksShortened: number;
        clicksTotal: number;
        imagesCompressed: number;
        bytesSaved: number;
        qrsGenerated: number;
        otherToolsUsage: number;
    };
    lastUpdatedAt: Timestamp | Date;
}
