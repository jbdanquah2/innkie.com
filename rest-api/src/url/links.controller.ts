import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '../utils/workspace.utils';
import { ShortUrl } from '@innkie/shared-models';

@Controller('api/v1/links')
@UseGuards(FirebaseAuthGuard)
export class LinksController {
  constructor(
    private readonly shortenUrlService: ShortenUrlService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get('workspace/:workspaceId')
  async getWorkspaceLinks(@Param('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;

    // If it's the user's OWN personal workspace, we use the personal links logic 
    // (which handles legacy null/personal IDs).
    if (workspaceId === `personal_${userId}` || workspaceId === 'personal') {
      return this.shortenUrlService.getUserPersonalLinks(userId);
    }

    // For any other workspace (Team or a Shared Personal Workspace),
    // we verify access and then fetch all links assigned to that workspace.
    const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace links');
    }

    return this.shortenUrlService.getWorkspaceLinks(workspaceId);
  }

  @Put(':shortCode')
  async updateLink(
    @Param('shortCode') shortCode: string,
    @Body() updates: Partial<ShortUrl>,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const link = await this.shortenUrlService.getShortUrl(shortCode);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    // If it's the user's OWN private personal link, they can edit.
    if (link.workspaceId === `personal_${userId}` || link.workspaceId === 'personal') {
      // User is the owner of this personal space
    } else {
      // It's a Team workspace OR a shared Personal Workspace belonging to someone else.
      // We must verify the user has 'editor' permissions in that workspace.
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId!, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to edit links in this workspace');
      }
    }

    return this.shortenUrlService.updateShortUrl(shortCode, updates);
  }

  @Delete(':shortCode')
  async deleteLink(@Param('shortCode') shortCode: string, @Req() req: any) {
    const userId = req.user.uid;
    const link = await this.shortenUrlService.getShortUrl(shortCode);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    if (link.workspaceId === `personal_${userId}` || link.workspaceId === 'personal') {
      // User is the owner
    } else {
      const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId!, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to delete links in this workspace');
      }
    }

    return this.shortenUrlService.deleteShortUrl(shortCode);
  }
}
