import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('api/v1')
export class PublicApiController {
  constructor(private readonly shortenUrlService: ShortenUrlService) {}

  @Post('links')
  @UseGuards(ApiKeyGuard)
  async shorten(@Body('url') url: string, @Req() req: any) {
    const workspace = req.workspace;
    return this.shortenUrlService.createShortUrl(url, workspace.ownerId, workspace.id, 'api');
  }
}
