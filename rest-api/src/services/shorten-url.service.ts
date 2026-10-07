import { BadRequestException, ConflictException, Injectable, Optional } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as log from 'loglevel';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';
import { ShortUrl, isPersonalWorkspace } from '@innkie/shared-models';
import { LongUrlPreviewService } from './long-url-preview.service';
import { RedisService } from './redis.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { isReservedWord } from '../utils/url.utils';

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

    // If BASE_URL doesn't have a protocol, add it
    let protocol = isProduction ? 'https://' : 'http://';
    let base = this.BASE_URL.replace(/^https?:\/\//, '');
    
    this.URL = isProduction ? `${protocol}${base}` : `${protocol}${base}:${this.BASE_PORT}`;

    console.log('Final URL Base:', this.URL);

  }

  async createShortUrl(
    originalUrl: string, 
    userId: string | undefined, 
    workspaceId?: string, 
    source: 'ui' | 'api' = 'ui', 
    campaign?: any,
    customAlias?: string,
    tags?: string[]
  ): Promise<Partial<ShortUrl> | any> {
    console.log('📝 [ShortenUrlService] createShortUrl called');
    console.log('📝 [ShortenUrlService] Using Firestore from FirebaseService:', !!this.firebase.db);

    log.debug(
      'Called createShortUrl with originalUrl:',
      originalUrl,
      'userId:',
      userId,
      'workspaceId:',
      workspaceId,
      'campaign:',
      campaign
    );

    console.log('@>>>>>API_URL', process.env.API_URL);

    if (!originalUrl) {
      throw new BadRequestException('Original URL is required');
    }

    // Check for reserved words if custom alias is provided
    if (customAlias && isReservedWord(customAlias)) {
      throw new BadRequestException(`The alias "${customAlias}" is reserved for system use.`);
    }

    const effectiveWorkspaceId = workspaceId || (userId ? `personal_${userId}` : 'personal');

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

    let shortCode: string;
    if (customAlias) {
      shortCode = customAlias.toLowerCase();
      const existing = await this.getShortUrl(shortCode);
      if (existing) {
        throw new ConflictException(`The alias "${customAlias}" is already taken.`);
      }
    } else {
      // Collision retry loop
      let attempts = 0;
      do {
        shortCode = this.generateRandomString(6);
        const existing = await this.getShortUrl(shortCode);
        if (!existing) break;
        attempts++;
      } while (attempts < 5);
    }

    log.debug('Generated shortCode:', shortCode);

    let previewData: any = {};
    try {
      previewData = await this.longUrlPreviewService.getPreview(originalUrl);
    } catch (e: any) {
      log.warn('Could not fetch preview for URL:', originalUrl, e.message);
    }

    const shortUrlDoc: Partial<ShortUrl> = {
      id: shortCode,
      userId: userId || 'anonymous',
      workspaceId: effectiveWorkspaceId,
      originalUrl: originalUrl,
      shortCode: shortCode,
      customAlias: customAlias ? shortCode : null,
      tags: tags || [],
      createdAt: Timestamp.now() as any,
      isActive: true,
      passwordProtected: false,
      clickCount: 0,
      source: source,
      campaign: campaign || null,
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

    // Update global statistics
    try {
      const statsRef = this.firebase.db.doc('stats/global');
      await statsRef.set({ totalUrlsShortened: FieldValue.increment(1) }, { merge: true });
    } catch (e) {
      log.error('Failed to update global stats:', e);
    }

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

    if (workspaceId && !isPersonalWorkspace(workspaceId)) {
      // Team workspace: strict filter by workspaceId
      query = query.where('workspaceId', '==', workspaceId);
    } else {
      // Personal or Anonymous: filter by user and their personal scopes
      const uid = userId || 'anonymous';
      const personalIds = userId ? [`personal_${userId}`, 'personal', null] : ['personal', null];
      
      query = query.where('userId', '==', uid)
                   .where('workspaceId', 'in', personalIds);
    }

    const querySnapshot = await query.limit(1).get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return doc.data() as ShortUrl;
  }

  async getWorkspaceLinks(workspaceId: string): Promise<ShortUrl[]> {
    console.log(`[ShortenUrlService] getWorkspaceLinks for workspaceId: ${workspaceId}`);
    
    // For personal workspaces, we want to include legacy links (null/personal) 
    // but ONLY those belonging to the owner of that workspace.
    const isPersonal = isPersonalWorkspace(workspaceId);
    let query;

    if (isPersonal) {
      const ownerId = workspaceId.replace('personal_', '');
      const personalIds = [workspaceId, 'personal', null];
      
      query = this.firebase.db
        .collection('shortUrls')
        .where('workspaceId', 'in', personalIds)
        .where('userId', '==', ownerId);
    } else {
      query = this.firebase.db
        .collection('shortUrls')
        .where('workspaceId', '==', workspaceId);
    }

    const querySnapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortUrl));
    console.log(`[ShortenUrlService] Found ${links.length} links for workspace ${workspaceId}`);
    return links;
  }

  async getUserPersonalLinks(userId: string): Promise<ShortUrl[]> {
    const personalIds = [`personal_${userId}`, 'personal', null];
    console.log(`[ShortenUrlService] getUserPersonalLinks for user: ${userId}, matching IDs:`, personalIds);

    const querySnapshot = await this.firebase.db
      .collection('shortUrls')
      .where('workspaceId', 'in', personalIds)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortUrl));
    console.log(`[ShortenUrlService] Found ${links.length} personal links for user ${userId}`);
    return links;
  }

  async getShortUrl(shortCode: string): Promise<ShortUrl | null> {
    const doc = await this.firebase.db.doc(`shortUrls/${shortCode}`).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ShortUrl;
  }

  async updateShortUrl(shortCode: string, updates: Partial<ShortUrl>): Promise<void> {
    const docRef = this.firebase.db.doc(`shortUrls/${shortCode}`);
    const current = await this.getShortUrl(shortCode);
    
    await docRef.update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    if (this.redisService) {
      await this.redisService.del(`url:${shortCode}`);
      if (current?.customAlias) await this.redisService.del(`url:${current.customAlias}`);
      if (updates.customAlias) await this.redisService.del(`url:${updates.customAlias}`);
    }
  }

  async deleteShortUrl(shortCode: string): Promise<void> {
    const current = await this.getShortUrl(shortCode);
    await this.firebase.db.doc(`shortUrls/${shortCode}`).delete();

    if (this.redisService) {
      await this.redisService.del(`url:${shortCode}`);
      if (current?.customAlias) await this.redisService.del(`url:${current.customAlias}`);
    }
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

    if (workspaceId && !isPersonalWorkspace(workspaceId)) {
      const workspaceRef = this.firebase.db.doc(`workspaces/${workspaceId}`);
      await workspaceRef.update({
        totalUrls: FieldValue.increment(1),
      });
    }
  }
}
