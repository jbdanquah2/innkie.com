import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { ApiKeyService } from './api-key.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import * as Models from '@innkie/shared-models';
import { assignableRole, requireEmail, requireName, sanitizeWorkspaceUpdate } from '../utils/validation.util';
import { toWorkspaceOut } from '../utils/secrets.util';

@Controller('api/v1/workspaces')
@UseGuards(FirebaseAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Post()
  async createWorkspace(@Body('name') name: string, @Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email;
    return toWorkspaceOut(await this.workspaceService.createWorkspace(requireName(name), userId, email));
  }

  @Get()
  async getWorkspaces(@Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email;
    console.log(`[WorkspaceController] GET /workspaces for user: ${userId}, email: ${email}`);
    return (await this.workspaceService.getUserWorkspaces(userId, email)).map((w) => toWorkspaceOut(w));
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['viewer']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
    return toWorkspaceOut(await this.workspaceService.getWorkspace(id));
  }

  @Put(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const updates = sanitizeWorkspaceUpdate(data);
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to update this workspace');
    }
    return this.workspaceService.updateWorkspace(id, updates);
  }

  @Delete(':id')
  async deleteWorkspace(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['owner']);
    if (!hasAccess) {
      throw new ForbiddenException('Only the owner can delete the workspace');
    }
    return this.workspaceService.deleteWorkspace(id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body('email') email: string,
    @Body('role') role: Models.WorkspaceRole,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const cleanEmail = requireEmail(email);
    const cleanRole = assignableRole(role);
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to add members');
    }
    return this.workspaceService.addMember(id, cleanEmail, cleanRole);
  }

  @Put(':id/members/:uid/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('uid') memberUid: string,
    @Body('role') role: Models.WorkspaceRole,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const cleanRole = assignableRole(role);
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to manage member roles');
    }
    await this.assertCanManageMember(id, userId, memberUid);
    return this.workspaceService.updateMemberRole(id, memberUid, cleanRole);
  }

  @Delete(':id/members/:uid')
  async removeMember(
    @Param('id') id: string,
    @Param('uid') memberUid: string,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to remove members');
    }
    await this.assertCanManageMember(id, userId, memberUid);
    return this.workspaceService.removeMember(id, memberUid);
  }

  @Post(':id/api-key')
  async rotateApiKey(@Param('id') id: string, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to manage API keys');
    }
    // The only time the full key is ever returned; it must not be cached anywhere.
    res.setHeader('Cache-Control', 'no-store');
    return this.apiKeyService.generateApiKey(id, userId);
  }

  /**
   * Admins may manage editors and viewers (and leave on their own). Changing or removing an owner or another admin
   * needs the owner, so an admin cannot take over the workspace.
   */
  private async assertCanManageMember(workspaceId: string, actorUid: string, targetUid: string) {
    const ws = await this.workspaceService.getWorkspace(workspaceId);
    const actor = ws.members.find((m) => m.uid === actorUid);
    const target = ws.members.find((m) => m.uid === targetUid);
    if (!target) return; // the service reports "not found"
    if (actor?.role !== 'owner' && actorUid !== targetUid && (target.role === 'owner' || target.role === 'admin')) {
      throw new ForbiddenException('Only the workspace owner can change or remove an owner or admin');
    }
    if (actor?.role !== 'owner' && target.role === 'owner') {
      throw new ForbiddenException('Only the workspace owner can change or remove an owner');
    }
  }
}
