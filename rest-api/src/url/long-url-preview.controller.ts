import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LongUrlPreviewService } from '../services/long-url-preview.service';
import * as log from 'loglevel';

@Controller('api')
export class LongUrlPreviewController {
  constructor(private longUrlPreviewService: LongUrlPreviewService) {}

  @Get('preview-url')
  async getPreview(@Query('longUrl') longUrl: string) {

    log.debug('Called getPreview with longUrl:', longUrl);

    if (!longUrl) {
      throw new BadRequestException('URL is required');
    }

    log.debug('...longUrl:', longUrl);

    return this.longUrlPreviewService.getPreview(longUrl);
  }
}
