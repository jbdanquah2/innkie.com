import { Timestamp } from './firebase-types';

export type PlatformToolType = 'link_shortener' | 'qr_studio' | 'image_optimizer' | 'json_formatter' | 'utm_builder' | 'png_to_jpeg' | 'svg_to_png';

export interface PlatformUsageEvent {
  id?: string;
  workspaceId: string;
  userId: string;
  toolType: PlatformToolType;
  action: string;        // e.g., 'shorten', 'compress', 'generate'
  metadata?: any;        // e.g., { bytesSaved: 1024 } for image_optimizer
  timestamp: Timestamp | Date;
}

export interface WorkspaceDailySummary {
  workspaceId: string;
  date: string;          // YYYY-MM-DD
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
