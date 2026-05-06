import { Timestamp, FieldValue } from './firebase-types';

export interface ShortUrl {
  id: string;              // Firestore doc ID = shortCode
  userId?: string;         // Reference to AppUser.uid
  workspaceId?: string;    // Reference to Workspace.id
  originalUrl: string;     // Destination URL
  site?: string;
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
  expiration?: Expiration;
  passwordProtected: boolean;
  password?: string;       // hashed password if protected
  passwordSalt?: string;

  // Counters / quick stats
  clickCount: FieldValue | number; // total clicks
  source?: 'ui' | 'api';
  uniqueClicks?: FieldValue | number;
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
  tags?: string[];
}

export interface QrConfig {
  // Legacy properties (kept for backward compatibility/fallback)
  colorMode?: 'single' | 'gradient';
  selectedColor?: string;
  startColor?: string;
  endColor?: string;
  gradientDirection?: 'diagonal' | 'horizontal' | 'vertical' | 'radial';
  logoName?: string;
  logoSrc?: string | null;
  frameName?: string;

  // New qr-code-styling properties
  dotsOptions?: {
    type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
    color?: string;
    gradient?: QrGradient;
  };
  cornersSquareOptions?: {
    type?: 'dot' | 'square' | 'extra-rounded' | 'rounded' | 'classy' | 'classy-rounded' | 'dots';
    color?: string;
    gradient?: QrGradient;
  };
  cornersDotOptions?: {
    type?: 'dot' | 'square' | 'rounded' | 'classy' | 'classy-rounded' | 'dots' | 'extra-rounded';
    color?: string;
    gradient?: QrGradient;
  };
  backgroundOptions?: {
    color?: string;
    gradient?: QrGradient;
  };
  imageOptions?: {
    hideBackgroundDots?: boolean;
    imageSize?: number;
    margin?: number;
    crossOrigin?: string;
  };
  margin?: number;
}

export interface QrGradient {
  type: 'linear' | 'radial';
  rotation?: number;
  colorStops: { offset: number; color: string }[];
}

export interface QrTemplate {
  id: string;
  name: string;
  workspaceId?: string; // Scoped to workspace
  config: QrConfig;
  createdAt: Timestamp;
}

export type ExpirationMode = 'never' | 'clicks' | 'duration' | 'oneTime';

export interface Expiration {
  mode: ExpirationMode;
  // only relevant when mode === 'date'
  expiryDate?: Timestamp;
  // only relevant when mode === 'duration'
  durationValue?: number; // e.g. 3
  durationUnit?: 'minutes' | 'hours' | 'days';
  // only relevant when mode === 'oneTime'
  maxClicks?: number;
}

export interface UniqueVisitor {
  id: string;               // Firestore doc ID
  shortCode: string;        // Reference to ShortUrl.id
  ipAddress: string;        // IP address of the visitor
  userAgent: string[];
  deviceType: DeviceType[];
  country?: string;         // Optional country code
  city?: string;            // Optional city
  firstVisitAt: Timestamp;  // First visit timestamp
  lastVisitAt: Timestamp;   // Last visit timestamp
  visitCount: number;       // Number of visits
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
