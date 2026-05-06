import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PlatformMetricsService } from '../services/platform-metrics.service';
import * as Models from '@innkie/shared-models';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/guards/optional-firebase-auth.guard';

@Controller('api/metrics')
export class PlatformMetricsController {
  constructor(private readonly metricsService: PlatformMetricsService) {}

  @Post('event')
  @UseGuards(OptionalFirebaseAuthGuard)
  async logEvent(@Body() event: Models.PlatformUsageEvent) {
    return this.metricsService.logEvent(event);
  }

  @Get('summary')
  @UseGuards(FirebaseAuthGuard)
  async getSummary(
    @Query('workspaceId') workspaceId: string,
    @Query('days') days: string
  ) {
    const daysNum = parseInt(days, 10) || 30;
    return this.metricsService.getWorkspaceSummary(workspaceId, daysNum);
  }

  @Get('recent')
  async getRecentEvents(
    @Query('workspaceId') workspaceId: string,
    @Query('limit') limit: string
  ) {
    const limitNum = parseInt(limit, 10) || 10;
    return this.metricsService.getRecentEvents(workspaceId, limitNum);
  }
}
