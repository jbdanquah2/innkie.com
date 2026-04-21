import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Query, Put } from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('api/webhooks')
@UseGuards(FirebaseAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async createWebhook(@Body() body: any) {
    const { workspaceId, name, url, events } = body;
    return this.webhookService.createWebhook(workspaceId, name, url, events);
  }

  @Get()
  async getWebhooks(@Query('workspaceId') workspaceId: string) {
    return this.webhookService.getWorkspaceWebhooks(workspaceId);
  }

  @Put(':id/toggle')
  async toggleWebhook(@Param('id') id: string, @Body('workspaceId') workspaceId: string, @Body('isActive') isActive: boolean) {
    return this.webhookService.toggleWebhook(id, workspaceId, isActive);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.webhookService.deleteWebhook(id, workspaceId);
  }
}
