import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {FirebaseService} from '../services/firebase.service';
import * as log from 'loglevel';
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import { UAParser } from 'ua-parser-js';
import { hashPassword } from '../utils/url.utils';
import { ShortUrl } from '@innkie/shared-models';
import { AnalyticsService } from '../services/analytics.service';
import { GeoIpService } from '../services/geoip.service';
import { RedisService } from '../services/redis.service';
import { WebhookDispatcherService } from '../services/webhook-dispatcher.service';
import { isPersonalWorkspace } from '../utils/workspace.utils';




interface Location {
  country: string;
  city: string;
  updatedAt: number; // timestamp for cache expiration
}

@Controller()
export class RedirectToLongUrlController {
  constructor(
    private firebase: FirebaseService,
    private analyticsService: AnalyticsService,
    private geoIpService: GeoIpService,
    private redisService: RedisService,
    private configService: ConfigService,
    private readonly webhookDispatcher: WebhookDispatcherService
  ) {}

  @Get(':shortCode')
  async handleDirectRedirect(@Param('shortCode') shortCode: string, @Req() req: any, @Res() res: any) {
    // 1. Skip if it's a reserved system path or a file
    const reserved = [
      'api', 'dashboard', 'home', 'admin', 'login', 'logout', 'signin', 'signup', 'register',
      'profile', 'settings', 'account', 'user', 'users', 'me', 'my', 'auth',
      'system', 'config', 'docs', 'swagger', 'graphql', 'rest', 'v1', 'v2', 'api-docs',
      'about', 'contact', 'help', 'support', 'faq', 'privacy', 'terms', 'redirect',
      '404', '500', 'error', 'maintenance', 'offline', 'manage', 'console',
      'qr-studio', 'campaign-hub', 'developer-api', 'links', 'analytics'
    ];

    if (reserved.includes(shortCode.toLowerCase()) || shortCode.includes('.')) {
      return res.status(404).send('Not Found');
    }

    try {
      const result: any = await this.performRedirectionLogic(shortCode, null, req);
      
      const isProduction = this.configService.get<string>('PRODUCTION', 'false').toLowerCase() === 'true';
      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost').replace(/^https?:\/\//, '');
      const protocol = isProduction ? 'https://' : 'http://';
      const appUrl = isProduction ? `${protocol}${baseUrl}` : `${protocol}${baseUrl}:${this.configService.get<number>('BASE_PORT', 4200)}`;

      if (result.redirect) {
        return res.redirect(302, result.originalUrl);
      }

      if (result.message === "Password is required" || result.message === "Password is invalid") {
        return res.redirect(302, `${appUrl}/${shortCode}?pw=true`);
      }

      return res.redirect(302, `${appUrl}/404`);
    } catch (error) {
      log.error('Direct redirect failed:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  @Post('api/redirect-url')
  async redirectToLongUrl(@Req() req: any, @Res() res: any) {
    const enteredPassword = req.body?.password;
    const shortCode = req.body?.shortCode;

    if (!shortCode) {
      return res.status(400).json({ redirect: false, message: 'Short URL not found' });
    }

    try {
      const result = await this.performRedirectionLogic(shortCode, enteredPassword, req);
      return res.status(200).json(result);
    } catch (error) {
      log.error('API redirect failed:', error);
      return res.status(500).json({ redirect: false, message: error.message });
    }
  }

  private async performRedirectionLogic(shortCode: string, enteredPassword: string | null, req: any) {
    log.debug('Performing redirection logic for:', shortCode);

    let shortUrlData: ShortUrl | null = null;
    let shortUrlRef: FirebaseFirestore.DocumentReference;

    // Try Redis first
    const cachedData = await this.redisService.get(`url:${shortCode}`);
    if (cachedData) {
      shortUrlData = JSON.parse(cachedData);
      shortUrlRef = this.firebase.db.doc(`shortUrls/${shortUrlData?.shortCode}`);
    } else {
      let shortUrlSnapshot: any;
      if (shortCode.length === 6) {
        shortUrlRef = this.firebase.db.doc(`shortUrls/${shortCode}`);
        shortUrlSnapshot = await shortUrlRef.get();
      } else {
        const querySnap = await this.firebase.db.collection(`shortUrls`).where('customAlias', "==", shortCode).get();
        shortUrlSnapshot = querySnap.docs[0];
        shortUrlRef = shortUrlSnapshot?.ref;
      }

      if (shortUrlSnapshot?.exists) {
        shortUrlData = shortUrlSnapshot.data() as ShortUrl;
        await this.redisService.set(`url:${shortCode}`, JSON.stringify(shortUrlData), 3600);
      }
    }

    if (!shortUrlData) {
      return { redirect: false, shortCode, message: 'URL is invalid or has been deleted.' };
    }

    if (shortUrlData.isActive === false) {
      return { redirect: false, shortCode, message: 'This URL is no longer active.' };
    }

    if (shortUrlData.passwordProtected) {
      if (!enteredPassword) {
        return { redirect: false, shortCode, message: 'Password is required' };
      }
      const hashed = hashPassword(enteredPassword, shortUrlData.passwordSalt ?? '');
      if (hashed !== shortUrlData.password) {
        return { redirect: false, shortCode, message: 'Password is invalid' };
      }
    }

    if (!this.checkUrlStatus(shortUrlData)) {
      return { redirect: false, shortCode, message: 'URL is disabled or inactive' };
    }

    // Process Analytics
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = this.getDeviceType(userAgent);
    const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').toString().split(',')[0].trim();
    const uniqueVisitorData = await this.checkVisitorIsUnique(ipAddress, shortCode);

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const geoLocation = await this.retrieveLocationFromIP(ipAddress, uniqueVisitorData);

    const analyticsData = {
      shortCode,
      ipAddress,
      userAgents: browser ? FieldValue.arrayUnion(browser) : [],
      deviceType: FieldValue.arrayUnion(deviceType),
      country: geoLocation?.country,
      city: geoLocation?.city,
      lastVisitAt: Timestamp.now(),
    };

    if (uniqueVisitorData.length === 0) {
      Object.assign(analyticsData, { firstVisitAt: Timestamp.now(), visitCount: 1 });
      await this.logUniqueVisitor(ipAddress, shortCode, analyticsData);
    } else {
      Object.assign(analyticsData, { visitCount: FieldValue.increment(1) });
      this.updateUniqueVisitor(ipAddress, shortCode, analyticsData);
    }

    this.analyticsService.logClick({
      id: shortCode,
      shortUrlId: shortUrlData.id,
      workspaceId: shortUrlData.workspaceId,
      userId: shortUrlData.userId,
      tags: shortUrlData.tags || [],
      timestamp: new Date(),
      ipAddress,
      country: geoLocation?.country,
      city: geoLocation?.city,
      referrer: req.headers['referer'] || 'Direct',
      userAgent,
      deviceType,
      browser
    });

    const deviceStats = shortUrlData.deviceStats || { desktop: 0, mobile: 0, tablet: 0 };
    deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;

    shortUrlRef.update({
      clickCount: FieldValue.increment(1),
      deviceStats: deviceStats,
      uniqueClicks: uniqueVisitorData.length === 0 ? FieldValue.increment(1) : FieldValue.increment(0),
      lastClickedAt: Timestamp.now()
    });

    if (this.webhookDispatcher) {
      this.webhookDispatcher.dispatch(shortUrlData.workspaceId || 'personal', 'link.clicked', {
        shortCode,
        originalUrl: shortUrlData.originalUrl,
        timestamp: new Date().toISOString(),
        ipAddress,
        country: geoLocation?.country,
        city: geoLocation?.city,
        referrer: req.headers['referer'] || 'Direct',
        deviceType
      });
    }

    if (shortUrlData.workspaceId && !isPersonalWorkspace(shortUrlData.workspaceId)) {
      this.firebase.db.doc(`workspaces/${shortUrlData.workspaceId}`).update({
        totalClicks: FieldValue.increment(1)
      }).catch(err => log.error('Failed to increment workspace clicks', err));
    }

    return { redirect: true, shortCode, originalUrl: shortUrlData.originalUrl, message: 'success' };
  }

  getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const ua = userAgent.toLowerCase();
    if (/mobile|iphone|android(?!.*tablet)/.test(ua)) return 'mobile';
    if (/ipad|tablet|android.*tablet/.test(ua)) return 'tablet';
    return 'desktop';
  }

  // Check if the visitor is unique based on IP address and short URL code
  async checkVisitorIsUnique(ipAddress: string, shortCode: string): Promise<any> {
    const uniqueVisitorRef = this.firebase.db
      .doc(`uniqueVisitors/${ipAddress}_${shortCode}`);
    const snap = await uniqueVisitorRef.get();

    return snap.data() ? [snap.data()] : [];
  }

  async logUniqueVisitor(ipAddress: string,shortCode: string, data: any) {
    const uniqueVisitorRef = this.firebase.db
      .doc(`uniqueVisitors/${ipAddress}_${shortCode}`);

    await uniqueVisitorRef.set({
      ...data
    })
  }

  async updateUniqueVisitor(ipAddress: string, shortCode: string, updates: any) {
    const docRef = this.firebase.db
      .doc(`uniqueVisitors/${ipAddress}_${shortCode}`);
    await docRef.update({
        ...updates
    });
  }

  async retrieveLocationFromIP(ipAddress: string, uniqueVisitorData: any): Promise<{ country: string; city: string } | null> {

    try {
      ipAddress = this.normalizeIp(ipAddress); // just for localhost testing

      // 1. Try Local MaxMind Lookup (Instant)
      const localLocation = this.geoIpService.getLocation(ipAddress);
      if (localLocation) {
        log.debug('✅ Geo-IP: Local match found:', localLocation);
        return localLocation;
      }

      // 2. Mock for localhost
      if (!this.isPublicIp(ipAddress)) {
        log.debug('Geo-IP: Localhost fallback for IP:', ipAddress);
        return {
          country: 'Ghana',
          city: 'Accra'
        };
      }

      // 3. Fallback to External API
      log.debug('📡 Geo-IP: Local match failed, calling external API for:', ipAddress);
      const geoIpApiUrl = `https://ipapi.co/${ipAddress}/json/`;
      const response = await fetch(geoIpApiUrl);

      if (!response.ok) {
        console.error(`Geo-IP lookup failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      log.debug('Geo-IP data:', data);

      return {
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown'
      };

    } catch (error) {
      log.error('Error fetching geo-IP data:', error);
      return null;
    }
  }

  isPublicIp(ipAddress: string) {
    return !ipAddress.startsWith('127.')
        && !ipAddress.startsWith('10.')
        && !ipAddress.startsWith('192.168.')
        && !ipAddress.startsWith('172.');
  }

  normalizeIp(ip: string) {
    // Convert "::ffff:127.0.0.1" → "127.0.0.1"
    if (ip.startsWith("::ffff:")) {
      return ip.split(":").pop()!;
    }
    return ip;
  }

  checkUrlStatus(shortUrlData: Partial<ShortUrl>) {

    let isAllowed = true

    if (!shortUrlData.isActive) {
      isAllowed = false;
    }

    if (shortUrlData?.expiration) {
      if (shortUrlData.expiration.mode == "oneTime") {
        if (shortUrlData.expiration.maxClicks && shortUrlData.expiration.maxClicks >= ((shortUrlData.clickCount) as number)) {
          isAllowed = false;
        }

      } else if (shortUrlData.expiration.mode == "duration") {

        const now = new Date();
        const createdAt = shortUrlData.createdAt?.toDate()

        if (shortUrlData.expiration.durationUnit == "hours" && shortUrlData.expiration.durationValue) {

          const diffHours = this.calcNumberOfHours(now, createdAt!)

          if (diffHours >= shortUrlData.expiration.durationValue) {
            isAllowed = false;
          }
        } else if (shortUrlData.expiration.durationUnit == "days" && shortUrlData.expiration.durationValue) {

          const diffDays = this.calcNumberOfDays(now, createdAt!)
          if (diffDays >= shortUrlData.expiration.durationValue) {
            isAllowed = false;
          }
        }
      }
    }

    return isAllowed;
  }

  calcNumberOfHours(now: Date, createdAt: Date) {

    const diffMs = now.getTime() - createdAt.getTime(); // difference in ms
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // convert to hours

    console.log("Hours elapsed:", diffHours);

    return diffHours;
  }

  calcNumberOfDays(now:Date, createdAt:Date) {

    const diffMs = now.getTime() - createdAt.getTime(); // difference in ms

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    console.log("Days elapsed:", diffDays);

    return diffDays;
  }
}
