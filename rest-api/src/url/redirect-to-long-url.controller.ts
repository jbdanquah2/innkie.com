import {BadRequestException, Controller, Get, NotFoundException, Param, Req, Res,} from '@nestjs/common';
import {FirebaseService} from '../services/firebase.service';
import * as log from 'loglevel';
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import { UAParser } from 'ua-parser-js';




interface Location {
  country: string;
  city: string;
  updatedAt: number; // timestamp for cache expiration
}

@Controller('api')
export class RedirectToLongUrlController {

  constructor(private firebase: FirebaseService) {

  }

  @Get('redirect-url')
  async redirectToLongUrl(@Req() req: any, @Res() res: any) {

    const passwordProtected = req.body?.passwordProtected;
    const shortCode = req.params?.shortCode;

    log.debug('Called redirectToLongUrl with shortCode:', shortCode);

    if (!shortCode) {
      return res.status(400).send('Short URL not found');
    }
    log.debug('...shortCode##', shortCode);

    if (passwordProtected) {
        return res.status(403).json({
          shortCode,
          passwordProtected: true,
          message: 'This URL is password protected. Please provide the password to access this URL.'
        });
    }

    try {

      const shortUrlRef = this.firebase.db.doc(`shortUrls/${shortCode}`);
      const shortUrlSnapshot = await shortUrlRef.get();

      if (!shortUrlSnapshot.exists) {
        res.status(404).json({
          shortCode,
          message: 'URL not found'
        });
      }

      const shortUrlData = shortUrlSnapshot.data();

      if (!shortUrlData) {
        log.debug('URL is invalid or has been deleted.');
        return res.status(404).json({
            shortCode,
            message: 'URL is invalid or has been deleted.'
        })
      }

      log.debug('...shortUrlData##', shortUrlData);

      if (shortUrlData?.isActive === false) {
        return res.status(410).json({
          shortCode,
            message: 'This URL is longer active.'
        });
      }

      const now = new Date();
      if (shortUrlData?.expiryDate?.toDate() < now) {

        // TODO: Optionally, you can set isActive to false here
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

      const data = {
        shortCode,
        ipAddress,
        userAgents: browser ? FieldValue.arrayUnion(browser) : [],
        deviceType: FieldValue.arrayUnion(deviceType),
      }

      if (uniqueVisitorData.length === 0) {
        const geoLocation = await this.retrieveLocationFromIP(ipAddress, uniqueVisitorData);

        if(geoLocation) {
          Object.assign(data, {
            country: geoLocation?.country,
            city: geoLocation?.city,
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

        log.debug('Updating unique visitor data', data);

        await this.updateUniqueVisitor(ipAddress, shortCode, data);

      }

      const deviceStats = shortUrlData?.deviceStats || { desktop: 0, mobile: 0, tablet: 0 };

      deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;

      // Increment click count
      await shortUrlRef.update({
        clickCount: FieldValue.increment(1),
        deviceStats: deviceStats,
        uniqueClicks: uniqueVisitorData.length === 0 ? FieldValue.increment(1) : FieldValue.increment(0),
        lastClickedAt: Timestamp.now()
      });

      log.debug('Redirecting to original URL:', shortUrlData.originalUrl);

      return res.redirect(shortUrlData.originalUrl);

    } catch (error) {

        log.error('An error occurred in redirectToLongUrl:', error);

        if (error instanceof NotFoundException) {
            throw error;
        }
        throw new BadRequestException('Failed to process the request');
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
    const uniqueVisitorRef = this.firebase.db.doc(`uniqueVisitors/${ipAddress}_${shortCode}`);
    const snap = await uniqueVisitorRef.get();

    return snap.data() ? [snap.data()] : [];
  }

  async logUniqueVisitor(ipAddress: string,shortCode: string, data: any) {
    const uniqueVisitorRef = this.firebase.db.doc(`uniqueVisitors/${ipAddress}_${shortCode}`);

    await uniqueVisitorRef.set({
      ...data
    })
  }

  async updateUniqueVisitor(ipAddress: string, shortCode: string, updates: any) {
    const docRef = this.firebase.db.doc(`uniqueVisitors/${ipAddress}_${shortCode}`);
    await docRef.update({
        ...updates
    });
  }

  async retrieveLocationFromIP(ipAddress: string, uniqueVisitorData: any): Promise<{ country: string; city: string } | null> {

    /** not relevant for now as there another check in redirectToLongUrl
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

    console.log('uniqueVisitorData::', uniqueVisitorData);

    if (uniqueVisitorData.length > 0) {// check if country and city are present and not expired

      console.log('Cached data found for IP:', ipAddress);
      console.log('checking cache validity...');

      const cachedData = uniqueVisitorData;
      const isExpired = !cachedData?.lastVisitAt || Date.now() - cachedData.lastVisitAt.toMillis() > CACHE_TTL_MS;

      if (!isExpired) {
        console.log('Using cached geo-IP data:', cachedData);
        return { country: cachedData.country, city: cachedData.city };
      }

        console.log('Cache expired, fetching new geo-IP data...');
    }
     **/

    try {// else fetch from geo-IP service

      ipAddress = this.normalizeIp(ipAddress); // just for localhost testing
      if (!this.isPublicIp(ipAddress)) {

        log.debug('Fetching geo-IP data for IP:', ipAddress);
        return {
          country: 'Ghana',
          city: 'Accra'
        };
      }

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
}
