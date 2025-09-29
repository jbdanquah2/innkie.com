// saved on the collection urls/{shortCode}
import {Timestamp} from "firebase/firestore";

export interface ShortUrl {
  id: string;                // Firestore document ID = shortCode
  userId: string | undefined;            // Reference to AppUser.uid
  originalUrl: string;       // Destination URL
  shortCode: string;         // e.g., abc123
  createdAt: Timestamp;           // Creation timestamp
  updatedAt?: Timestamp;          // Last update timestamp
  expiryDate?: Timestamp;         // Optional expiration date
  customAlias?: string;      // Optional vanity alias
  qrCodeUrl?: string;        // Pre-generated QR code
  title?: string;          // Optional page title for preview
  description?: string;    // Optional page description for preview
  thumbnailUrl?: string;   // Optional page thumbnail for preview

  // Status
  isActive: boolean;         // Whether link is active
  isOneTime?: boolean;       // If true, disable after 1 click

  // Counters / quick stats
  clickCount: number;        // Total clicks
  uniqueClicks?: number;     // Distinct visitors
  lastClickedAt?: Timestamp;      // Last time someone clicked

  // Aggregated analytics (summary, not raw)
  topCountries?: Record<string, number>;   // { "US": 120, "GH": 50 }
  topReferrers?: Record<string, number>;   // { "google.com": 34 }
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


