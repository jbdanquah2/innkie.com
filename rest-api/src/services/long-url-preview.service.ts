import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import Redis from 'ioredis';

@Injectable()
export class LongUrlPreviewService {

  private redis: Redis | null = null;
  private memoryCache = new Map<string, any>();
  private TTL = 60 * 60; // 1 hour

  constructor() {
    // try {
    //
    //   this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    // } catch (e) {
    //   console.warn('Redis not available, using in-memory cache');
    //   this.redis = null;
    // }
  }

  async getPreview(longUrl: string) {

    // if (this.redis) {
    //   const cached = await this.redis.get(`preview:${longUrl}`);
    //   if (cached) return JSON.parse(cached);
    // }
    //
    // if (this.memoryCache.has(longUrl)) {
    //   return this.memoryCache.get(longUrl);
    // }

    const preview = await this.fetchPreview(longUrl);

    // if (this.redis) {
    //   await this.redis.setex(`preview:${longUrl}`, this.TTL, JSON.stringify(preview));
    // } else {
    //   this.memoryCache.set(longUrl, preview);
    //   // auto-expire after TTL
    //   setTimeout(() => this.memoryCache.delete(longUrl), this.TTL * 1000);
    // }

    return preview;
  }

  private async fetchPreview(url: string) {
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);

    const getMeta = (name: string): string | undefined =>
      $(`meta[property='og:${name}']`).attr('content') ||
      $(`meta[name='${name}']`).attr('content');

    const getFavicon = (): string => {
      const favicon =
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        '/favicon.ico';
      return new URL(favicon, url).href;
    };

    return {
      title: getMeta('title') || $('title').text(),
      description: getMeta('description') || '',
      thumbnailUrl: getMeta('image') || '/default-thumbnail.png',
      site: getMeta('site_name') || new URL(url).hostname,
      favicon: getFavicon(),
      url,
    };
  }
}
