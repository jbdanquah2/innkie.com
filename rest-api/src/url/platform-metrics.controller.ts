import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PlatformMetricsService } from '../services/platform-metrics.service';
import { PlatformUsageEvent } from '@innkie/shared-models';

@Controller('api/metrics')
export class PlatformMetricsController {
  constructor(private readonly metricsService: PlatformMetricsService) {}

  @Post('event')
  async logEvent(@Body() event: PlatformUsageEvent) {
    return this.metricsService.logEvent(event);
  }

  @Get('summary')
  async getSummary(
    @Query('workspaceId') workspaceId: string,
    @Query('days') days: number
  ) {
    return this.metricsService.getWorkspaceSummary(workspaceId, days);
  }

  @Get('recent')
  async getRecentEvents(
    @Query('workspaceId') workspaceId: string,
    @Query('limit') limit: number
  ) {
    return this.metricsService.getRecentEvents(workspaceId, limit);
  }
}
