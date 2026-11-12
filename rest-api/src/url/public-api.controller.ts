import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShortenUrlService } from '../services/shorten-url.service';
import { AnalyticsService } from '../services/analytics.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { sanitizeLinkCreate, sanitizeLinkUpdate } from '../utils/link-update.util';
import {
  linkBelongsToWorkspace,
  parseCursor,
  parseDays,
  parsePageSize,
  publicCreateBody,
  toPublicLink,
} from '../utils/public-api.util';

const READ = { default: { limit: 60, ttl: 60000 } };
const WRITE = { default: { limit: 20, ttl: 60000 } };

/**
 * Public API, authenticated with a workspace API key (`x-api-key`). Every operation is scoped to the key's own
 * workspace. DELETE /api/v1/links/:code lives in LinksController because the web app shares that route.
 */
@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(
    private readonly shortenUrlService: ShortenUrlService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private out(link: any) {
    return toPublicLink(link, this.shortenUrlService.URL);
  }

  /** The key's workspace's link, or 404. A link in someone else's workspace is indistinguishable from a missing one. */
  private async ownLink(code: string, req: any) {
    const link = await this.shortenUrlService.getShortUrl(code);
    if (!link || !linkBelongsToWorkspace(link, req.workspace)) throw new NotFoundException('Link not found');
    return link;
  }

  @Throttle(WRITE)
  @Post('links')
  async create(@Body() body: any, @Req() req: any) {
    const ws = req.workspace;
    const input = sanitizeLinkCreate(publicCreateBody(body));
    const result = await this.shortenUrlService.createShortUrl(
      input.originalUrl,
      ws.ownerId,
      ws.id,
      'api',
      input.campaign,
      input.customAlias,
      input.tags,
      { passwordProtected: input.passwordProtected, password: input.password, expiration: input.expiration },
    );
    if (result?.exists) {
      // This URL was already shortened in the workspace: hand back that link instead of creating a duplicate.
      const existing = await this.shortenUrlService.getShortUrl(result.shortCode);
      return { ...this.out(existing), alreadyExisted: true };
    }
    return { ...this.out(result), alreadyExisted: false };
  }

  @Throttle(READ)
  @Get('links')
  async list(@Query('limit') limit: string, @Query('cursor') cursor: string, @Req() req: any) {
    const size = parsePageSize(limit);
    const { links, nextCursor } = await this.shortenUrlService.getWorkspaceLinksPage(req.workspace, size, parseCursor(cursor));
    return { data: links.map((l) => this.out(l)), nextCursor };
  }

  @Throttle(READ)
  @Get('links/:code')
  async get(@Param('code') code: string, @Req() req: any) {
    return this.out(await this.ownLink(code, req));
  }

  @Throttle(WRITE)
  @Patch('links/:code')
  async update(@Param('code') code: string, @Body() body: any, @Req() req: any) {
    await this.ownLink(code, req);
    // The same allow-list the web app uses: title, description, alias, active state, tags, campaign, expiry, password.
    const { updates, newPassword } = sanitizeLinkUpdate(body);
    await this.shortenUrlService.updateShortUrl(code, updates, { newPassword });
    return this.out(await this.ownLink(code, req));
  }

  @Throttle(READ)
  @Get('links/:code/clicks')
  async clicks(@Param('code') code: string, @Query('days') daysParam: string, @Req() req: any) {
    const days = parseDays(daysParam);
    await this.ownLink(code, req);
    const series = await this.analyticsService.getClicksOverTime(code, days);
    return { shortCode: code, days, total: series.reduce((n, p) => n + p.clicks, 0), data: series };
  }
}
