import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as log from 'loglevel';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';
import { ShortUrl } from '../models/short-url.model';
import * as QRCode from 'qrcode';
import { LongUrlPreviewService } from './long-url-preview.service';

@Injectable()
export class ShortenUrlService {

  URL = '';
  BASE_PORT: number;
  BASE_URL = '';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly longUrlPreviewService: LongUrlPreviewService,
    private configService: ConfigService,
  ) {
    this.BASE_URL = this.configService.get<string>('BASE_URL', 'http://localhost');
    this.BASE_PORT = this.configService.get<number>('BASE_PORT', 4200);
    this.URL = `${this.BASE_URL}:${this.BASE_PORT}`;
  }

  async createShortUrl(originalUrl: string, userId: string | undefined): Promise<{ shortCode: string; shortenedUrl: string; qrCodeUrl?: string; originalUrl:string }> {
    log.debug(
      'Called createShortUrl with originalUrl:',
      originalUrl,
      'userId:',
      userId,
    );

    console.log('@>>>>>API_URL', process.env.API_URL);

    if (!originalUrl) {
      throw new Error('Original URL is required');
    }

    // Check if the original URL already exists
    const existingShortUrl = await this.checkOriginalUrlExists(originalUrl);
    if (existingShortUrl) {
      log.debug('Original URL already shortened:', existingShortUrl);
      return {
        shortCode: existingShortUrl.shortCode,
        shortenedUrl: `${this.URL}/${existingShortUrl.shortCode}`,
        qrCodeUrl: existingShortUrl?.qrCodeUrl as string,
        originalUrl
      };
    }

    const shortCode = this.generateRandomString(6);
    log.debug('Generated shortCode:', shortCode);

    // Check for collision
    // const existingDoc = await this.firebase.db.doc(`shortUrls/${shortCode}`).get();
    // if (existingDoc.exists) {
    //   // In the rare case of a collision, recursively generate a new code
    //   return this.createShortUrl(originalUrl, userId);
    // }

    // const  shortenedUrl = `${this.URL}/${shortCode}`;

    // const qrCodeUrl = await this.generateQrCode(originalUrl);


    const previewData = await this.longUrlPreviewService.getPreview(originalUrl);

    const shortUrlDoc: ShortUrl = {
      id: shortCode,
      userId: userId || 'anonymous',
      originalUrl: originalUrl,
      shortCode: shortCode,
      // qrCodeUrl: qrCodeUrl,
      createdAt: Timestamp.now(),
      isActive: true,
      passwordProtected: false,
      clickCount: 0,
      ...previewData
    };

    // const shortUrlId = this.firebase.createId();

    await this.firebase.db.doc(`shortUrls/${shortCode}`).set(shortUrlDoc);
    log.debug('Short URL saved to Firestore with ID:', shortCode);
    if (userId) {
      console.log('Updating total urls count for user:', userId);
      await this.updateTotalUrlsCount(userId);
    }

    return {
      shortCode,
      shortenedUrl: `${this.URL}/${shortCode}`,
      // qrCodeUrl: qrCodeUrl,
      originalUrl
    };
  }

  async generateQrCode(originalUrl: string): Promise<string> {
    try {
      // return a data URL (base64 image)
      return await QRCode.toDataURL(originalUrl, {
        errorCorrectionLevel: 'H', // high error correction
        margin: 2,
        width: 300
      });
    } catch (err) {
      console.error('QR code generation failed', err);
      throw err;
    }
  }

  async checkOriginalUrlExists(originalUrl: string): Promise<ShortUrl | null> {
    const querySnapshot = await this.firebase.db
      .collection('shortUrls')
      .where('originalUrl', '==', originalUrl)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return doc.data() as ShortUrl;
  }

  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  private async updateTotalUrlsCount(userId: string): Promise<void> {
    const statsRef = this.firebase.db.doc(`users/${userId}`);
    await statsRef.update({
      totalUrls: FieldValue.increment(1),
    });
  }
}
