import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { RedisService } from './redis.service';
import { validateSafeUrl } from '../utils/ssrf.utils';

export interface UrlPreview {
  title: string;
  description: string;
  thumbnailUrl: string;
  site: string;
  favicon: string;
}

@Injectable()
export class LongUrlPreviewService {
  private readonly logger = new Logger(LongUrlPreviewService.name);
  private readonly TTL = 60 * 60; // 1 hour

  constructor(private redisService: RedisService) {}

  async getPreview(longUrl: string): Promise<UrlPreview> {
    try {
      const cached = await this.redisService.get(`preview:${longUrl}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis failover - proceed to fetch
    }

    const preview = await this.fetchPreview(longUrl);

    try {
      await this.redisService.set(`preview:${longUrl}`, JSON.stringify(preview), this.TTL);
    } catch {
      // Non-fatal cache failure
    }

    return preview;
  }

  private async fetchPreview(url: string): Promise<UrlPreview> {
    const fallback: UrlPreview = {
      title: '',
      description: '',
      thumbnailUrl: '',
      site: '',
      favicon: '/favicon.ico',
    };

    try {
      // 1. SSRF & Protocol Validation
      const parsedUrl = await validateSafeUrl(url);
      fallback.site = parsedUrl.hostname;

      // 2. Timeout-bounded fetch with 4-second cutoff
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(parsedUrl.href, {
        signal: controller.signal as any,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; iNNkieBot/1.0; +https://innkie.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
        size: 1024 * 1024 * 2, // Max 2MB to prevent memory exhaustion
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return fallback;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const getMeta = (name: string): string | undefined =>
        $(`meta[property='og:${name}']`).attr('content') ||
        $(`meta[name='${name}']`).attr('content');

      const getFavicon = (): string => {
        try {
          const favicon =
            $('link[rel="icon"]').attr('href') ||
            $('link[rel="shortcut icon"]').attr('href') ||
            '/favicon.ico';
          return new URL(favicon, parsedUrl.href).href;
        } catch {
          return `${parsedUrl.origin}/favicon.ico`;
        }
      };

      return {
        title: getMeta('title') || $('title').text() || '',
        description: getMeta('description') || '',
        thumbnailUrl: getMeta('image') || '',
        site: getMeta('site_name') || parsedUrl.hostname,
        favicon: getFavicon(),
      };
    } catch (error: any) {
      this.logger.warn(`Preview fetch failed for ${url}: ${error.message}`);
      return fallback;
    }
  }
}
