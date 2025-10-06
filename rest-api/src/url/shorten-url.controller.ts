import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';
import { LongUrlPreviewService } from '../services/long-url-preview.service';

@Controller('api')
export class ShortenUrlController {
  constructor(private readonly shortenUrlService: ShortenUrlService,
              private readonly firebase: FirebaseService) {}

  @Post('shorten-url')
  async shorten(@Body('originalUrl') originalUrl: string, @Body('userId') userId?: string) {

    log.debug('...shortenUrl##', originalUrl);

    if (!originalUrl || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
      return { error: 'Please enter a valid URL starting with http:// or https://' };
    }


    log.debug('...userId##', userId);

    // const user = await this.firebase.getDocData(`users/${userId}`);// allow anonymous users to shorten urls
    // if (userId && !user) {
    //   return {
    //     error: 'Invalid user ID',
    //     shortenedUrl: 'not generated'
    //   };
    // }

    console.log('Received URL to shorten:', originalUrl);
    const result = await this.shortenUrlService.createShortUrl(originalUrl, userId);
    console.log('Result:::', result);

    return result;
  }
}
