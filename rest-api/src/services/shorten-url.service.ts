import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Timestamp } from 'firebase-admin/firestore';
import * as log from 'loglevel';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';
import { ShortUrl } from '../models/short-url.model';
import * as QRCode from 'qrcode';

@Injectable()
export class ShortenUrlService {

  API_URL = '';
  PORT: number;
  SERVER_URL = '';

  constructor(
    private readonly firebase: FirebaseService,
    private configService: ConfigService,
  ) {
    this.API_URL = this.configService.get<string>('API_URL', 'http://localhost');
    this.PORT = this.configService.get<number>('PORT', 5000);
    this.SERVER_URL = `${this.API_URL}:${this.PORT}`;
  }

  async createShortUrl(originalUrl: string, userId: string | undefined): Promise<{ shortCode: string; shortenedUrl: string; qrCodeUrl: string }> {
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
        shortenedUrl: `${this.SERVER_URL}/${existingShortUrl.shortCode}`,
        qrCodeUrl: existingShortUrl.qrCodeUrl as string
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

    const  shortenedUrl = `${this.SERVER_URL}/${shortCode}`;

    const qrCodeUrl = await this.generateQrCode(shortenedUrl);
    log.debug('Generated QR code URL');

    const shortUrlDoc: ShortUrl = {
      id: shortCode,
      userId: userId,
      originalUrl: originalUrl,
      shortCode: shortCode,
      qrCodeUrl: qrCodeUrl,
      createdAt: Timestamp.now().toDate(),
      isActive: true,
      clickCount: 0,
    };

    // const shortUrlId = this.firebase.createId();

    await this.firebase.db.doc(`shortUrls/${shortCode}`).set(shortUrlDoc);

    return {
      shortCode,
      shortenedUrl: `${this.SERVER_URL}/${shortCode}`,
      qrCodeUrl: qrCodeUrl
    };
  }

  async generateQrCode(shortUrl: string): Promise<string> {
    try {
      // return a data URL (base64 image)
      return await QRCode.toDataURL(shortUrl, {
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
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }


}
