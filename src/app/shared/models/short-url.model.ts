import { Timestamp, FieldValue } from "@angular/fire/firestore";

// this model duplicates rest-api/src/models/short-url.model.ts

export interface ShortUrl {
  id: string;              // Firestore doc ID = shortCode
  userId?: string;         // Reference to AppUser.uid
  originalUrl: string;     // Destination URL
  site?: string,
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
  passwordSalt?: string

  // Counters / quick stats
  clickCount: FieldValue | number; // total clicks
  uniqueClicks?: FieldValue | number //
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

  qrConfig?: QrConfig;
}

export interface QrConfig {
  colorMode: 'single' | 'gradient';
  selectedColor?: string;
  startColor?: string;
  endColor?: string;
  gradientDirection?: 'diagonal' | 'horizontal' | 'vertical' | 'radial';
  logoName?: string;
  logoSrc?: string | null;
  frameName?: string;
}

export interface QrTemplate {
  id: string;
  name: string;
  config: QrConfig;
  createdAt: Timestamp;
}

export type ExpirationMode = 'never' | 'duration' | 'oneTime';

export interface Expiration {
  mode: ExpirationMode;
  // only relevant when mode === 'date'
  expiryDate?: Timestamp;
  // only relevant when mode === 'duration'
  durationValue?: number; // e.g. 3
  durationUnit?: 'hours' | 'days';
  // only relevant when mode === 'oneTime'
  maxClicks?: number;
}


export interface UniqueVisitor {
  id: string;               // Firestore doc ID
  shortCode: string;      // Reference to ShortUrl.id
  ipAddress: string;       // IP address of the visitor
  userAgent: string[]; //
  deviceType: DeviceType[];
  country?: string;        // Optional country code
  city?: string;           // Optional city
  firstVisitAt: Timestamp; // First visit timestamp
  lastVisitAt: Timestamp;  // Last visit timestamp
  visitCount: number;      // Number of visits
}

type DeviceType = 'desktop' | 'mobile' | 'tablet';

