import {firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import QRCode from 'qrcode';


export const APP_PATHS = ['/','/dashboard', '/features', '/login', '/settings', '/profile', '/help', '/about'];

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
