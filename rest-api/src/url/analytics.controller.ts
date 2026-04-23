import { Controller, Get, Param, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '../utils/workspace.utils';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':shortCode/clicks')
  async getClicksOverTime(
    @Param('shortCode') shortCode: string,
    @Query('days') days: string
  ) {
    const dayCount = days ? parseInt(days, 10) : 7;
    if (isNaN(dayCount) || dayCount <= 0) {
      throw new BadRequestException('Invalid day count');
    }

    return this.analyticsService.getClicksOverTime(shortCode, dayCount);
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
    
    if (isPersonalWorkspace(workspaceId)) {
      return this.analyticsService.getPersonalClicksOverTime(userId, dayCount);
    }
    
    return this.analyticsService.getWorkspaceClicksOverTime(workspaceId, dayCount);
  }

  @Get('workspace/:workspaceId/campaign/:tag')
  @UseGuards(FirebaseAuthGuard)
  async getCampaignClicks(
    @Param('workspaceId') workspaceId: string,
    @Param('tag') tag: string,
    @Query('days') days: string
  ) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getCampaignClicksOverTime(workspaceId, tag, dayCount);
  }

  @Get('workspace/:workspaceId/stats')
  @UseGuards(FirebaseAuthGuard)
  async getWorkspaceVisitorStats(
    @Param('workspaceId') workspaceId: string,
    @Query('days') days: string,
    @Req() req: any
  ) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getWorkspaceVisitorStats(workspaceId, dayCount, req.user.uid);
  }
}
