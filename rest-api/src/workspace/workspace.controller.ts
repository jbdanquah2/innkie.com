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
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { ApiKeyService } from './api-key.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import * as Models from '@innkie/shared-models';

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
    return this.workspaceService.createWorkspace(name, userId, email);
  }

  @Get()
  async getWorkspaces(@Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email;
    console.log(`[WorkspaceController] GET /workspaces for user: ${userId}, email: ${email}`);
    return this.workspaceService.getUserWorkspaces(userId, email);
  }

  @Get(':id')
  async getWorkspace(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['viewer']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
    return this.workspaceService.getWorkspace(id);
  }

  @Put(':id')
  async updateWorkspace(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to update this workspace');
    }
    return this.workspaceService.updateWorkspace(id, data);
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
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to add members');
    }
    return this.workspaceService.addMember(id, email, role);
  }

  @Put(':id/members/:uid/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('uid') memberUid: string,
    @Body('role') role: Models.WorkspaceRole,
    @Req() req: any,
  ) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to manage member roles');
    }
    return this.workspaceService.updateMemberRole(id, memberUid, role);
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
    return this.workspaceService.removeMember(id, memberUid);
  }

  @Post(':id/api-key')
  async rotateApiKey(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.uid;
    const hasAccess = await this.workspaceService.verifyAccess(id, userId, ['admin']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to manage API keys');
    }
    const apiKey = await this.apiKeyService.generateApiKey(id);
    return { apiKey };
  }
}
