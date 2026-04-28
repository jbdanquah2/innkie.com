import { Controller, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace } from '../utils/workspace.utils';

@Controller('api')
export class ShortenUrlController {
  constructor(
    private readonly shortenUrlService: ShortenUrlService,
    private readonly firebase: FirebaseService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post('shorten-url')
  @UseGuards(FirebaseAuthGuard)
  async shorten(
    @Body('originalUrl') originalUrl: string, 
    @Req() req: any,
    @Body('workspaceId') workspaceId?: string,
  ) {
    const userId = req.user.uid;
    originalUrl = originalUrl.trim();
    
    if (!originalUrl || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
      return { error: 'Please enter a valid URL starting with http:// or https://' };
    }

    if (workspaceId && !isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to create links in this workspace');
      }
    }

    const result = await this.shortenUrlService.createShortUrl(originalUrl, userId, workspaceId);
    return result;
  }
}
