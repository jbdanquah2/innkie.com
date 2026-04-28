import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Query, Put, ForbiddenException } from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace } from '../utils/workspace.utils';

@Controller('api/webhooks')
@UseGuards(FirebaseAuthGuard)
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post()
  async createWebhook(@Body() body: any, @Req() req: any) {
    const { workspaceId, name, url, events } = body;
    const userId = req.user.uid;

    if (!isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['admin']);
      if (!hasAccess) {
        throw new ForbiddenException('Only admins can create webhooks');
      }
    }

    return this.webhookService.createWebhook(workspaceId, name, url, events);
  }

  @Get()
  async getWebhooks(@Query('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;

    if (!isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to these webhooks');
      }
    }

    return this.webhookService.getWorkspaceWebhooks(workspaceId);
  }

  @Put(':id/toggle')
  async toggleWebhook(
    @Param('id') id: string, 
    @Body('workspaceId') workspaceId: string, 
    @Body('isActive') isActive: boolean,
    @Req() req: any
  ) {
    const userId = req.user.uid;
    if (!isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['admin']);
      if (!hasAccess) {
        throw new ForbiddenException('Only admins can manage webhooks');
      }
    }
    return this.webhookService.toggleWebhook(id, workspaceId, isActive);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;
    if (!isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['admin']);
      if (!hasAccess) {
        throw new ForbiddenException('Only admins can delete webhooks');
      }
    }
    return this.webhookService.deleteWebhook(id, workspaceId);
  }
}
