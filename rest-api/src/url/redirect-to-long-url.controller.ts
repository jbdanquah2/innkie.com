import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import {FirebaseService} from '../services/firebase.service';
import * as log from 'loglevel';
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import { UAParser } from 'ua-parser-js';
import { hashPassword } from '../utils/url.utils';
import { ShortUrl } from '../models/short-url.model';
import { AnalyticsService } from '../services/analytics.service';
import { GeoIpService } from '../services/geoip.service';




interface Location {
  country: string;
  city: string;
  updatedAt: number; // timestamp for cache expiration
}

@Controller('api')
export class RedirectToLongUrlController {
  constructor(
    private firebase: FirebaseService,
    private analyticsService: AnalyticsService,
    private geoIpService: GeoIpService
  ) {}

  @Post('redirect-url')
  async redirectToLongUrl(@Req() req: any, @Res() res: any) {

    const enteredPassword = req.body?.password;
    let shortCode = req.body?.shortCode;

    log.debug('Called redirectToLongUrl with shortCode:', shortCode);

    if (!shortCode) {
      return res.status(400).send('Short URL not found');
    }

    log.debug('...shortCode##', shortCode);


    let shortUrlRef: FirebaseFirestore.DocumentReference;
    let shortUrlSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;

    try {

      if (shortCode.length === 6) {

        shortUrlRef = this.firebase.db.doc(`shortUrls/${shortCode}`);
        shortUrlSnapshot = await shortUrlRef.get();

      } else {

        const querySnap = await this.firebase.db
          .collection(`shortUrls`)
          .where('customAlias', "==", shortCode)
          .get()

        shortUrlSnapshot = querySnap.docs[0];
        shortUrlRef = shortUrlSnapshot.ref;

      }

      console.log('shortUrlSnapshot##', shortUrlSnapshot);

      const shortUrlData: ShortUrl  = shortUrlSnapshot.data() as ShortUrl;

      if (!shortUrlData) {
        log.debug('URL is invalid or has been deleted.');
        return res.status(404).json({
          redirect: false,
          shortCode,
          originalUrl: null,
          message: 'URL is invalid or has been deleted.'
        })
      }

      shortCode = shortUrlData.shortCode; // ensure shortCode is always set to the correct code

      if (shortUrlData?.isActive === false) {// if the URL is set to inactive, return immediately
        return res.status(410).json({
          redirect: false,
          shortCode,
          originalUrl: null,
          message: 'This URL is longer active.'
        });
      }

      log.debug('...shortUrlData##', shortUrlData);

      const passwordProtected = shortUrlData?.passwordProtected

      if (passwordProtected) {// check if the password entered is correct

        const result =   hashPassword(enteredPassword, shortUrlData?.passwordSalt);

        log.debug('enteredPassword', enteredPassword)
        log.debug('...result##', result);
        log.debug('...shortUrlData?.passwordHash##', shortUrlData?.password);
        log.debug('...shortUrlData?.passwordSalt##', shortUrlData?.passwordSalt);

        if (result !== shortUrlData?.password) {

          return res.status(200).json({
            redirect: false,
            shortCode,
            originalUrl: null,
            message: "Password is invalid"
          });
        }
      }

      if (!this.checkUrlStatus(shortUrlData)) { // check if the URL is still active

        return res.status(200).json({
          redirect: false,
          shortCode,
          originalUrl: null,
          message: "URL is disabled or inactive"
        });
      }

      const userAgent = req.headers['user-agent'];
      const deviceType = this.getDeviceType(userAgent);
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const uniqueVisitorData = await this.checkVisitorIsUnique(ipAddress, shortCode);

      const parser = new UAParser(userAgent);
      const ua = parser.getResult();
      const browser = ua.browser.name || 'Unknown';

      log.debug('User Agent:', userAgent);
      log.debug('Device Type:', deviceType);
      log.debug('IP Address:', ipAddress);
      log.debug('Unique Visitor Data:', uniqueVisitorData);

      const geoLocation = await this.retrieveLocationFromIP(ipAddress, uniqueVisitorData);

      const data = {
        shortCode,
        ipAddress,
        userAgents: browser ? FieldValue.arrayUnion(browser) : [],
        deviceType: FieldValue.arrayUnion(deviceType),
        country: geoLocation?.country,
        city: geoLocation?.city,
      }

      if (uniqueVisitorData.length === 0) {

        if(geoLocation) {
          Object.assign(data, {
            firstVisitAt: Timestamp.now(),
            lastVisitAt: Timestamp.now(),
            visitCount: 1
          });
        }

        await this.logUniqueVisitor(ipAddress, shortCode, data);

      } else {

        Object.assign(data, {
          lastVisitAt: Timestamp.now(),
          visitCount: FieldValue.increment(1)
        })
      }

      log.debug('Updating unique visitor data', data);

      // no need to await it
      this.updateUniqueVisitor(ipAddress, shortCode, data);

      // Log click for time-series analytics
      this.analyticsService.logClick({
        id: shortCode,
        shortUrlId: shortUrlData.id,
        timestamp: new Date(),
        ipAddress,
        country: geoLocation?.country,
        city: geoLocation?.city,
        referrer: req.headers['referer'] || 'Direct',
        userAgent,
        deviceType
      });

      const deviceStats = shortUrlData?.deviceStats || { desktop: 0, mobile: 0, tablet: 0 };

      deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;

      // Increment click count: no need to await it
      shortUrlRef.update({
        clickCount: FieldValue.increment(1),
        deviceStats: deviceStats,
        uniqueClicks: uniqueVisitorData.length === 0 ? FieldValue.increment(1) : FieldValue.increment(0),
        lastClickedAt: Timestamp.now()
      });

      log.debug('Redirecting to original URL:', shortUrlData.originalUrl);

      return res.status(200).json({
        redirect: true,
        shortCode,
        originalUrl: shortUrlData.originalUrl,
        message: "success"
      });

    } catch (error) {

        log.error('An error occurred in redirectToLongUrl:', error);

        res.status(500).json({
          redirect: false,
          shortCode,
          message: error.message,
          originalUrl: null,
        })
    }

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
