// saved in shortUrls/{shortCode}/clickEvents/{clickEventId}
export interface ClickEvent {
  id: string;                // shortCode
  shortUrlId: string;        // Reference to ShortUrl.id
  timestamp: Date;           // Click time
  ipAddress?: string;
  country?: string;
  city?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'bot';
}
