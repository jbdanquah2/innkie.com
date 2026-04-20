import { Timestamp, FieldValue } from './firebase-types';
export interface ShortUrl {
    id: string;
    userId?: string;
    workspaceId?: string;
    originalUrl: string;
    site?: string;
    shortCode: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    customAlias?: string;
    qrCodeUrl?: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    favicon?: string;
    isActive: boolean;
    expiration?: Expiration;
    passwordProtected: boolean;
    password?: string;
    passwordSalt?: string;
    clickCount: FieldValue | number;
    uniqueClicks?: FieldValue | number;
    lastClickedAt?: Timestamp;
    topCountries?: Record<string, number>;
    topReferrers?: Record<string, number>;
    deviceStats?: {
        desktop: number;
        mobile: number;
        tablet: number;
    };
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
export type ExpirationMode = 'never' | 'clicks' | 'duration' | 'oneTime';
export interface Expiration {
    mode: ExpirationMode;
    expiryDate?: Timestamp;
    durationValue?: number;
    durationUnit?: 'minutes' | 'hours' | 'days';
    maxClicks?: number;
}
export interface UniqueVisitor {
    id: string;
    shortCode: string;
    ipAddress: string;
    userAgent: string[];
    deviceType: DeviceType[];
    country?: string;
    city?: string;
    firstVisitAt: Timestamp;
    lastVisitAt: Timestamp;
    visitCount: number;
}
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
