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
import { ShortUrl, isPersonalWorkspace } from '@innkie/shared-models';

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

    // If it's the user's OWN personal workspace, use personal links logic
    if (workspaceId === `personal_${userId}` || workspaceId === 'personal') {
      return this.shortenUrlService.getUserPersonalLinks(userId);
    }

    // Protect other users' personal workspaces from being queried
    if (isPersonalWorkspace(workspaceId)) {
      throw new ForbiddenException('You do not have access to another user\'s personal workspace');
    }

    // For team workspaces, verify viewer access
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

    await this.verifyLinkModificationAccess(link, userId);

    return this.shortenUrlService.updateShortUrl(shortCode, updates);
  }

  @Delete(':shortCode')
  async deleteLink(@Param('shortCode') shortCode: string, @Req() req: any) {
    const userId = req.user.uid;
    const link = await this.shortenUrlService.getShortUrl(shortCode);
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.verifyLinkModificationAccess(link, userId);

    return this.shortenUrlService.deleteShortUrl(shortCode);
  }

  private async verifyLinkModificationAccess(link: ShortUrl, userId: string) {
    // 1. User's own personal workspace link
    if (link.workspaceId === `personal_${userId}`) {
      return;
    }

    // 2. Legacy personal or unassigned link -> strictly check user ownership
    if (!link.workspaceId || link.workspaceId === 'personal') {
      if (link.userId !== userId) {
        throw new ForbiddenException('You do not have permission to modify this link');
      }
      return;
    }

    // 3. Team workspace -> verify editor permissions
    const hasAccess = await this.workspaceService.verifyAccess(link.workspaceId, userId, ['editor']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to modify links in this workspace');
    }
  }
}
