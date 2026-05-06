import { Controller, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';
import { OptionalFirebaseAuthGuard } from '../auth/guards/optional-firebase-auth.guard';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace } from '@innkie/shared-models';
import { Throttle } from '@nestjs/throttler';

@Controller('api')
export class ShortenUrlController {
  constructor(
    private readonly shortenUrlService: ShortenUrlService,
    private readonly firebase: FirebaseService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('shorten-url')
  @UseGuards(OptionalFirebaseAuthGuard)
  async shorten(
    @Body('originalUrl') originalUrl: string, 
    @Req() req: any,
    @Body('workspaceId') workspaceId?: string,
    @Body('customAlias') customAlias?: string,
    @Body('tags') tags?: string[],
  ) {
    const userId = req.user?.uid;
    originalUrl = (originalUrl || '').trim();
    
    if (!originalUrl || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
      return { error: 'Please enter a valid URL starting with http:// or https://' };
    }

    // Guest users cannot specify a workspace
    if (!userId && workspaceId) {
      workspaceId = undefined;
    }

    if (userId && workspaceId && !isPersonalWorkspace(workspaceId)) {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to create links in this workspace');
      }
    }

    const result = await this.shortenUrlService.createShortUrl(originalUrl, userId, workspaceId, 'ui', null, customAlias, tags);
    return result;
  }
}
