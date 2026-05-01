import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { QrService } from '../services/qr.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '@innkie/shared-models';
import { WorkspaceService } from '../workspace/workspace.service';

@Controller('api/qr')
@UseGuards(FirebaseAuthGuard)
export class QrController {
  constructor(
    private readonly qrService: QrService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post('templates')
  async createTemplate(@Body() body: any, @Req() req: any) {
    const { workspaceId, name, config } = body;
    const userId = req.user.uid;

    // Verify access if it's not the user's OWN personal workspace
    if (workspaceId && workspaceId !== `personal_${userId}` && workspaceId !== 'personal') {
      const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to create templates in this workspace');
      }
    }

    return this.qrService.createTemplate(workspaceId, userId, name, config);
  }

  @Get('templates')
  async getTemplates(@Query('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;
    
    // If it's the user's OWN personal workspace, show their private templates
    if (workspaceId === `personal_${userId}` || workspaceId === 'personal' || !workspaceId) {
      return this.qrService.getPersonalTemplates(userId, workspaceId);
    }
    
    // For any other workspace (Team or a Shared Personal Workspace),
    // we verify access and then fetch all templates assigned to that workspace.
    const hasAccess = await this.workspaceService.verifyAccess(workspaceId, userId, ['viewer']);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this workspace templates');
    }
    
    return this.qrService.getWorkspaceTemplates(workspaceId);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const { name, config } = body;
    const userId = req.user.uid;
    // Security: Service layer should ideally handle internal check by fetching template first,
    // but we check ownership/workspace in service.
    return this.qrService.updateTemplate(id, userId, name, config);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.qrService.deleteTemplate(id, req.user.uid);
  }
}
