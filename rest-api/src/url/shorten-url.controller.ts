import { Controller, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ShortenUrlService } from '../services/shorten-url.service';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';
import { OptionalFirebaseAuthGuard } from '../auth/guards/optional-firebase-auth.guard';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace } from '@innkie/shared-models';
import { Throttle } from '@nestjs/throttler';
import { sanitizeLinkCreate } from '../utils/link-update.util';

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
  async shorten(@Body() body: any, @Req() req: any) {
    const userId = req.user?.uid;
    const input = sanitizeLinkCreate(body);
    const { originalUrl, customAlias, tags, passwordProtected, password, expiration, campaign } = input;
    let workspaceId = input.workspaceId;

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

    const result = await this.shortenUrlService.createShortUrl(
      originalUrl, 
      userId, 
      workspaceId, 
      'ui', 
      campaign || null, 
      customAlias, 
      tags,
      { passwordProtected, password, expiration }
    );
    return result;
  }
}
