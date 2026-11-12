import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Put,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { sanitizeWebhookInput } from '../utils/validation.util';
import { WebhookService } from '../services/webhook.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace, WorkspaceRole, WebhookEvent } from '@innkie/shared-models';
import { validateSafeUrl } from '../utils/ssrf.utils';
import { toWebhookOut } from '../utils/secrets.util';

@Controller('api/webhooks')
@UseGuards(FirebaseAuthGuard)
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  private async verifyWorkspacePermissions(
    workspaceId: string,
    userId: string,
    roles: WorkspaceRole[],
  ) {
    if (isPersonalWorkspace(workspaceId)) {
      if (workspaceId !== `personal_${userId}` && workspaceId !== 'personal') {
        throw new ForbiddenException('You do not have access to this personal workspace');
      }
      return;
    }

    const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, roles);
    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions in this workspace');
    }
  }

  @Post()
  async createWebhook(@Body() body: any, @Req() req: any) {
    const { workspaceId, name, url, events } = sanitizeWebhookInput(body);
    const userId = req.user.uid;

    try {
      await validateSafeUrl(url);
    } catch (err: any) {
      throw new BadRequestException(`Invalid webhook destination: ${err.message}`);
    }

    await this.verifyWorkspacePermissions(workspaceId, userId, ['admin']);

    return this.webhookService.createWebhook(workspaceId, name, url, events as WebhookEvent[]);
  }

  @Get()
  async getWebhooks(@Query('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;
    await this.verifyWorkspacePermissions(workspaceId, userId, ['viewer']);
    // Signing secrets are for owners and admins; everyone else sees the webhook without it.
    const canSeeSecret = isPersonalWorkspace(workspaceId) || (await this.workspaceService.verifyAccess(workspaceId, userId, ['admin']));
    const hooks = await this.webhookService.getWorkspaceWebhooks(workspaceId);
    return hooks.map((h) => toWebhookOut(h, canSeeSecret));
  }

  @Put(':id/toggle')
  async toggleWebhook(
    @Param('id') id: string,
    @Body('workspaceId') workspaceId: string,
    @Body('isActive') isActive: boolean,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    if (typeof isActive !== 'boolean') throw new BadRequestException('isActive must be a boolean');
    await this.verifyWorkspacePermissions(workspaceId, userId, ['admin']);
    return this.webhookService.toggleWebhook(id, workspaceId, isActive);
  }

  @Delete(':id')
  async deleteWebhook(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    await this.verifyWorkspacePermissions(workspaceId, userId, ['admin']);
    return this.webhookService.deleteWebhook(id, workspaceId);
  }
}
