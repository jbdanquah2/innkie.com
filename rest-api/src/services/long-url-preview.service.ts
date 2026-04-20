import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { RedisService } from './redis.service';

@Injectable()
export class LongUrlPreviewService {

  private TTL = 60 * 60; // 1 hour

  constructor(private redisService: RedisService) {}

  async getPreview(longUrl: string) {

    const cached = await this.redisService.get(`preview:${longUrl}`);
    if (cached) return JSON.parse(cached);

    const preview = await this.fetchPreview(longUrl);

    await this.redisService.set(`preview:${longUrl}`, JSON.stringify(preview), this.TTL);

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
      thumbnailUrl: getMeta('image') || '',
      site: getMeta('site_name') || new URL(url).hostname,
      favicon: getFavicon(),
    };
  }
}
