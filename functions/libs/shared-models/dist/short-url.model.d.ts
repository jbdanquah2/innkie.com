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
    source?: 'ui' | 'api';
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
    colorMode?: 'single' | 'gradient';
    selectedColor?: string;
    startColor?: string;
    endColor?: string;
    gradientDirection?: 'diagonal' | 'horizontal' | 'vertical' | 'radial';
    logoName?: string;
    logoSrc?: string | null;
    frameName?: string;
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
    colorStops: {
        offset: number;
        color: string;
    }[];
}
export interface QrTemplate {
    id: string;
    name: string;
    workspaceId?: string;
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
