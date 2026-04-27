import * as cheerio from 'cheerio';
import crypto from "crypto";


export function hashPassword(password: string, salt: string): string {
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  return new Date(timestamp);
}

export function appendUtmParameters(url: string, campaign: any): string {
  if (!campaign) return url;

  try {
    const urlObj = new URL(url);
    const utmParams: Record<string, string> = {
      utm_source: campaign.utmSource,
      utm_medium: campaign.utmMedium,
      utm_campaign: campaign.utmCampaign,
      utm_term: campaign.utmTerm,
      utm_content: campaign.utmContent,
    };

    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        urlObj.searchParams.set(key, value);
      }
    });

    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original URL
    return url;
  }
}

