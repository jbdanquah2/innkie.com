import { Timestamp } from "@angular/fire/firestore";

export interface ShortUrl {
  id: string;              // Firestore doc ID = shortCode
  userId?: string;         // Reference to AppUser.uid
  originalUrl: string;     // Destination URL
  shortCode: string;       // e.g., abc123
  createdAt: Timestamp;    // Creation timestamp
  updatedAt?: Timestamp;   // Last update timestamp
  customAlias?: string;    // Optional vanity alias
  qrCodeUrl?: string;      // Pre-generated QR code
  title?: string;          // Optional page title
  description?: string;    // Optional page description
  thumbnailUrl?: string;
  favicon?: string;

  // Status
  isActive: boolean;
  expiration?: Expiration; //
  passwordProtected: boolean;
  password?: string;       // hashed password if protected

  // Counters / quick stats
  clickCount: number;
  uniqueClicks?: number;
  lastClickedAt?: Timestamp;

  // Aggregated analytics (summary, not raw)
  topCountries?: Record<string, number>;
  topReferrers?: Record<string, number>;
  deviceStats?: {
    desktop: number;
    mobile: number;
    tablet: number;
  };

  // Marketing / tracking
  campaign?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
}

export type ExpirationMode = 'never' | 'date' | 'duration' | 'oneTime';

export interface Expiration {
  mode: ExpirationMode;
  // only relevant when mode === 'date'
  expiryDate?: Timestamp;
  // only relevant when mode === 'duration'
  durationValue?: number; // e.g. 3
  durationUnit?: 'minutes' | 'hours' | 'days';
  // only relevant when mode === 'oneTime'
  maxClicks?: number; // typically 1
}
