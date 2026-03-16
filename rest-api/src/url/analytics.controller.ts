import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';

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
}
