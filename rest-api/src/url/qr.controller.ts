import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { QrService } from '../services/qr.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { isPersonalWorkspace } from '../utils/workspace.utils';

@Controller('api/qr')
@UseGuards(FirebaseAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('templates')
  async createTemplate(@Body() body: any, @Req() req: any) {
    const { workspaceId, name, config } = body;
    const userId = req.user.uid;
    return this.qrService.createTemplate(workspaceId, userId, name, config);
  }

  @Get('templates')
  async getTemplates(@Query('workspaceId') workspaceId: string, @Req() req: any) {
    const userId = req.user.uid;
    
    if (!isPersonalWorkspace(workspaceId)) {
      return this.qrService.getWorkspaceTemplates(workspaceId);
    }
    
    return this.qrService.getPersonalTemplates(userId, workspaceId);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const { name, config } = body;
    return this.qrService.updateTemplate(id, req.user.uid, name, config);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.qrService.deleteTemplate(id, req.user.uid);
  }
}
