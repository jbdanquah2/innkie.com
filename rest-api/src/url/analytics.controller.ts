import { Controller, Get, Param, Query, BadRequestException, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '../utils/workspace.utils';
import { WorkspaceService } from '../workspace/workspace.service';
import { ShortenUrlService } from '../services/shorten-url.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly workspaceService: WorkspaceService,
    private readonly shortenUrlService: ShortenUrlService,
  ) {}

  @Get(':shortCode/clicks')
  @UseGuards(FirebaseAuthGuard)
  async getClicksOverTime(
    @Param('shortCode') shortCode: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    const dayCount = days ? parseInt(days, 10) : 7;
    if (isNaN(dayCount) || dayCount <= 0) {
      throw new BadRequestException('Invalid day count');
    }

    const link = await this.shortenUrlService.getShortUrl(shortCode);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    if (link.workspaceId === `personal_${userId}` || link.workspaceId === 'personal') {
      // Owner of personal space
    } else {
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId!, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this link analytics');
      }
    }

    return this.analyticsService.getClicksOverTime(shortCode, dayCount);
  }

  @Get(':shortCode/visitors')
  @UseGuards(FirebaseAuthGuard)
  async getLinkVisitors(
    @Param('shortCode') shortCode: string,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    const link = await this.shortenUrlService.getShortUrl(shortCode);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    if (link.workspaceId === `personal_${userId}` || link.workspaceId === 'personal') {
      // Owner
    } else {
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId!, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this link visitor data');
      }
    }

    return this.analyticsService.getLinkVisitors(shortCode);
  }

  @Get('workspace/:workspaceId')
  @UseGuards(FirebaseAuthGuard)
  async getWorkspaceClicks(
    @Param('workspaceId') workspaceId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    const dayCount = days ? parseInt(days, 10) : 7;
    
    // If it's the user's OWN personal workspace, we use the personal stats logic
    if (workspaceId === `personal_${userId}` || workspaceId === 'personal' || !workspaceId) {
      return this.analyticsService.getPersonalClicksOverTime(userId, dayCount);
    }

    const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace analytics');
    }
    
    return this.analyticsService.getWorkspaceClicksOverTime(workspaceId, dayCount);
  }

  @Get('workspace/:workspaceId/campaign/:tag')
  @UseGuards(FirebaseAuthGuard)
  async getCampaignClicks(
    @Param('workspaceId') workspaceId: string,
    @Param('tag') tag: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    const dayCount = days ? parseInt(days, 10) : 7;

    if (workspaceId !== `personal_${userId}` && workspaceId !== 'personal' && workspaceId) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this workspace analytics');
      }
    }

    return this.analyticsService.getCampaignClicksOverTime(workspaceId, tag, dayCount);
  }

  @Get('workspace/:workspaceId/stats')
  @UseGuards(FirebaseAuthGuard)
  async getWorkspaceVisitorStats(
    @Param('workspaceId') workspaceId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    const dayCount = days ? parseInt(days, 10) : 7;

    if (workspaceId !== `personal_${userId}` && workspaceId !== 'personal' && workspaceId) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this workspace visitor stats');
      }
    }

    return this.analyticsService.getWorkspaceVisitorStats(workspaceId, dayCount);
  }
}
