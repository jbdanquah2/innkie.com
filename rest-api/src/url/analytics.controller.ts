import { Controller, Get, Param, Query, BadRequestException, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '@innkie/shared-models';
import { WorkspaceService } from '../workspace/workspace.service';
import { ShortenUrlService } from '../services/shorten-url.service';
import { maskIp } from '../utils/ip-mask.util';

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
      // User is the owner of this personal space
    } else if (link.workspaceId) {
      // Verify access to the team/shared workspace
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this link analytics');
      }
    } else {
      // Legacy link with no workspaceId - fall back to ownership check
      if (link.userId !== userId) {
        throw new ForbiddenException('You do not own this legacy link');
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

    // Anyone with access to the link can see where and on what its visitors came from, but full IP addresses are for
    // the owner and admins only. Everyone else gets shortened addresses.
    let canSeeIp = false;
    if (link.workspaceId === `personal_${userId}` || link.workspaceId === 'personal') {
      canSeeIp = true; // owner of their personal workspace
    } else if (link.workspaceId) {
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this link visitor data');
      }
      canSeeIp = await this.workspaceService.verifyAccess(link.workspaceId, userId, ['admin']);
    } else {
      // Legacy link
      if (link.userId !== userId) {
        throw new ForbiddenException('You do not own this legacy link');
      }
      canSeeIp = true;
    }

    const visitors = await this.analyticsService.getLinkVisitors(shortCode);
    if (canSeeIp) return visitors;
    // The document id is "<ip>_<shortCode>", so it goes too.
    return visitors.map(({ id: _id, ...v }: any) => ({ ...v, ipAddress: maskIp(v.ipAddress) }));

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
