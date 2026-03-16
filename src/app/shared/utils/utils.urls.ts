import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import QRCode from 'qrcode';


export const APP_PATHS = ['/',
  "dashboard","home","admin","login","logout","signin","signup","register",
  "profile","settings","account","user","users","me","my","auth",
  "api","backend","server","system","config","docs","swagger",
  "graphql","rest","v1","v2","api-docs",
  "about","contact","help","support","faq","privacy","terms",
  "blog","news","careers","jobs","status",
  "404","500","error","maintenance","offline","redirect",
  "root","super","owner","master","manage","cms","console","reports",
  "pricing","plans","billing","payment","checkout","subscribe","unsubscribe",
  "webhook","hooks","callback","integration","oauth","token","keys"
];


export async function callRedirect(shortCode: string, http: HttpClient, password: string = '' ): Promise<any> {

  return await firstValueFrom(http.post(environment.redirectURL, {
      password: password,
      shortCode: shortCode
    }
  ))

}

  /**
   * Generates a QR code for a given URL.
   * @param originalUrl
   * @param canvas Optional HTMLCanvasElement to render into. If not provided, returns a Data URL.
   * @returns Promise<string | void> Returns a Data URL if no canvas is provided
   */
  export async function generateQrCode(originalUrl: string): Promise<string | null> {
    try {
      // Generate QR code as a base64 image
      return await QRCode.toDataURL(originalUrl, {
        errorCorrectionLevel: 'H', // high error correction
        margin: 2,
        width: 300
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  }


export function toDateSafe(value: any): Date | null {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }

  // { seconds, nanoseconds }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }

  // { _seconds, _nanoseconds }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }

  // JS Date
  if (value instanceof Date) return value;

  // Numeric timestamp
  if (typeof value === 'number') {
    return value < 1e12 ? new Date(value * 1000) : new Date(value);
  }

  // String (ISO or numeric)
  if (typeof value === 'string') {

    const asNum = Number(value);
    if (!isNaN(asNum)) return toDateSafe(asNum);
    const parsed = new Date(value);

    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

