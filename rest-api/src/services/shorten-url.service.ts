import { Injectable, Optional } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as log from 'loglevel';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';
import { ShortUrl } from '@innkie/shared-models';
import * as QRCode from 'qrcode';
import { LongUrlPreviewService } from './long-url-preview.service';
import { RedisService } from './redis.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';

@Injectable()
export class ShortenUrlService {

  URL = '';
  BASE_PORT: number;
  BASE_URL = '';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly longUrlPreviewService: LongUrlPreviewService,
    private configService: ConfigService,
    @Optional() private redisService: RedisService,
    @Optional() private readonly webhookDispatcher: WebhookDispatcherService,
  ) {

    const isProduction: boolean = this.configService.get<string>('PRODUCTION', 'false').toLowerCase() === 'true';

    console.log('isProduction:', isProduction);

    this.BASE_URL = this.configService.get<string>('BASE_URL', 'http://localhost');
    this.BASE_PORT = this.configService.get<number>('BASE_PORT', 4200);

    this.URL = isProduction ? this.BASE_URL : `${this.BASE_URL}:${this.BASE_PORT}`;

    console.log('Final URL:', this.URL);

  }

  async createShortUrl(originalUrl: string, userId: string | undefined, workspaceId?: string): Promise<Partial<ShortUrl> | any> {
    console.log('📝 [ShortenUrlService] createShortUrl called');
    console.log('📝 [ShortenUrlService] Using Firestore from FirebaseService:', !!this.firebase.db);

    log.debug(
      'Called createShortUrl with originalUrl:',
      originalUrl,
      'userId:',
      userId,
      'workspaceId:',
      workspaceId
    );

    console.log('@>>>>>API_URL', process.env.API_URL);

    if (!originalUrl) {
      throw new Error('Original URL is required');
    }

    const effectiveWorkspaceId = workspaceId || 'personal';

    // Check if the original URL already exists in this workspace/personal scope
    const existingShortUrl: ShortUrl | null = await this.checkOriginalUrlExists(originalUrl, effectiveWorkspaceId, userId);
    if (existingShortUrl) {
      log.debug('Original URL already shortened in this scope:', existingShortUrl);
      if (this.redisService) {
        await this.redisService.del(`url:${existingShortUrl.shortCode}`);
        if (existingShortUrl.customAlias) {
          await this.redisService.del(`url:${existingShortUrl.customAlias}`);
        }
      }
      return {
        exists: true,
        shortCode: existingShortUrl.shortCode,
        qrCodeUrl: existingShortUrl?.qrCodeUrl as string,
        originalUrl
      };
    }

    const shortCode: string = this.generateRandomString(6);
    log.debug('Generated shortCode:', shortCode);

    const previewData = await this.longUrlPreviewService.getPreview(originalUrl);

    const shortUrlDoc: Partial<ShortUrl> = {
      id: shortCode,
      userId: userId || 'anonymous',
      workspaceId: effectiveWorkspaceId,
      originalUrl: originalUrl,
      shortCode: shortCode,
      createdAt: Timestamp.now() as any,
      isActive: true,
      passwordProtected: false,
      clickCount: 0,
      ...previewData
    };

    console.log("shortUrlDoc", shortUrlDoc);

    await this.firebase.db.doc(`shortUrls/${shortCode}`).set(shortUrlDoc);

    // Dispatch Webhook
    if (this.webhookDispatcher) {
      this.webhookDispatcher.dispatch(effectiveWorkspaceId, 'link.created', shortUrlDoc);
    }

    if (this.redisService) {
      await this.redisService.del(`url:${shortCode}`);
    }
    log.debug('Short URL saved to Firestore with ID:', shortCode);
    if (userId) {
      console.log('Updating total urls count:', userId, effectiveWorkspaceId);
      await this.updateTotalUrlsCount(userId, effectiveWorkspaceId);
    }

    return {
      ...shortUrlDoc
    };
  }

  async checkOriginalUrlExists(originalUrl: string, workspaceId?: string, userId?: string): Promise<ShortUrl | null> {
    let query = this.firebase.db.collection('shortUrls').where('originalUrl', '==', originalUrl);

    if (workspaceId && workspaceId !== 'personal') {
      query = query.where('workspaceId', '==', workspaceId);
    } else if (userId) {
      query = query.where('userId', '==', userId).where('workspaceId', '==', 'personal');
    }

    const querySnapshot = await query.limit(1).get();

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

  private async updateTotalUrlsCount(userId: string, workspaceId?: string): Promise<void> {
    const userRef = this.firebase.db.doc(`users/${userId}`);
    await userRef.update({
      totalUrls: FieldValue.increment(1),
    });

    if (workspaceId && workspaceId !== 'personal') {
      const workspaceRef = this.firebase.db.doc(`workspaces/${workspaceId}`);
      await workspaceRef.update({
        totalUrls: FieldValue.increment(1),
      });
    }
  }
}
