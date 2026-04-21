import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { QrService } from '../services/qr.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('api/qr')
@UseGuards(FirebaseAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('templates')
  async createTemplate(@Body() body: any, @Req() req: any) {
    const { workspaceId, name, config } = body;
    return this.qrService.createTemplate(workspaceId, req.user.uid, name, config);
  }

  @Get('templates')
  async getTemplates(@Query('workspaceId') workspaceId: string, @Req() req: any) {
    if (workspaceId && workspaceId !== 'personal') {
      return this.qrService.getWorkspaceTemplates(workspaceId);
    }
    return this.qrService.getPersonalTemplates(req.user.uid);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @Req() req: any) {
    return this.qrService.deleteTemplate(id, req.user.uid);
  }
}
